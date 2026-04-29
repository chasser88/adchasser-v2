/**
 * Typed error classes for AdChasser Edge Functions.
 *
 * Every error carries a stable error code that frontends can react to,
 * an HTTP status code for the response, and optional context for logging.
 *
 * NEVER throw raw `new Error("...")` in production code paths.
 * Always use one of these classes so callers get predictable, typed failures.
 */

export type ErrorCode =
  // Validation / input errors (400)
  | 'VALIDATION_ERROR'
  | 'INVALID_BANK_CODE'
  | 'INVALID_ACCOUNT_NUMBER'
  | 'INVALID_AMOUNT'
  | 'INVALID_REQUEST_BODY'
  // Authentication / authorization (401, 403)
  | 'UNAUTHENTICATED'
  | 'UNAUTHORIZED'
  | 'INVALID_JWT'
  // Not found (404)
  | 'RESPONDENT_NOT_FOUND'
  | 'PAYMENT_METHOD_NOT_FOUND'
  | 'WITHDRAWAL_NOT_FOUND'
  // Conflict / duplicate (409)
  | 'DUPLICATE_RECIPIENT'
  | 'DUPLICATE_WITHDRAWAL'
  | 'IDEMPOTENCY_CONFLICT'
  // Business rules (422)
  | 'INSUFFICIENT_BALANCE'
  | 'DAILY_LIMIT_EXCEEDED'
  | 'BELOW_MINIMUM_WITHDRAWAL'
  | 'ABOVE_MAXIMUM_WITHDRAWAL'
  | 'BANK_NAME_MISMATCH'
  // Rate limit (429)
  | 'RATE_LIMITED'
  // Upstream services (502, 503)
  | 'PAYSTACK_ERROR'
  | 'PAYSTACK_UNAVAILABLE'
  | 'DATABASE_ERROR'
  // Generic (500)
  | 'INTERNAL_ERROR';

export interface SerializedError {
  code: ErrorCode;
  message: string;
  status: number;
  details?: Record<string, unknown>;
  requestId?: string;
}

/**
 * Base class. Don't throw this directly — use one of the subclasses.
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON(requestId?: string): SerializedError {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      details: this.details,
      requestId,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHENTICATED', message, 401);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super('UNAUTHORIZED', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(code: Extract<ErrorCode, 'RESPONDENT_NOT_FOUND' | 'PAYMENT_METHOD_NOT_FOUND' | 'WITHDRAWAL_NOT_FOUND'>, message: string) {
    super(code, message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(code: Extract<ErrorCode, 'DUPLICATE_RECIPIENT' | 'DUPLICATE_WITHDRAWAL' | 'IDEMPOTENCY_CONFLICT'>, message: string, details?: Record<string, unknown>) {
    super(code, message, 409, details);
  }
}

export class BusinessRuleError extends AppError {
  constructor(
    code: Extract<ErrorCode, 'INSUFFICIENT_BALANCE' | 'DAILY_LIMIT_EXCEEDED' | 'BELOW_MINIMUM_WITHDRAWAL' | 'ABOVE_MAXIMUM_WITHDRAWAL' | 'BANK_NAME_MISMATCH'>,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(code, message, 422, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please slow down') {
    super('RATE_LIMITED', message, 429);
  }
}

export class PaystackError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('PAYSTACK_ERROR', message, 502, details);
  }
}

export class PaystackUnavailableError extends AppError {
  constructor(message = 'Paystack is temporarily unavailable') {
    super('PAYSTACK_UNAVAILABLE', message, 503);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('DATABASE_ERROR', message, 500, details);
  }
}

export class InternalError extends AppError {
  constructor(message = 'An internal error occurred') {
    super('INTERNAL_ERROR', message, 500);
  }
}

/**
 * Type guard: is this an AppError or a generic JS Error?
 */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
