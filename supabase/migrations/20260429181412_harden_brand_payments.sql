-- Harden brand_payments table
--
-- This migration adds two safety constraints to brand_payments:
--
-- 1. CHECK constraint on `status` — limits to Paystack-aligned states.
--    States map to Paystack transaction lifecycle:
--      pending     - row created, awaiting Paystack init confirmation
--      processing  - transaction initialised, brand has access code
--      success     - charge confirmed via webhook (campaign activated)
--      failed      - charge declined or errored
--      abandoned   - brand never completed payment, invoice expired
--      cancelled   - brand explicitly cancelled before payment
--
-- 2. FK constraint on `campaign_id` referencing campaigns(id).
--    ON DELETE SET NULL so historical payment records survive
--    even if a campaign is later deleted.
--
-- Pre-check verified: zero existing rows in brand_payments at migration time.

-- 1. Add status CHECK constraint
ALTER TABLE public.brand_payments
  DROP CONSTRAINT IF EXISTS brand_payments_status_check;

ALTER TABLE public.brand_payments
  ADD CONSTRAINT brand_payments_status_check
  CHECK (status IN ('pending', 'processing', 'success', 'failed', 'abandoned', 'cancelled'));

-- 2. Add foreign key on campaign_id
ALTER TABLE public.brand_payments
  DROP CONSTRAINT IF EXISTS brand_payments_campaign_id_fkey;

ALTER TABLE public.brand_payments
  ADD CONSTRAINT brand_payments_campaign_id_fkey
  FOREIGN KEY (campaign_id)
  REFERENCES public.campaigns(id)
  ON DELETE SET NULL;
