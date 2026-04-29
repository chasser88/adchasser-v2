-- Add pricing fields to campaigns + create platform_settings table
--
-- Background:
--   AdChasser uses dynamic pricing tied to sample size, locked at 95% confidence
--   and ±5% margin of error. The pricing formula is:
--
--     total_price = (sample_size + buffer) × respondent_price + platform_base_fee
--
--   The three pricing constants live in platform_settings so they can be
--   adjusted from admin without code deploys.

-- 1. Platform settings table (single-row config)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id integer PRIMARY KEY DEFAULT 1,
  respondent_price_kobo bigint NOT NULL,
  platform_base_fee_kobo bigint NOT NULL,
  sample_size_buffer integer NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT platform_settings_singleton CHECK (id = 1),
  CONSTRAINT respondent_price_positive CHECK (respondent_price_kobo > 0),
  CONSTRAINT platform_base_fee_nonneg CHECK (platform_base_fee_kobo >= 0),
  CONSTRAINT sample_size_buffer_nonneg CHECK (sample_size_buffer >= 0)
);

COMMENT ON TABLE public.platform_settings IS
  'Single-row table holding global pricing constants. Edit via admin UI.';

COMMENT ON COLUMN public.platform_settings.respondent_price_kobo IS
  'Price charged per respondent in kobo. Default 1,000,000 = NGN 10,000.';

COMMENT ON COLUMN public.platform_settings.platform_base_fee_kobo IS
  'Flat platform/admin fee charged per campaign in kobo. Default 150,000,000 = NGN 1,500,000.';

COMMENT ON COLUMN public.platform_settings.sample_size_buffer IS
  'Safety buffer added to required sample size. Default 50.';

-- Seed initial pricing
INSERT INTO public.platform_settings (
  id, respondent_price_kobo, platform_base_fee_kobo, sample_size_buffer
) VALUES (
  1, 1000000, 150000000, 50
) ON CONFLICT (id) DO NOTHING;

-- 2. Add pricing columns to campaigns
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS target_sample_size integer,
  ADD COLUMN IF NOT EXISTS price_kobo bigint;

COMMENT ON COLUMN public.campaigns.target_sample_size IS
  'Buffered sample size committed at payment time. Locked once campaign reaches pending_payment.';

COMMENT ON COLUMN public.campaigns.price_kobo IS
  'Total campaign price in kobo, locked at payment time.';

-- Defensive constraints
ALTER TABLE public.campaigns
  DROP CONSTRAINT IF EXISTS campaigns_target_sample_size_check;
ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_target_sample_size_check
  CHECK (target_sample_size IS NULL OR target_sample_size > 0);

ALTER TABLE public.campaigns
  DROP CONSTRAINT IF EXISTS campaigns_price_kobo_check;
ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_price_kobo_check
  CHECK (price_kobo IS NULL OR price_kobo > 0);

-- 3. RLS: platform_settings readable by everyone, writable only by service_role
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_settings_read ON public.platform_settings;
CREATE POLICY platform_settings_read
  ON public.platform_settings
  FOR SELECT
  TO authenticated, anon
  USING (true);

GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT ALL ON public.platform_settings TO service_role;
