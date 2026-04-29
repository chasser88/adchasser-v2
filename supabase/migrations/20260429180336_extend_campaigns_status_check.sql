-- Extend campaigns.status to include 'pending_payment'
--
-- Background:
--   The existing status CHECK constraint allows: draft, active, paused, completed.
--   To support pay-on-launch flow (Pattern Z), brands transition draft -> pending_payment
--   when they click Launch, then -> active once Paystack confirms charge success.
--
-- Rationale for keeping 'paused' in the schema even though we don't use it in v1:
--   It's already there, it's not breaking anything, and removing it would invalidate
--   any existing campaign rows (if any) that use it. Future-proof, no risk.

ALTER TABLE public.campaigns
  DROP CONSTRAINT IF EXISTS campaigns_status_check;

ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_status_check
  CHECK (status IN ('draft', 'pending_payment', 'active', 'paused', 'completed'));
