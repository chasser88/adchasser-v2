/**
 * Standardized HTTP response helpers for AdChasser Edge Functions.
 *
 * Every response from every function follows one of two shapes:
 *
 *   Success: { ok: true, data: T, requestId: string }
 *   Error:   { ok: false, error: { code, message, details, requestId } }
 *
 * Frontends can branch on `response.ok` and trust the shape.
 */

import { getCorsHeaders } from './cors.ts';
import { AppError, isAppError, InternalError, type SerializedError } from './errors.ts';
import type { Logger } from './logger.ts';

export interface SuccessBody<T> {
  ok: true;
  data: T;
  requestId: string;
}

export interface ErrorBody {
  ok: false;
  error: SerializedError;
}

export function jsonOk<T>(
  req: Request,
  requestId: string,
  data: T,
  status = 200,
): Response {
  const body: SuccessBody<T> = { ok: true, data, requestId };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(req),
      'content-type': 'application/json; charset=utf-8',
      'x-request-id': requestId,
    },
  });
}

export function jsonError(
  req: Request,
  logger: Logger,
  err: unknown,
): Response {
  const requestId = (logger as unknown as { requestId: string }).requestId
    ?? 'unknown';

  let appError: AppError;
  if (isAppError(err)) {
    appError = err;
  } else {
    logger.error('Unhandled error', {
      error: err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack }
        : { value: String(err) },
    });
    appError = new InternalError();
  }

  if (isAppError(err)) {
    logger.warn(`Returning ${appError.code}`, {
      code: appError.code,
      status: appError.status,
      details: appError.details,
    });
  }

  const body: ErrorBody = {
    ok: false,
    error: appError.toJSON(requestId),
  };

  return new Response(JSON.stringify(body), {
    status: appError.status,
    headers: {
      ...getCorsHeaders(req),
      'content-type': 'application/json; charset=utf-8',
      'x-request-id': requestId,
    },
  });
}

export interface HandlerContext {
  requestId: string;
  logger: Logger;
}

export type Handler = (req: Request, ctx: HandlerContext) => Promise<Response>;
