/**
 * approve-withdrawal
 * -----------------------------------------------------------------------------------------
 * Called by the AdChasser admin panel when an admin approves or rejects a
 * pending withdrawal request.
 *
 * Flow (approve):
 *   1. Authenticate caller as super-admin (hardcoded UUID match)
 *   2. Validate input (withdrawalId, action='approve')
 *   3. Load the withdrawal — must be in 'pending_approval'
 *      (idempotent: any other state returns current row unchanged)
 *   4. Load the linked payment method to get paystack_recipient_code
 *   5. Call Paystack /transfer
 *   6. If Paystack response.status === 'otp':
 *        Refuse loudly. Withdrawal stays in 'pending_approval', balance stays
 *        reserved. Admin must disable transfer OTP at Paystack dashboard
 *        before retrying.
 *   7. Otherwise (status: 'success' | 'pending' | other):
 *        Update withdrawal to 'transferring' with transfer_code + reference
 *        + approved_at + approved_by + auto_approved=false. Webhook handles
 *        the rest.
 *   8. On Paystack network/validation failure: leave withdrawal in
 *        'pending_approval' so admin can retry. Return the error to admin UI.
 *
 * Flow (reject):
 *   1-3. Same as approve.
 *   4. Call refund_withdrawal(withdrawalId, 'cancelled', reason).
 *      That DB function atomically refunds available_balance and marks
 *      the withdrawal as 'cancelled'.
 *   5. Return the updated withdrawal.
 *
 * Failure modes:
 *   - 400 VALIDATION_ERROR              bad input
 *   - 401 UNAUTHENTICATED               no/invalid JWT
 *   - 403 UNAUTHORIZED                  caller is not super-admin
 *   - 404 WITHDRAWAL_NOT_FOUND          withdrawalId doesn't exist
 *   - 404 PAYMENT_METHOD_NOT_FOUND      linked method doesn't exist
 *   - 422 INVALID_AMOUNT                'transfer_otp_required' or other
 *                                       business-rule violation
 *   - 502 PAYSTACK_ERROR                Paystack rejected (4xx)
 *   - 503 PAYSTACK_UNAVAILABLE          Paystack 5xx / network / timeout
 *   - 500 DATABASE_ERROR / INTERNAL_ERROR
 *
 * Idempotency:
 *   - If the withdrawal is already 'transferring', 'completed', 'failed',
 *     or 'cancelled', return its current state unchanged. Two clicks of
 *     "Approve" by the admin are safe.
 */

import { z } from 'zod';

import { handleCorsPreflightRequest } from '../_shared/cors.ts';
import {
  NotFoundError,
  UnauthorizedError,
  BusinessRuleError,
  DatabaseError,
  InternalError,
} from '../_shared/errors.ts';
import {
  createLoggerFromRequest,
  type Logger,
} from '../_shared/logger.ts';
import {
  PaystackClient,
  type InitiateTransferResponse,
} from '../_shared/paystack.ts';
import { jsonOk, jsonError } from '../_shared/response.ts';
import {
  createUserClient,
  createServiceClient,
} from '../_shared/supabase.ts';
import { requireUser } from '../_shared/auth.ts';
import {
  parseOrThrow,
  readJsonBody,
  UuidSchema,
} from '../_shared/validation.ts';

// Super-admin UUID (mirrors RLS policies and initialize-payment).
const SUPER_ADMIN_UUID = '4a05e9c5-005b-4dba-8160-5b3354c5df37';

// Input schema — discriminated by `action`.
const InputSchema = z.discriminatedUnion('action', [
  z.object({
    action:        z.literal('approve'),
    withdrawalId:  UuidSchema,
  }),
  z.object({
    action:           z.literal('reject'),
    withdrawalId:     UuidSchema,
    rejectionReason:  z.string().min(1).max(500),
  }),
]);

interface WithdrawalOut {
  id:               string;
  status:           string;
  amountKobo:       number;
  approvedAt:       string | null;
  approvedBy:       string | null;
  failureReason:    string | null;
  paystackTransferCode: string | null;
  paystackReference:    string | null;
}

