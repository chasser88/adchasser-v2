/**
 * paystack-transfer-webhook
 * ----------------------------------------------------------------------------------------
 * Receives webhook notifications from Paystack for outbound transfer events:
 *   - transfer.success  -> complete_withdrawal() (mark completed, bump withdrawn_total)
 *   - transfer.failed   -> refund_withdrawal()   (mark failed, restore balance)
 *   - transfer.reversed -> refund_withdrawal()   (mark failed, restore balance) — same flow
 *   - others            -> log & acknowledge (not handled yet)
 *
 * This mirrors paystack-webhook (inbound payments) but for outbound transfers.
 * The two are separate so:
 *   - inbound vs outbound flows have distinct audit trails
 *   - separate idempotency tables prevent collisions
 *   - separate functions can be deployed/rolled-back independently
 *
 * Security:
 *   - Endpoint is public. We verify HMAC SHA-512 of raw body on every request.
 *   - Idempotency via paystack_transfer_events UNIQUE(event_type, paystack_event_id).
 *
 * Lookup strategy:
 *   - Primary: paystack_transfer_code (TRF_xxx) — set by us when we initiated.
 *   - Fallback: paystack_reference — defensive in case we missed transfer_code.
 *
 * Why we call complete_withdrawal/refund_withdrawal instead of inline UPDATE:
 *   The DB functions are atomic, idempotent, and handle the balance/withdrawn_total
 *   bookkeeping in one shot. They were designed for exactly this caller.
 *
 * We return 200 on successful processing.
 * We return 500 on internal failures so Paystack retries (up to 5 times / 72 hrs).
 *
 * Deployment note:
 *   This function MUST be deployed with --no-verify-jwt flag because Paystack
 *   does NOT include a Supabase auth header. The HMAC signature is our auth.
 *
 *   $ supabase functions deploy paystack-transfer-webhook --no-verify-jwt
 */

import {
  DatabaseError,
  UnauthenticatedError,
  ValidationError,
} from '../_shared/errors.ts';
import {
  createLoggerFromRequest,
  type Logger,
} from '../_shared/logger.ts';
import { verifyWebhookSignature } from '../_shared/paystack.ts';
import { jsonOk, jsonError } from '../_shared/response.ts';
import { createServiceClient } from '../_shared/supabase.ts';

// === Types for Paystack transfer webhook payloads ===
interface PaystackTransferEventPayload {
  event: string;
  data: {
    id: number;                     // Paystack-internal transfer id
    transfer_code?: string;         // TRF_xxxxx
    reference?: string;             // our reference or Paystack-generated
    status?: string;                // 'success' | 'failed' | 'reversed' | etc.
    amount?: number;
    currency?: string;
    recipient?: number | { recipient_code?: string };
    transferred_at?: string;
    failures?: unknown;
    reason?: string;
    [key: string]: unknown;
  };
}

interface HandlerResult {
  processing_result: string;
  detail?: unknown;
}

// === Main handler ===

