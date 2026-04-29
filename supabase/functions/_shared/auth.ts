/**
 * Authentication and identity resolution for AdChasser Edge Functions.
 *
 * Authenticated functions call requireRespondent(req, supabaseClient) to:
 *   1. Verify the caller's JWT is valid (Supabase verifies JWT on inbound)
 *   2. Resolve the caller's respondent profile from the database
 *   3. Return both the auth user and the respondent row, fully typed
 *
 * If any step fails, throws a typed UnauthenticatedError or NotFoundError
 * which the response helper turns into a proper 401 / 404.
 */

import type { SupabaseClient } from 'supabase';
import { UnauthenticatedError, NotFoundError, DatabaseError } from './errors.ts';

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface RespondentProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  status: string | null;
  flagged: boolean | null;
  onboarding_done: boolean | null;
}

export interface RespondentContext {
  user: AuthUser;
  respondent: RespondentProfile;
}

/**
 * Verifies the JWT and returns the authenticated user.
 * Throws UnauthenticatedError if no valid JWT is present.
 */
export async function requireUser(client: SupabaseClient): Promise<AuthUser> {
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) {
    throw new UnauthenticatedError('Invalid or missing authentication token');
  }
  return {
    id: data.user.id,
    email: data.user.email ?? null,
  };
}

/**
 * Verifies the JWT, resolves the respondent profile, and returns both.
 *
 * Use this in any function that operates on respondent data:
 *
 *   const { user, respondent } = await requireRespondent(client);
 *   // respondent.id is the uuid from `respondents` table
 */
export async function requireRespondent(
  client: SupabaseClient,
): Promise<RespondentContext> {
  const user = await requireUser(client);

  const { data, error } = await client
    .from('respondents')
    .select('id, user_id, email, full_name, phone, status, flagged, onboarding_done')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new DatabaseError('Failed to load respondent profile', {
      message: error.message,
      code: error.code,
    });
  }

  if (!data) {
    throw new NotFoundError(
      'RESPONDENT_NOT_FOUND',
      'No respondent profile exists for this user. Complete onboarding first.',
    );
  }

  return {
    user,
    respondent: data as RespondentProfile,
  };
}