// Logger.requestId is private; mirror the helper used in initialize-payment.
function getRequestId(logger: Logger): string {
  return (logger as unknown as { requestId: string }).requestId;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req);

  const logger = createLoggerFromRequest(req, 'approve-withdrawal');

  try {
    if (req.method !== 'POST') {
      return jsonError(req, logger, new BusinessRuleError('INVALID_AMOUNT', 'Method not allowed'));
    }

    // 1. Auth
    const userClient = createUserClient(req);
    const user = await requireUser(userClient);

    if (user.id !== SUPER_ADMIN_UUID) {
      logger.warn('Non-admin attempted to approve withdrawal', { userId: user.id });
      throw new UnauthorizedError('Only super-admin can approve withdrawals');
    }
    logger.info('Super-admin authenticated', { userId: user.id });

    // 2. Parse + validate input
    const rawBody = await readJsonBody(req);
    const input = parseOrThrow(InputSchema, rawBody);

    // 3. Load the withdrawal (service role — admin needs to see all).
    const serviceClient = createServiceClient();

    const wRes = await serviceClient
      .from('withdrawals')
      .select(`
        id, status, amount_kobo, payment_method_id, respondent_id,
        approved_at, approved_by, failure_reason,
        paystack_transfer_code, paystack_reference
      `)
      .eq('id', input.withdrawalId)
      .maybeSingle();

    if (wRes.error) {
      throw new DatabaseError('Failed to load withdrawal', { error: wRes.error.message });
    }
    if (!wRes.data) {
      throw new NotFoundError('WITHDRAWAL_NOT_FOUND', 'No withdrawal with that id');
    }

    const w = wRes.data;

    // Idempotency: if already past pending_approval, return as-is.
    if (w.status !== 'pending_approval') {
      logger.info('Withdrawal not in pending_approval - returning current state', {
        withdrawalId: w.id,
        currentStatus: w.status,
      });
      return jsonOk(req, getRequestId(logger), {
        withdrawal: shapeWithdrawal(w),
        idempotent: true,
      });
    }

    // 4. Branch on action.
    if (input.action === 'reject') {
      return await handleReject(req, logger, serviceClient, w, user.id, input.rejectionReason);
    }

    return await handleApprove(req, logger, serviceClient, w, user.id);
  } catch (err) {
    return jsonError(req, logger, err);
  }
});

// =============================================================================
// APPROVE
// =============================================================================

