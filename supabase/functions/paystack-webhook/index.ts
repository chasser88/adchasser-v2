/**
 * paystack-webhook
 * ----------------------------------------------------------------------------------------
 * Receives webhook notifications from Paystack and reacts to them:
 *   - charge.success -> mark brand_payment as success, set campaign to 'active'
 *   - charge.failed  -> mark brand_payment as failed, revert campaign to 'draft'
 *   - others          -> log & acknowledge (not handled yet)
 *
 * Security:
 *   - The endpoint is public. We verify the HMAC SHA-512 signature on every
 *     request before trusting any content.
 *   - Idempotency is guaranteed by a UNIQUE constraint on
 *     paystack_events(event_type, paystack_event_id). Duplicate deliveries
 *     are detected and skipped.
 *
 * We return 200 on successful processing (so Paystack stops retrying).
 * We return 500 on internal failures (so Paystack retries up to 5 times over 72 hrs).
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

// === Types for Paystack webhook payloads ===
interface PaystackEventPayload {
  event: string;
  data: {
    id: number;
    reference?: string;
    status?: string;
    amount?: number;
    paid_at?: string;
    channel?: string;
    customer?: {
      email?: string;
    };
    [key: string]: unknown;
  };
}

// === Main handler ===

Deno.serve(async (req) => {
  const logger = createLoggerFromRequest(req, 'paystack-webhook');

  // Webhooks are POST only. Reject everything else plainly.
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  if (req.method !== 'POST') {
    return jsonError(req, logger, new ValidationError(
      `Method ${req.method} is not allowed; use POST`,
    ));
  }

  try {
    // 1. Read raw body STRING (not parsed JSON). We need this exact
    //    string for HMAC verification - re-serializing a parsed object would
    //    change whitespace/key ordering and break the signature.
    const rawBody = await req.text();

    // 2. Get signature from header
    const receivedSignature = req.headers.get('x-paystack-signature');
    if (!receivedSignature) {
      logger.warn('Webhook received without signature header', {
        bodyLength: rawBody.length,
      });
      return jsonError(req, logger, new UnauthenticatedError('Missing signature'));
    }

    // 3. Verify HMAC signature
    const isValid = await verifyWebhookSignature(rawBody, receivedSignature);
    if (!isValid) {
      logger.warn('Invalid webhook signature - rejecting', {
        receivedSignaturePrefix: receivedSignature.slice(0, 16),
        bodyLength: rawBody.length,
      });
      return jsonError(req, logger, new UnauthenticatedError('Invalid signature'));
    }

    // 4. Parse payload
    let payload: PaystackEventPayload;
    try {
      payload = JSON.parse(rawBody) as PaystackEventPayload;
    } catch {
      logger.warn('Webhook had valid signature but invalid JSON', {
        bodyPrefix: rawBody.slice(0, 512),
      });
      return jsonError(req, logger, new ValidationError('Malformed JSON body'));
    }

    if (!payload.event || !payload.data || typeof payload.data.id !== 'number') {
      logger.warn('Webhook payload missing required fields', {
        event: payload.event,
        dataKeys: Object.keys(payload.data ?? {}),
      });
      return jsonError(req, logger, new ValidationError('Missing event or data.id'));
    }

    const eventLogger = logger.child({
      eventType: payload.event,
      paystackEventId: payload.data.id,
      reference: payload.data.reference,
    });

    eventLogger.info('Webhook verified, processing');

    // 5. Idempotency check + record event
    const serviceClient = createServiceClient();

    const insertRes = await serviceClient
      .from('paystack_events')
      .insert({
        event_type: payload.event,
        paystack_event_id: payload.data.id,
        reference: payload.data.reference ?? null,
        payload: payload as unknown as Record<string, unknown>,
        signature: receivedSignature,
        processing_result: 'pending',
      })
      .select('id')
      .maybeSingle();

    // If it's a duplicate, the UNIQUE constraint will send an error back.
    // PostgreSQL error code 23505 = unique_violation.
    if (insertRes.error) {
      const pgCode = (insertRes.error as { code?: string }).code;
      if (pgCode === '23505') {
        eventLogger.info('Duplicate event detected - skipping');
        return jsonOk(req, getRequestId(logger), {
          acknowledged: true,
          duplicate: true,
        });
      }
      throw new DatabaseError('Failed to record paystack_event', {
        message: insertRes.error.message,
        code: pgCode,
      });
    }

    if (!insertRes.data?.id) {
      throw new DatabaseError('paystack_events insert returned no row');
    }

    const eventRowId = insertRes.data.id;

    // 6. Dispatch on event type
    let result: { processing_result: string; detail?: unknown };
    if (payload.event === 'charge.success') {
      result = await handleChargeSuccess(serviceClient, eventLogger, payload, eventRowId);
    } else if (payload.event === 'charge.failed') {
      result = await handleChargeFailed(serviceClient, eventLogger, payload, eventRowId);
    } else {
      eventLogger.info('Unhandled event type - acknowledging without action');
      result = { processing_result: 'skipped_no_match', detail: { reason: 'unhandled_event_type' } };
    }

    // 7. Update the event row with result
    await serviceClient
      .from('paystack_events')
      .update({
        processing_result: result.processing_result,
        processed_at: new Date().toISOString(),
      })
      .eq('id', eventRowId);

    eventLogger.info('Webhook processing complete', { result });

    return jsonOk(req, getRequestId(logger), {
      acknowledged: true,
      processing_result: result.processing_result,
    });
  } catch (err) {
    // On internal error: return 500 so Paystack retries.
    return jsonError(req, logger, err);
  }
});

// === Handlers ===

interface HandlerResult {
  processing_result: string;
  detail?: unknown;
}

async function handleChargeSuccess(
  // deno-lint-ignore no-explicit-any
  client: any,
  logger: Logger,
  payload: PaystackEventPayload,
  eventRowId: string,
): Promise<HandlerResult> {
  const reference = payload.data.reference;
  if (!reference) {
    logger.warn('charge.success without reference - skipping');
    return { processing_result: 'skipped_no_match', detail: { reason: 'missing_reference' } };
  }

  // Find the brand_payment row
  const paymentRes = await client
    .from('brand_payments')
    .select('id, campaign_id, status')
    .eq('paystack_reference', reference)
    .maybeSingle();

  if (paymentRes.error) {
    throw new DatabaseError('Failed to load brand_payment', {
      message: paymentRes.error.message,
      code: paymentRes.error.code,
    });
  }

  if (!paymentRes.data) {
    logger.warn('charge.success references unknown brand_payment', { reference });
    return { processing_result: 'skipped_no_match', detail: { reference } };
  }

  const payment = paymentRes.data;

  // Idempotency: if already success, ack and move on
  if (payment.status === 'success') {
    logger.info('brand_payment already success - no-op');
    return { processing_result: 'success' };
  }

  // Update brand_payment
  const updPayment = await client
    .from('brand_payments')
    .update({
      status: 'success',
      processed_at: new Date().toISOString(),
      paystack_event_id: eventRowId,
    })
    .eq('id', payment.id);

  if (updPayment.error) {
    throw new DatabaseError('Failed to update brand_payment to success', {
      message: updPayment.error.message,
    });
  }

  // Update campaign to active (with concurrency guard: only if still pending)
  if (payment.campaign_id) {
    const updCampaign = await client
      .from('campaigns')
      .update({ status: 'active', launched_at: new Date().toISOString() })
      .eq('id', payment.campaign_id)
      .eq('status', 'pending_payment');

    if (updCampaign.error) {
      throw new DatabaseError('Failed to activate campaign', {
        message: updCampaign.error.message,
      });
    }

    logger.info('campaign activated', { campaignId: payment.campaign_id });
  }

  return { processing_result: 'success' };
}

async function handleChargeFailed(
  // deno-lint-ignore no-explicit-any
  client: any,
  logger: Logger,
  payload: PaystackEventPayload,
  eventRowId: string,
): Promise<HandlerResult> {
  const reference = payload.data.reference;
  if (!reference) {
    logger.warn('charge.failed without reference - skipping');
    return { processing_result: 'skipped_no_match', detail: { reason: 'missing_reference' } };
  }

  const paymentRes = await client
    .from('brand_payments')
    .select('id, campaign_id, status')
    .eq('paystack_reference', reference)
    .maybeSingle();

  if (paymentRes.error) {
    throw new DatabaseError('Failed to load brand_payment', {
      message: paymentRes.error.message,
      code: paymentRes.error.code,
    });
  }

  if (!paymentRes.data) {
    logger.warn('charge.failed references unknown brand_payment', { reference });
    return { processing_result: 'skipped_no_match', detail: { reference } };
  }

  const payment = paymentRes.data;

  if (payment.status === 'failed') {
    logger.info('brand_payment already failed - no-op');
    return { processing_result: 'success' };
  }

  const updPayment = await client
    .from('brand_payments')
    .update({
      status: 'failed',
      processed_at: new Date().toISOString(),
      paystack_event_id: eventRowId,
    })
    .eq('id', payment.id);

  if (updPayment.error) {
    throw new DatabaseError('Failed to update brand_payment to failed', {
      message: updPayment.error.message,
    });
  }

  if (payment.campaign_id) {
    const updCampaign = await client
      .from('campaigns')
      .update({ status: 'draft', target_sample_size: null, price_kobo: null })
      .eq('id', payment.campaign_id)
      .eq('status', 'pending_payment');

    if (updCampaign.error) {
      throw new DatabaseError('Failed to revert campaign to draft', {
        message: updCampaign.error.message,
      });
    }

    logger.info('campaign reverted to draft', { campaignId: payment.campaign_id });
  }

  return { processing_result: 'success' };
}

// Helper
function getRequestId(logger: Logger): string {
  return (logger as unknown as { requestId: string }).requestId;
}
