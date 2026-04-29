/**
 * CORS configuration for AdChasser Edge Functions.
 *
 * Browser-based AdChasser code (adchasser.com) calls these functions cross-origin,
 * so every response needs proper CORS headers.
 *
 * In production, ALLOWED_ORIGINS should be restricted to known origins.
 * For local development we accept localhost.
 */

const PRODUCTION_ORIGINS = [
  'https://adchasser.com',
  'https://www.adchasser.com',
];

const DEVELOPMENT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

export const ALLOWED_ORIGINS = [
  ...PRODUCTION_ORIGINS,
  ...DEVELOPMENT_ORIGINS,
];

/**
 * Returns CORS headers appropriate for the request's Origin.
 * If the origin isn't in our allowlist, we don't echo it back — which causes
 * the browser to block the response (correct behavior for unknown origins).
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id, idempotency-key',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

/**
 * Handles preflight OPTIONS requests with proper CORS headers.
 * Every Edge Function should call this at the top:
 *
 *   if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req);
 */
export function handleCorsPreflightRequest(req: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}
