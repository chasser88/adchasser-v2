/**
 * verify-bank-account
 * ───────────────────────────────────────────────────────────────────
 * Called by the respondent panel when a user adds/updates their bank account.
 *
 * Flow:
 *   1. Authenticate caller; resolve respondent profile
 *   2. Validate input (bankCode, bankName, accountNumber)
 *   3. Resolve the account with Paystack -> get verified account name
 *   4. Create a transfer recipient with Paystack -> get recipient_code
 *   5. Deactivate older methods, insert new method as default+active
 *   6. Return the saved payment method
 *
 * Idempotency:
 *   - If the same respondent re-verifies the same (bankCode, accountNumber),
 *     we reuse the existing recipient_code and return the existing row
 *     instead of charging Paystack a duplicate API call.
 *
 * Failure modes:
 *   - 400 VALIDATION_ERROR        invalid bank code / account number / body
 *   - 401 UNAUTHENTICATED         no/invalid JWT
 *   - 404 RESPONDENT_NOT_FOUND    user has no respondent profile
 *   - 502 PAYSTACK_ERROR          Paystack rejected (e.g., fake account number)
 *   - 503 PAYSTACK_UNAVAILABLE    Paystack network error / timeout
 *   - 500 DATABASE_ERROR / INTERNAL_ERROR
 */

import { z } from 'zod';

import { handleCorsPreflightRequest } from '../_shared/cors.ts';
import {
  ConflictError,
  DatabaseError,
  ValidationError,
} from '../_shared/errors.ts';
import {
  createLoggerFromRequest,
  type Logger,
} from '../_shared/logger.ts';
import { PaystackClient } from '../_shared/paystack.ts';
import { jsonOk, jsonError } from '../_shared/response.ts';
import {
  createUserClient,
  createServiceClient,
} from '../_shared/supabase.ts';
import { requireRespondent } from '../_shared/auth.ts';
import {
  parseOrThrow,
  readJsonBody,
  BankCodeSchema,
  AccountNumberSchema,
} from '../_shared/validation.ts';

// ── Input schema ──────────────────────────────────────────────────

const InputSchema = z.object({
  bankCode: BankCodeSchema,
  accountNumber: AccountNumberSchema,
  bankName: z.string().trim().min(1, 'bank name is required').max(120),
});

type VerifyBankInput = z.infer<typeof InputSchema>;

// ── Output shape ──────────────────────────────────────────────────

interface VerifyBankOutput {
  paymentMethodId: string;
  recipientCode: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  isDefault: boolean;
  verifiedAt: string;
}

// ── Handler ───────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const logger = createLoggerFromRequest(req, 'verify-bank-account');

  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req);

  if (req.method !== 'POST') {
    return jsonError(req, logger, new ValidationError(
      `Method ${req.method} is not allowed; use POST`,
    ));
  }

  try {
    // 1. Read + validate input
    const body = await readJsonBody(req);
    const input = parseOrThrow(InputSchema, body);

    // 2. Authenticate + load respondent profile
    const userClient = createUserClient(req);
    const { user, respondent } = await requireRespondent(userClient);

    const reqLogger = logger.child({
      userId: user.id,
      respondentId: respondent.id,
      bankCode: input.bankCode,
      accountNumberLast4: input.accountNumber.slice(-4),
    });

    reqLogger.info('Starting bank account verification');

    // 3. Idempotency: if this exact account is already verified for this
    //    respondent, return the existing row instead of re-creating.
    const service = createServiceClient();
    const existing = await findExistingPaymentMethod(
      service,
      respondent.id,
      input.bankCode,
      input.accountNumber,
    );
    if (existing) {
      reqLogger.info('Reusing existing verified payment method', {
        paymentMethodId: existing.paymentMethodId,
      });
      return jsonOk(req, getRequestId(reqLogger), existing);
    }

    // 4. Verify with Paystack
    const paystack = new PaystackClient(reqLogger);
    const resolved = await paystack.resolveAccount({
      accountNumber: input.accountNumber,
      bankCode: input.bankCode,
    });

    reqLogger.info('Paystack resolved account', {
      verifiedName: resolved.account_name,
    });

    // 5. Create transfer recipient
    const recipient = await paystack.createTransferRecipient({
      type: 'nuban',
      name: resolved.account_name,
      account_number: input.accountNumber,
      bank_code: input.bankCode,
      currency: 'NGN',
    });

    reqLogger.info('Paystack created transfer recipient', {
      recipientCode: recipient.recipient_code,
    });

    // 6. Save to database — deactivate older methods, insert new as default
    const saved = await savePaymentMethod(service, {
      respondentId: respondent.id,
      bankCode: input.bankCode,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      verifiedAccountName: resolved.account_name,
      recipientCode: recipient.recipient_code,
    });

    reqLogger.info('Payment method saved', {
      paymentMethodId: saved.paymentMethodId,
    });

    return jsonOk(req, getRequestId(reqLogger), saved);
  } catch (err) {
    return jsonError(req, logger, err);
  }
});