Deno.serve(async (req: Request) => {
  const logger = createLoggerFromRequest(req, 'paystack-transfer-webhook');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  if (req.method !== 'POST') {
    return jsonError(
      req,
      logger,
      new ValidationError(`Method ${req.method} is not allowed; use POST`),
    );
  }

  try {
    // 1. Read raw body (must be the exact bytes Paystack signed; do NOT
    //    re-serialize a parsed object).
    const rawBody = await req.text();

    // 2. Read signature header.
    const receivedSignature = req.headers.get('x-paystack-signature');
    if (!receivedSignature) {
      logger.warn('Webhook received without signature header', {
        bodyLength: rawBody.length,
      });
      return jsonError(req, logger, new UnauthenticatedError('Missing signature'));
    }

    // 3. HMAC verification.
    const isValid = await verifyWebhookSignature(rawBody, receivedSignature);
    if (!isValid) {
      logger.warn('Invalid webhook signature - rejecting', {
        receivedSignaturePrefix: receivedSignature.slice(0, 16),
        bodyLength:              rawBody.length,
      });
      return jsonError(req, logger, new UnauthenticatedError('Invalid signature'));
    }

    // 4. Parse body.
    let payload: PaystackTransferEventPayload;
    try {
      payload = JSON.parse(rawBody) as PaystackTransferEventPayload;
    } catch {
      logger.warn('Webhook had valid signature but invalid JSON', {
        bodyPrefix: rawBody.slice(0, 512),
      });
      return jsonError(req, logger, new ValidationError('Malformed JSON body'));
    }

    if (!payload.event || !payload.data || typeof payload.data.id !== 'number') {
      logger.warn('Webhook payload missing required fields', {
        event:    payload.event,
        dataKeys: Object.keys(payload.data ?? {}),
      });
      return jsonError(req, logger, new ValidationError('Missing event or data.id'));
    }

    const eventLogger = logger.child({
      eventType:        payload.event,
      paystackEventId:  payload.data.id,
      transferCode:     payload.data.transfer_code,
      reference:        payload.data.reference,
    });

    eventLogger.info('Transfer webhook verified, processing');

    // 5. Idempotency check + record event.
    const serviceClient = createServiceClient();

    const insertRes = await serviceClient
      .from('paystack_transfer_events')
      .insert({
        event_type:        payload.event,
        paystack_event_id: String(payload.data.id),
        reference:         payload.data.reference ?? null,
        payload:           payload as unknown as Record<string, unknown>,
        signature:         receivedSignature,
        processing_result: 'pending',
      })
      .select('id')
      .maybeSingle();

    if (insertRes.error) {
      const pgCode = (insertRes.error as { code?: string }).code;
      if (pgCode === '23505') {
        eventLogger.info('Duplicate transfer event detected - skipping');
        return jsonOk(req, getRequestId(logger), {
          acknowledged: true,
          duplicate:    true,
        });
      }
      throw new DatabaseError('Failed to record paystack_transfer_event', {
        message: insertRes.error.message,
        code:    pgCode,
      });
    }

    if (!insertRes.data?.id) {
      throw new DatabaseError('paystack_transfer_events insert returned no row');
    }

    const eventRowId = insertRes.data.id as string;

    // 6. Dispatch on event type.
    let result: HandlerResult;
    if (payload.event === 'transfer.success') {
      result = await handleTransferSuccess(serviceClient, eventLogger, payload, eventRowId);
    } else if (payload.event === 'transfer.failed' || payload.event === 'transfer.reversed') {
      result = await handleTransferFailedOrReversed(serviceClient, eventLogger, payload, eventRowId);
    } else {
      eventLogger.info('Unhandled transfer event type - acknowledging without action');
      result = { processing_result: 'skipped_no_match', detail: { reason: 'unhandled_event_type' } };
    }

    // 7. Update event row with the result.
    await serviceClient
      .from('paystack_transfer_events')
      .update({
        processing_result: result.processing_result,
        processed_at:      new Date().toISOString(),
      })
      .eq('id', eventRowId);

    eventLogger.info('Transfer webhook processing complete', { result });

    return jsonOk(req, getRequestId(logger), {
      acknowledged:      true,
      processing_result: result.processing_result,
    });
  } catch (err) {
    // 500 -> Paystack retries.
    return jsonError(req, logger, err);
  }
});

// === Handlers ===

async function handleTransferSuccess(
  // deno-lint-ignore no-explicit-any
  client: any,
  logger: Logger,
  payload: PaystackTransferEventPayload,
  eventRowId: string,
): Promise<HandlerResult> {
  const withdrawal = await findWithdrawal(client, logger, payload);
  if (!withdrawal) {
    return {
      processing_result: 'skipped_no_match',
      detail: {
        transferCode: payload.data.transfer_code,
        reference:    payload.data.reference,
      },
    };
  }

  // Idempotency: complete_withdrawal is idempotent (returns row as-is when
  // already completed). But short-circuit here for cleaner logs.
  if (withdrawal.status === 'completed') {
    logger.info('withdrawal already completed - no-op');
    return { processing_result: 'success' };
  }

  // Atomic mark-completed via SECURITY DEFINER function.
  const rpcRes = await client.rpc('complete_withdrawal', {
    p_withdrawal_id: withdrawal.id,
    p_event_id:      eventRowId,
  });

  if (rpcRes.error) {
    const msg = rpcRes.error.message ?? '';
    if (msg.includes('WITHDRAWAL_TERMINAL_STATE')) {
      // The withdrawal was already failed/cancelled — refusing to flip to completed.
      // This shouldn't happen in practice (a transfer can't both fail and succeed).
      // Log loudly; do NOT mutate state.
      logger.error('transfer.success arrived for a terminal-state withdrawal', {
        withdrawalId: withdrawal.id,
        currentStatus: withdrawal.status,
      });
      return { processing_result: 'failed_no_match', detail: { reason: 'terminal_state' } };
    }
    throw new DatabaseError('complete_withdrawal failed', { message: msg });
  }

  logger.info('withdrawal marked completed', { withdrawalId: withdrawal.id });
  return { processing_result: 'success' };
}

