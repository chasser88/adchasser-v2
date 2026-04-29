/**
 * Supabase client factory for AdChasser Edge Functions.
 *
 * Two flavors:
 *
 * 1. createUserClient(req)
 *    - Uses the caller's JWT from the Authorization header
 *    - Queries respect the caller's permissions (anon or authenticated)
 *    - Use this when you want operations performed AS the user
 *
 * 2. createServiceClient()
 *    - Uses the service role key (full admin access)
 *    - Bypasses RLS and explicit GRANTs
 *    - Use this for system operations: webhook event logs, internal updates
 *    - NEVER expose service role results directly to user input without
 *      carefully scoping queries
 */

import { createClient, type SupabaseClient } from 'supabase';
import { InternalError } from './errors.ts';

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value || value.length === 0) {
    throw new InternalError(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Creates a Supabase client scoped to the caller's identity.
 * Respects RLS / GRANTs based on the caller's JWT.
 */
export function createUserClient(req: Request): SupabaseClient {
  const url = requireEnv('SUPABASE_URL');
  const anonKey = requireEnv('SUPABASE_ANON_KEY');
  const authHeader = req.headers.get('authorization') ?? '';

  return createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Creates a Supabase client with full service-role access.
 * Bypasses RLS. Use sparingly and only for trusted server-side operations.
 */
export function createServiceClient(): SupabaseClient {
  const url = requireEnv('SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