// ── Helpers ───────────────────────────────────────────────────────

function getRequestId(logger: Logger): string {
  return (logger as unknown as { requestId: string }).requestId;
}

async function findExistingPaymentMethod(
  // deno-lint-ignore no-explicit-any
  client: any,
  respondentId: string,
  bankCode: string,
  accountNumber: string,
): Promise<VerifyBankOutput | null> {
  const { data, error } = await client
    .from('respondent_payment_methods')
    .select(`
      id,
      paystack_recipient_code,
      paystack_bank_code,
      verified_account_name,
      verified_at,
      account_number,
      bank_name,
      is_default
    `)
    .eq('respondent_id', respondentId)
    .eq('paystack_bank_code', bankCode)
    .eq('account_number', accountNumber)
    .not('paystack_recipient_code', 'is', null)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new DatabaseError('Failed to look up existing payment methods', {
      message: error.message,
      code: error.code,
    });
  }

  if (!data) return null;

  return {
    paymentMethodId: data.id,
    recipientCode: data.paystack_recipient_code,
    accountName: data.verified_account_name,
    accountNumber: data.account_number,
    bankCode: data.paystack_bank_code,
    bankName: data.bank_name,
    isDefault: data.is_default ?? false,
    verifiedAt: data.verified_at,
  };
}

interface SaveInput {
  respondentId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  verifiedAccountName: string;
  recipientCode: string;
}

async function savePaymentMethod(
  // deno-lint-ignore no-explicit-any
  client: any,
  input: SaveInput,
): Promise<VerifyBankOutput> {
  // Deactivate all currently-active methods for this respondent.
  // Also clear is_default on all rows so we don't have multiple defaults.
  const deactivateRes = await client
    .from('respondent_payment_methods')
    .update({ is_active: false, is_default: false })
    .eq('respondent_id', input.respondentId);

  if (deactivateRes.error) {
    throw new DatabaseError('Failed to deactivate older payment methods', {
      message: deactivateRes.error.message,
      code: deactivateRes.error.code,
    });
  }

  const verifiedAt = new Date().toISOString();
  const insertRes = await client
    .from('respondent_payment_methods')
    .insert({
      respondent_id: input.respondentId,
      method_type: 'bank_transfer',
      bank_name: input.bankName,
      bank_code: input.bankCode,
      account_number: input.accountNumber,
      account_name: input.verifiedAccountName, // Option 1: Paystack's verified name
      paystack_bank_code: input.bankCode,
      paystack_recipient_code: input.recipientCode,
      verified_account_name: input.verifiedAccountName,
      verified_at: verifiedAt,
      country: 'Nigeria',
      currency: 'NGN',
      is_active: true,
      is_default: true,
    })
    .select('id, is_default')
    .single();

  if (insertRes.error) {
    if (insertRes.error.code === '23505') {
      throw new ConflictError(
        'DUPLICATE_RECIPIENT',
        'This payment method already exists',
      );
    }
    throw new DatabaseError('Failed to save payment method', {
      message: insertRes.error.message,
      code: insertRes.error.code,
    });
  }

  return {
    paymentMethodId: insertRes.data.id,
    recipientCode: input.recipientCode,
    accountName: input.verifiedAccountName,
    accountNumber: input.accountNumber,
    bankCode: input.bankCode,
    bankName: input.bankName,
    isDefault: insertRes.data.is_default ?? true,
    verifiedAt,
  };
}