async function handleTransferFailedOrReversed(
  // deno-lint-ignore no-explicit-any
  client: any,
  logger: Logger,
  payload: PaystackTransferEventPayload,
  eventRowId: string,
): Promise<HandlerResult> {
  const withdrawal = await findWithdrawal(client, logger, payload);
  if (!withdrawal) {
    return {
      processing_result: 'skipped_no_match',
      detail: {
        transferCode: payload.data.transfer_code,
        reference:    payload.data.reference,
      },
    };
  }

  // refund_withdrawal is idempotent — short-circuit if already terminal.
  if (
    withdrawal.status === 'failed' ||
    withdrawal.status === 'cancelled' ||
    withdrawal.status === 'completed'
  ) {
    logger.info('withdrawal already in terminal state - no-op', {
      currentStatus: withdrawal.status,
    });
    return { processing_result: 'success' };
  }

  const reason = extractFailureReason(payload);

  const rpcRes = await client.rpc('refund_withdrawal', {
    p_withdrawal_id: withdrawal.id,
    p_new_status:    'failed',
    p_reason:        reason,
    p_event_id:      eventRowId,
  });

  if (rpcRes.error) {
    throw new DatabaseError('refund_withdrawal failed', {
      message: rpcRes.error.message,
    });
  }

  logger.info('withdrawal refunded after transfer failure', {
    withdrawalId: withdrawal.id,
    eventType:    payload.event,
    reason,
  });
  return { processing_result: 'success' };
}

// === Helpers ===

interface WithdrawalRef {
  id:     string;
  status: string;
}

/**
 * Locate the withdrawals row that this transfer event refers to.
 * Tries paystack_transfer_code first (most specific), then paystack_reference.
 * Returns null if neither matches.
 */
async function findWithdrawal(
  // deno-lint-ignore no-explicit-any
  client: any,
  logger: Logger,
  payload: PaystackTransferEventPayload,
): Promise<WithdrawalRef | null> {
  const transferCode = payload.data.transfer_code;
  const reference    = payload.data.reference;

  if (transferCode) {
    const res = await client
      .from('withdrawals')
      .select('id, status')
      .eq('paystack_transfer_code', transferCode)
      .maybeSingle();

    if (res.error) {
      throw new DatabaseError('Failed to load withdrawal by transfer_code', {
        message: res.error.message,
      });
    }
    if (res.data) return res.data as WithdrawalRef;
  }

  if (reference) {
    const res = await client
      .from('withdrawals')
      .select('id, status')
      .eq('paystack_reference', reference)
      .maybeSingle();

    if (res.error) {
      throw new DatabaseError('Failed to load withdrawal by reference', {
        message: res.error.message,
      });
    }
    if (res.data) return res.data as WithdrawalRef;
  }

  logger.warn('Transfer event references unknown withdrawal', {
    transferCode,
    reference,
  });
  return null;
}

/**
 * Extract a human-readable reason from a transfer.failed payload.
 * Paystack stores failure detail under data.failures (sometimes a string,
 * sometimes an object) plus a top-level data.reason.
 */
function extractFailureReason(payload: PaystackTransferEventPayload): string {
  const failures = payload.data.failures;
  if (typeof failures === 'string' && failures.length > 0) return failures;
  if (failures && typeof failures === 'object') {
    const obj = failures as Record<string, unknown>;
    const msg = obj.message ?? obj.reason ?? obj.detail;
    if (typeof msg === 'string' && msg.length > 0) return msg;
  }
  if (typeof payload.data.reason === 'string' && payload.data.reason.length > 0) {
    return payload.data.reason;
  }
  return `transfer ${payload.data.status ?? payload.event}`;
}

function getRequestId(logger: Logger): string {
  return (logger as unknown as { requestId: string }).requestId;
}