async function handleApprove(
  req:           Request,
  logger:        Logger,
  // deno-lint-ignore no-explicit-any
  serviceClient: any,
  withdrawal:    WithdrawalRow,
  adminId:       string,
): Promise<Response> {
  // 1. Load the linked payment method to get paystack_recipient_code.
  const pmRes = await serviceClient
    .from('respondent_payment_methods')
    .select('id, paystack_recipient_code, is_active, account_number, bank_name')
    .eq('id', withdrawal.payment_method_id)
    .maybeSingle();

  if (pmRes.error) {
    throw new DatabaseError('Failed to load payment method', { error: pmRes.error.message });
  }
  if (!pmRes.data) {
    throw new NotFoundError('PAYMENT_METHOD_NOT_FOUND', 'Linked payment method not found');
  }
  const pm = pmRes.data;

  if (!pm.is_active) {
    // Should not happen — request_withdrawal blocks inactive methods at request time.
    // But check anyway in case method was deactivated between request and approval.
    throw new BusinessRuleError(
      'INVALID_AMOUNT',
      'Linked payment method is no longer active. Reject this withdrawal and ask the respondent to re-verify their bank account.',
    );
  }
  if (!pm.paystack_recipient_code) {
    throw new BusinessRuleError(
      'INVALID_AMOUNT',
      'Payment method has no paystack_recipient_code. Cannot transfer.',
    );
  }

  // 2. Initiate transfer with Paystack.
  const paystack = new PaystackClient(logger);

  let transferResp: InitiateTransferResponse;
  try {
    transferResp = await paystack.initiateTransfer({
      source:    'balance',
      amount:    Number(withdrawal.amount_kobo),
      recipient: pm.paystack_recipient_code,
      reason:    `AdChasser respondent payout (${withdrawal.id.slice(0, 8)})`,
    });
  } catch (err) {
    // Paystack failed — leave withdrawal in pending_approval so admin can retry
    // after addressing the underlying issue. Balance stays reserved.
    logger.error('Paystack initiateTransfer failed', {
      withdrawalId: withdrawal.id,
      error:        err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  // 3. OTP guard. If Paystack returned 'otp', the transfer is sitting in limbo
  //    until someone calls /transfer/finalize_transfer with the OTP. We refuse
  //    to leave the withdrawal in this ambiguous state.
  //
  //    The withdrawal stays in pending_approval and balance stays reserved.
  //    Admin must disable transfer OTP at:
  //      Paystack Dashboard -> Settings -> Preferences -> Disable Transfer OTP
  //    then retry the approval.
  //
  //    Note: Paystack already initiated the transfer record on their side
  //    (transferResp.id exists). It will sit dormant until OTP is provided
  //    or the merchant cancels it. This is acceptable — it does not affect
  //    AdChasser's accounting because we haven't recorded transfer_code yet.
  if (transferResp.status === 'otp') {
    logger.warn('Paystack returned status=otp - refusing to mark transferring', {
      withdrawalId: withdrawal.id,
      transferCode: transferResp.transfer_code,
    });
    throw new BusinessRuleError(
      'INVALID_AMOUNT',
      'Transfer OTP is enabled on your Paystack account. Disable it at Settings -> Preferences -> Disable Transfer OTP, then retry approval.',
      {
        paystackStatus:      transferResp.status,
        paystackTransferCode: transferResp.transfer_code,
        remediation:         'Disable transfer OTP in Paystack dashboard',
      },
    );
  }

  // 4. Update withdrawal: transferring + Paystack identifiers + approval audit.
  const updRes = await serviceClient
    .from('withdrawals')
    .update({
      status:                 'transferring',
      paystack_transfer_code: transferResp.transfer_code,
      paystack_reference:     transferResp.reference,
      approved_at:            new Date().toISOString(),
      approved_by:            adminId,
      auto_approved:          false,
    })
    .eq('id', withdrawal.id)
    .eq('status', 'pending_approval')   // concurrency guard: only flip if still pending
    .select(`
      id, status, amount_kobo, approved_at, approved_by, failure_reason,
      paystack_transfer_code, paystack_reference
    `)
    .maybeSingle();

  if (updRes.error) {
    // Critical: Paystack already created the transfer but our DB update failed.
    // We have a transfer_code that's not recorded. Log loudly so it can be
    // reconciled manually.
    logger.error('Paystack transfer initiated but DB update FAILED - manual reconciliation needed', {
      withdrawalId:          withdrawal.id,
      paystackTransferCode:  transferResp.transfer_code,
      paystackReference:     transferResp.reference,
      paystackStatus:        transferResp.status,
      dbError:               updRes.error.message,
    });
    throw new DatabaseError(
      'Transfer initiated at Paystack but local update failed. Operations team must reconcile manually.',
      {
        transferCode: transferResp.transfer_code,
        reference:    transferResp.reference,
      },
    );
  }
  if (!updRes.data) {
    // Withdrawal status wasn't pending_approval anymore — concurrent race.
    // The transfer DID start at Paystack, but our row is in some other state.
    logger.error('Withdrawal status changed during approval (race) - manual reconciliation needed', {
      withdrawalId:         withdrawal.id,
      paystackTransferCode: transferResp.transfer_code,
      paystackReference:    transferResp.reference,
    });
    throw new InternalError(
      'Withdrawal status changed during approval. Operations team must reconcile manually.',
    );
  }

  logger.info('Withdrawal approved and transfer initiated', {
    withdrawalId:         withdrawal.id,
    paystackTransferCode: transferResp.transfer_code,
    paystackStatus:       transferResp.status,
  });

  return jsonOk(req, getRequestId(logger), {
    withdrawal:     shapeWithdrawal(updRes.data),
    paystackStatus: transferResp.status,
  });
}

// =============================================================================
// REJECT
// =============================================================================

async function handleReject(
  req:             Request,
  logger:          Logger,
  // deno-lint-ignore no-explicit-any
  serviceClient:   any,
  withdrawal:      WithdrawalRow,
  adminId:         string,
  rejectionReason: string,
): Promise<Response> {
  // refund_withdrawal atomically: refunds available_balance + marks 'cancelled'.
  const rpcRes = await serviceClient.rpc('refund_withdrawal', {
    p_withdrawal_id: withdrawal.id,
    p_new_status:    'cancelled',
    p_reason:        rejectionReason,
    p_event_id:      null,
  });

  if (rpcRes.error) {
    throw new DatabaseError('refund_withdrawal failed during reject', {
      message: rpcRes.error.message,
    });
  }

  // Also stamp approved_by/approved_at so we can audit who rejected when.
  // (We re-purpose those columns for "decided_at/decided_by" — same audit need.)
  const updRes = await serviceClient
    .from('withdrawals')
    .update({
      approved_at:   new Date().toISOString(),
      approved_by:   adminId,
      auto_approved: false,
    })
    .eq('id', withdrawal.id)
    .select(`
      id, status, amount_kobo, approved_at, approved_by, failure_reason,
      paystack_transfer_code, paystack_reference
    `)
    .maybeSingle();

  if (updRes.error || !updRes.data) {
    // Refund already happened; just log the audit-stamp failure.
    logger.error('Reject completed but audit stamp failed', {
      withdrawalId: withdrawal.id,
      dbError:      updRes.error?.message,
    });
    throw new DatabaseError('Reject completed but audit stamp failed');
  }

  logger.info('Withdrawal rejected and refunded', {
    withdrawalId: withdrawal.id,
    reason:       rejectionReason,
  });

  return jsonOk(req, getRequestId(logger), {
    withdrawal: shapeWithdrawal(updRes.data),
  });
}

// =============================================================================
// HELPERS
// =============================================================================

interface WithdrawalRow {
  id:                       string;
  status:                   string;
  amount_kobo:              number;
  payment_method_id:        string;
  respondent_id:            string;
  approved_at:              string | null;
  approved_by:              string | null;
  failure_reason:           string | null;
  paystack_transfer_code:   string | null;
  paystack_reference:       string | null;
}

function shapeWithdrawal(row: WithdrawalRow): WithdrawalOut {
  return {
    id:                   row.id,
    status:               row.status,
    amountKobo:           Number(row.amount_kobo),
    approvedAt:           row.approved_at,
    approvedBy:           row.approved_by,
    failureReason:        row.failure_reason,
    paystackTransferCode: row.paystack_transfer_code,
    paystackReference:    row.paystack_reference,
  };
}
