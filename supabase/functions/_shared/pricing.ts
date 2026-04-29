/**
 * Campaign pricing calculations for AdChasser.
 *
 * Single source of truth for the formula:
 *
 *   target_sample_size = required_sample_size + buffer
 *   price_in_kobo = target_sample_size * respondent_price + platform_base_fee
 *
 * Pricing constants live in the platform_settings table so they can be
 * adjusted from admin without code changes. Once a campaign is paid for,
 * its price_kobo and target_sample_size are locked into the campaign row,
 * protecting it from future pricing changes.
 */

import type { SupabaseClient } from 'supabase';
import { DatabaseError, InternalError } from './errors.ts';

export interface PlatformPricingSettings {
  respondentPriceKobo: number;
  platformBaseFeeKobo: number;
  sampleSizeBuffer: number;
}

export interface PricingBreakdown {
  requiredSampleSize: number;
  targetSampleSize: number; // required + buffer
  respondentCostKobo: number; // targetSampleSize * respondentPrice
  platformBaseFeeKobo: number;
  totalPriceKobo: number;
  confidenceLevel: number;
  marginOfError: number;
}

/**
 * Fetches the current platform pricing settings from the DB.
 * Throws if the singleton row is missing (should never happen - seeded by migration).
 */
export async function getPlatformPricing(
  // deno-lint-ignore no-explicit-any
  client: any,
): Promise<PlatformPricingSettings> {
  const { data, error } = await client
    .from('platform_settings')
    .select('respondent_price_kobo, platform_base_fee_kobo, sample_size_buffer')
    .eq('id', 1)
    .single();

  if (error) {
    throw new DatabaseError('Failed to load platform pricing settings', {
      message: error.message,
      code: error.code,
    });
  }

  if (!data) {
    throw new InternalError('platform_settings row not found');
  }

  return {
    respondentPriceKobo: Number(data.respondent_price_kobo),
    platformBaseFeeKobo: Number(data.platform_base_fee_kobo),
    sampleSizeBuffer: Number(data.sample_size_buffer),
  };
}

/**
 * Calls the database compute_sample_size function to determine the
 * required respondent sample size for a given population.
 * Uses fixed 95% confidence / ñ5% MoE standards across all campaigns.
 */
export async function computeRequiredSampleSize(
  // deno-lint-ignore no-explicit-any
  client: any,
  population: number,
): Promise<number> {
  const { data, error } = await client.rpc('compute_sample_size', {
    planned_reach: population,
    confidence_level: 95,
    margin_of_error: 5,
  });

  if (error) {
    throw new DatabaseError('Failed to compute sample size', {
      message: error.message,
      code: error.code,
    });
  }

  if (data === null || data === undefined) {
    throw new InternalError('compute_sample_size returned null');
  }

  return Number(data);
}

/**
 * Calculates the full pricing breakdown for a campaign with the given population.
 * Locked to 95% confidence and ±5% MoE - no configuration allowed v1.
 */
export async function calculateCampaignPricing(
  // deno-lint-ignore no-explicit-any
  client: any,
  population: number,
): Promise<PricingBreakdown> {
  const [settings, requiredSampleSize] = await Promise.all([
    getPlatformPricing(client),
    computeRequiredSampleSize(client, population),
  ]);

  const targetSampleSize = requiredSampleSize + settings.sampleSizeBuffer;
  const respondentCostKobo = targetSampleSize * settings.respondentPriceKobo;
  const totalPriceKobo = respondentCostKobo + settings.platformBaseFeeKobo;

  return {
    requiredSampleSize,
    targetSampleSize,
    respondentCostKobo,
    platformBaseFeeKobo: settings.platformBaseFeeKobo,
    totalPriceKobo,
    confidenceLevel: 95,
    marginOfError: 5,
  };
}
