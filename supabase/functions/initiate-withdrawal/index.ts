/**
 * initiate-withdrawal
 * -----------------------------------------------------------------------------------------
 * Called by the respondent wallet when a user clicks "Withdraw".
 *
 * Flow:
 *   1. Authenticate caller as a respondent (resolve their respondent profile)
 *   2. Validate input (paymentMethodId, amountKobo)
 *   3. Hard floor: amount >= MINIMUM_WITHDRAWAL_KOBO
 *   4. Check daily withdrawal cap (sum of today's non-failed withdrawals)
 *   5. Atomically reserve balance via request_withdrawal() DB function
 *   6. Return the new pending_approval withdrawal row
 *
 * This function does NOT initiate the Paystack transfer. Transfer initiation
 * is decoupled and happens in:
 *   - approve-withdrawal Edge Function (admin manual approval) — Phase 5
 *   - auto-approve cron job (when feature flag is on) — deferred to v2
 *
 * Idempotency:
 *   - No idempotency key for v1. A respondent who hits "Withdraw" twice
 *     in fast succession may create two pending requests; the second will
 *     fail with INSUFFICIENT_BALANCE because the first decremented the balance.
 *
 * Failure modes:
 *   - 400 VALIDATION_ERROR / INVALID_AMOUNT     bad input
 *   - 401 UNAUTHENTICATED                       no/invalid JWT
 *   - 404 RESPONDENT_NOT_FOUND                  user has no respondent profile
 *   - 404 PAYMENT_METHOD_NOT_FOUND              method id doesn't exist or wrong owner
 *   - 422 INSUFFICIENT_BALANCE                  balance < amount
 *   - 422 BELOW_MINIMUM_WITHDRAWAL              amount < platform minimum
 *   - 422 DAILY_LIMIT_EXCEEDED                  sum of today's withdrawals + amount > cap
 *   - 422 INVALID_AMOUNT                        flagged account / inactive payment method
 *   - 500 DATABASE_ERROR / INTERNAL_ERROR
 */

import { z } from 'zod';

import { handleCorsPreflightRequest } from '../_shared/cors.ts';
import {
  NotFoundError,
  BusinessRuleError,
  DatabaseError,
  InternalError,
} from '../_shared/errors.ts';
import {
  createLoggerFromRequest,
  type Logger,
} from '../_shared/logger.ts';
import { jsonOk, jsonError } from '../_shared/response.ts';
import {
  createUserClient,
  createServiceClient,
} from '../_shared/supabase.ts';
import { requireRespondent } from '../_shared/auth.ts';
import {
  parseOrThrow,
  readJsonBody,
  UuidSchema,
} from '../_shared/validation.ts';

// Hard floor — refuse withdrawals below this regardless of platform settings.
// Below this threshold, Paystack transfer fees would consume too much of the payout.
const MINIMUM_WITHDRAWAL_KOBO = 100_000; // ₦1,000

// Input schema
const InputSchema = z.object({
  paymentMethodId: UuidSchema,
  amountKobo:      z.number().int().positive(),
});

interface WithdrawalOut {
  id:              string;
  status:          string;
  amountKobo:      number;
  paymentMethodId: string;
  requestedAt:     string;
}

