-- Add paystack_events table for webhook idempotency + audit
--
-- Background:
--   An earlier version of paystack_events was created as scaffolding
--   but never used (production confirmed empty, 0 rows). We're dropping
--   it and recreating with a cleaner design tailored to our webhook handler.
--
--   Idempotency key: (event_type, paystack_event_id)
--     event_type       = 'charge.success', etc
--     paystack_event_id = data.id field from payload

-- 1. Drop scaffold table (production confirmed 0 rows)
DROP TABLE IF EXISTS public.paystack_events CASCADE;

-- 2. Create new table
CREATE TABLE public.paystack_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  paystack_event_id bigint NOT NULL,
  reference text,
  payload jsonb NOT NULL,
  signature text NOT NULL,
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  processing_result text NOT NULL DEFAULT 'pending',
  processing_error text,
  CONSTRAINT paystack_events_unique UNIQUE (event_type, paystack_event_id),
  CONSTRAINT paystack_events_processing_result_check CHECK (
    processing_result IN ('pending', 'success', 'skipped_no_match', 'failed')
  )
);

COMMENT ON TABLE public.paystack_events IS
  'Paystack webhook delivery log + idempotency guard. Idempotency key: (event_type, paystack_event_id).';

COMMENT ON COLUMN public.paystack_events.paystack_event_id IS
  'Paystack data.id field from webhook payload (not our uuid).';

COMMENT ON COLUMN public.paystack_events.signature IS
  'Incoming x-paystack-signature header (HMAC SHA512) for audit.';

COMMENT ON COLUMN public.paystack_events.processing_result IS
  'Outcome of processing: pending (in-flight) / success / skipped_no_match (no brand_payments row) / failed (see processing_error).';

-- Indexes
CREATE INDEX paystack_events_reference_idx
  ON public.paystack_events (reference)
  WHERE reference IS NOT NULL;

CREATE INDEX paystack_events_received_at_idx
  ON public.paystack_events (received_at DESC);

-- 3. RLS: service_role only
ALTER TABLE public.paystack_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.paystack_events FROM anon, authenticated;
GRANT ALL ON public.paystack_events TO service_role;

-- 4. Add audit columns to brand_payments
ALTER TABLE public.brand_payments
  ADD COLUMN IF NOT EXISTS processed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS paystack_event_id uuid REFERENCES public.paystack_events(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.brand_payments.processed_at IS
  'Timestamp at which webhook marked this payment as success/failed. Null while pending.';

COMMENT ON COLUMN public.brand_payments.paystack_event_id IS
  'FK to the paystack_events row that resolved this payment. Null while pending.';