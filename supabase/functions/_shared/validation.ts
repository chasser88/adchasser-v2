/**
 * Runtime input validation using Zod.
 *
 * Every Edge Function validates its input at the boundary BEFORE any business
 * logic runs. If validation fails, we throw a typed ValidationError that
 * gets serialized to a 400 response with structured field-level details.
 *
 * Zod gives us both runtime checking AND TypeScript types from the same schema.
 */

import { z, ZodError, type ZodSchema } from 'zod';
import { ValidationError } from './errors.ts';

/**
 * Validates `data` against `schema`. On failure, throws a ValidationError
 * containing field-level error details that the frontend can use for UX.
 *
 *   const input = parseOrThrow(VerifyBankSchema, await req.json());
 *   //    ^? typed as { bankCode: string, accountNumber: string }
 */
export function parseOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      'Request validation failed',
      { issues: formatZodIssues(result.error) },
    );
  }
  return result.data;
}

function formatZodIssues(error: ZodError): Array<{ path: string; message: string }> {
  return error.issues.map(issue => ({
    path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    message: issue.message,
  }));
}

// ── Reusable primitives ──────────────────────────────────────────

/** UUID v4 string. */
export const UuidSchema = z.string().uuid('must be a valid UUID');

/** Nigerian bank code per Paystack — 3 to 6 digit numeric string. */
export const BankCodeSchema = z
  .string()
  .regex(/^\d{3,6}$/, 'bank code must be 3-6 digits');

/** Nigerian bank account number — exactly 10 digits. */
export const AccountNumberSchema = z
  .string()
  .regex(/^\d{10}$/, 'account number must be exactly 10 digits');

/** Amount in kobo — positive bigint-safe integer. */
export const AmountKoboSchema = z
  .number()
  .int('amount must be an integer in kobo')
  .positive('amount must be greater than zero')
  .max(Number.MAX_SAFE_INTEGER, 'amount exceeds maximum safe integer');

/** Idempotency key — alphanumeric + dashes, 16 to 128 chars. */
export const IdempotencyKeySchema = z
  .string()
  .min(16, 'idempotency key too short (minimum 16 chars)')
  .max(128, 'idempotency key too long (maximum 128 chars)')
  .regex(/^[a-zA-Z0-9_-]+$/, 'idempotency key must be alphanumeric, dashes, underscores only');

/**
 * Safely parses JSON from a request body. Returns `null` if the body is
 * empty or invalid JSON — handlers should call parseOrThrow on the result
 * to get proper validation.
 */
export async function readJsonBody(req: Request): Promise<unknown> {
  try {
    const text = await req.text();
    if (text.length === 0) return null;
    return JSON.parse(text);
  } catch {
    throw new ValidationError('Request body is not valid JSON');
  }
}