// Logger.requestId is private; mirror the helper used in initialize-payment.
function getRequestId(logger: Logger): string {
  return (logger as unknown as { requestId: string }).requestId;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const logger = createLoggerFromRequest(req, 'initiate-withdrawal');

  try {
    if (req.method !== 'POST') {
      return jsonError(req, logger, new BusinessRuleError('INVALID_AMOUNT', 'Method not allowed'));
    }

    // 1. Authenticate as a respondent. requireRespondent() loads the
    //    respondent profile via RLS-bound user client — the user can
    //    only see their own profile.
    const userClient = createUserClient(req);
    const { user, respondent } = await requireRespondent(userClient);
    logger.info('Caller authenticated', { userId: user.id, respondentId: respondent.id });

    // 2. Parse + validate input
    const rawBody = await readJsonBody(req);
    const input = parseOrThrow(InputSchema, rawBody);

    // 3. Refuse withdrawal if account is flagged.
    if (respondent.flagged) {
      throw new BusinessRuleError(
        'INVALID_AMOUNT',
        'This account is under review. Withdrawals are temporarily disabled.',
      );
    }

    // 4. Hard floor check.
    if (input.amountKobo < MINIMUM_WITHDRAWAL_KOBO) {
      throw new BusinessRuleError(
        'BELOW_MINIMUM_WITHDRAWAL',
        `Minimum withdrawal is ₦${(MINIMUM_WITHDRAWAL_KOBO / 100).toLocaleString()}`,
        { minimumKobo: MINIMUM_WITHDRAWAL_KOBO, requestedKobo: input.amountKobo },
      );
    }

    // 5. Load platform settings (service role — settings are platform-wide).
    const serviceClient = createServiceClient();

    const settingsRes = await serviceClient
      .from('platform_settings')
      .select('daily_withdrawal_cap_kobo')
      .eq('id', 1)
      .single();
    if (settingsRes.error || !settingsRes.data) {
      throw new InternalError('Platform settings not configured');
    }
    const dailyCapKobo = Number(settingsRes.data.daily_withdrawal_cap_kobo);

    // 6. Daily cap check — sum non-failed/non-cancelled withdrawals from today (UTC).
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayRes = await serviceClient
      .from('withdrawals')
      .select('amount_kobo, status')
      .eq('respondent_id', respondent.id)
      .gte('requested_at', todayStart.toISOString())
      .in('status', ['pending_approval', 'approved', 'transferring', 'completed']);

    if (todayRes.error) {
      throw new DatabaseError(
        "Failed to read today's withdrawals",
        { error: todayRes.error.message },
      );
    }
    const todayTotalKobo = (todayRes.data ?? [])
      .reduce((sum, row) => sum + Number(row.amount_kobo), 0);

    if (todayTotalKobo + input.amountKobo > dailyCapKobo) {
      throw new BusinessRuleError(
        'DAILY_LIMIT_EXCEEDED',
        `Daily withdrawal cap of ₦${(dailyCapKobo / 100).toLocaleString()} would be exceeded`,
        {
          dailyCapKobo,
          todayTotalKobo,
          requestedKobo:  input.amountKobo,
          remainingKobo:  Math.max(0, dailyCapKobo - todayTotalKobo),
        },
      );
    }

    // 7. Atomic balance reservation + insert pending row.
    //    request_withdrawal() handles balance lock + decrement + insert atomically.
    //    It raises specific Postgres exceptions which we map below.
    const rpcRes = await serviceClient.rpc('request_withdrawal', {
      p_respondent_id:     respondent.id,
      p_payment_method_id: input.paymentMethodId,
      p_amount_kobo:       input.amountKobo,
    });

    if (rpcRes.error) {
      const msg = rpcRes.error.message ?? '';
      logger.warn('request_withdrawal failed', {
        respondentId: respondent.id,
        amountKobo:   input.amountKobo,
        pgError:      msg,
      });

      if (msg.includes('INSUFFICIENT_BALANCE')) {
        throw new BusinessRuleError('INSUFFICIENT_BALANCE', 'Insufficient available balance');
      }
      if (msg.includes('PAYMENT_METHOD_NOT_FOUND')) {
        throw new NotFoundError('PAYMENT_METHOD_NOT_FOUND', 'Payment method not found or not owned by you');
      }
      if (msg.includes('PAYMENT_METHOD_INACTIVE')) {
        throw new BusinessRuleError(
          'INVALID_AMOUNT',
          'Payment method is inactive — please add or re-verify a bank account',
        );
      }
      if (msg.includes('EARNINGS_NOT_FOUND')) {
        throw new NotFoundError('RESPONDENT_NOT_FOUND', 'No earnings record found');
      }
      if (msg.includes('INVALID_AMOUNT')) {
        throw new BusinessRuleError('INVALID_AMOUNT', 'Invalid withdrawal amount');
      }
      throw new DatabaseError('Failed to reserve balance', { error: msg });
    }

    // request_withdrawal returns either a single row or an array (Supabase RPC
    // envelope varies depending on function return type signature). Handle both.
    const data = rpcRes.data as Record<string, unknown> | Record<string, unknown>[] | null;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      throw new InternalError('request_withdrawal returned no row');
    }

    const result: WithdrawalOut = {
      id:              String(row.id),
      status:          String(row.status),
      amountKobo:      Number(row.amount_kobo),
      paymentMethodId: String(row.payment_method_id),
      requestedAt:     String(row.requested_at),
    };

    logger.info('Withdrawal request created', {
      withdrawalId: result.id,
      respondentId: respondent.id,
      amountKobo:   result.amountKobo,
    });

    return jsonOk(req, getRequestId(logger), { withdrawal: result });
  } catch (err) {
    return jsonError(req, logger, err);
  }
});
