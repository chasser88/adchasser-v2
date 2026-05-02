-- ============================================================================
-- Add audit columns to paystack_transfer_events
--
-- The original migration (20260502163929) created paystack_transfer_events
-- with the bare minimum columns (id, event_type, paystack_event_id, payload,
-- received_at). To match the audit pattern of the inbound paystack_events
-- table we add:
--
--   - reference         text       (paystack reference for cross-lookup with withdrawals row)
--   - signature         text       (received x-paystack-signature header for forensics)
--   - processing_result text       ('success' | 'failed_no_match' | 'skipped_no_match' | 'pending')
--   - processed_at      timestamptz (when processing finished)
--
-- These mirror the inbound webhook table so investigations across both flows
-- look the same.
-- ============================================================================

ALTER TABLE public.paystack_transfer_events
    ADD COLUMN IF NOT EXISTS reference         text,
    ADD COLUMN IF NOT EXISTS signature         text,
    ADD COLUMN IF NOT EXISTS processing_result text,
    ADD COLUMN IF NOT EXISTS processed_at      timestamptz;

-- Helpful index for cross-lookups against withdrawals.paystack_reference.
CREATE INDEX IF NOT EXISTS idx_paystack_transfer_events_reference
    ON public.paystack_transfer_events (reference);
