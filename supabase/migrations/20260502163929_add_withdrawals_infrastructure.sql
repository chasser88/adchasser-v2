-- ============================================================================
-- Respondent withdrawals infrastructure
--
-- Adds:
--   1. withdrawals table — lifecycle of a respondent withdrawal request
--   2. paystack_transfer_events table — webhook idempotency for outbound transfers
--   3. platform_settings columns — auto-approve thresholds + feature flag
--   4. RLS policies (respondent owner, super-admin, service-role)
--   5. DB functions for atomic balance manipulation:
--        - request_withdrawal     (decrement balance + insert pending row)
--        - refund_withdrawal      (re-credit balance, mark failed/cancelled)
--        - complete_withdrawal    (mark completed when Paystack webhook confirms)
--
-- All balance changes go through these functions to guarantee atomicity.
-- Direct UPDATE of respondent_earnings.available_balance from edge functions
-- is allowed only via service-role for safety, but in practice should be
-- avoided in favor of these helpers.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. withdrawals table
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    respondent_id            uuid        NOT NULL REFERENCES public.respondents(id) ON DELETE RESTRICT,
    payment_method_id        uuid        NOT NULL REFERENCES public.respondent_payment_methods(id) ON DELETE RESTRICT,
    amount_kobo              bigint      NOT NULL CHECK (amount_kobo > 0),
    status                   text        NOT NULL DEFAULT 'pending_approval'
        CHECK (status IN ('pending_approval', 'approved', 'transferring', 'completed', 'failed', 'cancelled')),

    -- Paystack tracking (populated as the transfer progresses)
    paystack_transfer_code   text,                     -- TRF_xxxxx, set when transfer initiated
    paystack_reference       text,                     -- Paystack-generated reference, set when transfer initiated
    paystack_event_id        text,                     -- set when webhook arrives

    failure_reason           text,                     -- populated on failure/cancellation

    -- Timeline columns
    requested_at             timestamptz NOT NULL DEFAULT now(),
    approved_at              timestamptz,              -- when admin or auto-approve flipped status to 'approved'
    approved_by              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
                                                       -- super-admin's auth.uid; NULL if auto-approved
    auto_approved            boolean     NOT NULL DEFAULT false,  -- distinguishes auto from manual approvals
    completed_at             timestamptz,              -- when webhook confirmed success
    processed_at             timestamptz               -- when webhook was processed (regardless of outcome)
);

ALTER TABLE public.withdrawals OWNER TO postgres;

CREATE INDEX IF NOT EXISTS idx_withdrawals_respondent_requested
    ON public.withdrawals (respondent_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status
    ON public.withdrawals (status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_paystack_transfer_code
    ON public.withdrawals (paystack_transfer_code);
CREATE INDEX IF NOT EXISTS idx_withdrawals_paystack_reference
    ON public.withdrawals (paystack_reference);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. paystack_transfer_events — outbound webhook idempotency
-- (Mirror of paystack_events table for inbound payments. Separate so we can
--  audit inflow vs outflow distinctly.)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.paystack_transfer_events (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type          text        NOT NULL,
    paystack_event_id   text        NOT NULL,
    payload             jsonb       NOT NULL,
    received_at         timestamptz NOT NULL DEFAULT now(),

    -- Same idempotency contract as paystack_events: if Paystack delivers the
    -- same event twice we skip re-processing.
    UNIQUE (event_type, paystack_event_id)
);

ALTER TABLE public.paystack_transfer_events OWNER TO postgres;

CREATE INDEX IF NOT EXISTS idx_paystack_transfer_events_received_at
    ON public.paystack_transfer_events (received_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Extend platform_settings with withdrawal config
-- (Single-row table at id=1, so we ALTER columns rather than insert rows.)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.platform_settings
    ADD COLUMN IF NOT EXISTS auto_approve_withdrawals_enabled  boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS auto_approve_max_kobo             bigint  NOT NULL DEFAULT 500000,    -- ₦5,000
    ADD COLUMN IF NOT EXISTS auto_approve_with_checks_max_kobo bigint  NOT NULL DEFAULT 2000000,   -- ₦20,000
    ADD COLUMN IF NOT EXISTS daily_withdrawal_cap_kobo         bigint  NOT NULL DEFAULT 5000000;   -- ₦50,000

-- ────────────────────────────────────────────────────────────────────────────
-- 4. RLS — withdrawals
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Respondents see only their own withdrawals (joining through respondents
-- to map auth.uid -> respondent_id).
DROP POLICY IF EXISTS withdrawals_owner_read ON public.withdrawals;
CREATE POLICY withdrawals_owner_read ON public.withdrawals
    FOR SELECT
    TO authenticated
    USING (
        respondent_id IN (
            SELECT id FROM public.respondents WHERE user_id = auth.uid()
        )
    );

-- Super-admin sees and manages everything.
DROP POLICY IF EXISTS withdrawals_super_admin_full ON public.withdrawals;
CREATE POLICY withdrawals_super_admin_full ON public.withdrawals
    FOR ALL
    TO authenticated
    USING  (auth.uid() = '4a05e9c5-005b-4dba-8160-5b3354c5df37'::uuid)
    WITH CHECK (auth.uid() = '4a05e9c5-005b-4dba-8160-5b3354c5df37'::uuid);

-- service_role bypasses RLS by design in Supabase, so no explicit policy needed
-- for edge functions; they already use the service role key.

-- ────────────────────────────────────────────────────────────────────────────
-- 4b. RLS — paystack_transfer_events (service-role only, no anon/auth access)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.paystack_transfer_events ENABLE ROW LEVEL SECURITY;
-- No policies = no rows visible to anon/authenticated. service_role still has access.

-- ────────────────────────────────────────────────────────────────────────────
-- 5. DB FUNCTIONS — atomic balance manipulation
-- ────────────────────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────────────────────
-- request_withdrawal
--
-- Atomically:
--   1. Locks the respondent's earnings row (FOR UPDATE)
--   2. Validates available_balance >= amount_kobo
--   3. Validates payment method belongs to respondent and is active
--   4. Decrements available_balance
--   5. Inserts a withdrawals row in 'pending_approval' state
--
-- Returns the inserted withdrawal row.
-- Raises an exception with explicit code on validation failure.
--
-- Called by the initiate-withdrawal edge function as the FIRST action.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.request_withdrawal(
    p_respondent_id     uuid,
    p_payment_method_id uuid,
    p_amount_kobo       bigint
) RETURNS public.withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_balance_kobo  bigint;
    v_method_active boolean;
    v_row           public.withdrawals;
BEGIN
    -- 1. Validate amount
    IF p_amount_kobo IS NULL OR p_amount_kobo <= 0 THEN
        RAISE EXCEPTION 'INVALID_AMOUNT' USING ERRCODE = 'check_violation';
    END IF;

    -- 2. Validate payment method ownership + active
    SELECT is_active
    INTO v_method_active
    FROM public.respondent_payment_methods
    WHERE id = p_payment_method_id
      AND respondent_id = p_respondent_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'PAYMENT_METHOD_NOT_FOUND' USING ERRCODE = 'no_data_found';
    END IF;

    IF NOT v_method_active THEN
        RAISE EXCEPTION 'PAYMENT_METHOD_INACTIVE' USING ERRCODE = 'check_violation';
    END IF;

    -- 3. Lock and check balance.
    -- Earnings stored as numeric naira; multiply by 100 to compare in kobo.
    SELECT (available_balance * 100)::bigint
    INTO v_balance_kobo
    FROM public.respondent_earnings
    WHERE respondent_id = p_respondent_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'EARNINGS_NOT_FOUND' USING ERRCODE = 'no_data_found';
    END IF;

    IF v_balance_kobo < p_amount_kobo THEN
        RAISE EXCEPTION 'INSUFFICIENT_BALANCE' USING ERRCODE = 'check_violation';
    END IF;

    -- 4. Decrement balance.
    UPDATE public.respondent_earnings
    SET available_balance = available_balance - (p_amount_kobo::numeric / 100),
        updated_at        = now()
    WHERE respondent_id = p_respondent_id;

    -- 5. Insert withdrawal row.
    INSERT INTO public.withdrawals (
        respondent_id, payment_method_id, amount_kobo, status, requested_at
    ) VALUES (
        p_respondent_id, p_payment_method_id, p_amount_kobo, 'pending_approval', now()
    )
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.request_withdrawal(uuid, uuid, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(uuid, uuid, bigint) TO service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- refund_withdrawal
--
-- Re-credits the respondent's available_balance and marks the withdrawal as
-- failed or cancelled. Atomic.
--
-- Called by:
--   - paystack-transfer-webhook on transfer.failed / transfer.reversed
--   - admin reject flow on rejection of a pending_approval withdrawal
--   - initiate-withdrawal on Paystack API failure during initial transfer call
--
-- Idempotent: if already failed/cancelled/completed, no-op (returns the row).
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.refund_withdrawal(
    p_withdrawal_id uuid,
    p_new_status    text,                   -- 'failed' or 'cancelled'
    p_reason        text DEFAULT NULL,
    p_event_id      text DEFAULT NULL       -- paystack event id when applicable
) RETURNS public.withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_row public.withdrawals;
BEGIN
    IF p_new_status NOT IN ('failed', 'cancelled') THEN
        RAISE EXCEPTION 'INVALID_REFUND_STATUS' USING ERRCODE = 'check_violation';
    END IF;

    -- Lock the row.
    SELECT *
    INTO v_row
    FROM public.withdrawals
    WHERE id = p_withdrawal_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'WITHDRAWAL_NOT_FOUND' USING ERRCODE = 'no_data_found';
    END IF;

    -- Idempotency: if already in a terminal state, return as-is.
    IF v_row.status IN ('completed', 'failed', 'cancelled') THEN
        RETURN v_row;
    END IF;

    -- Refund the balance.
    UPDATE public.respondent_earnings
    SET available_balance = available_balance + (v_row.amount_kobo::numeric / 100),
        updated_at        = now()
    WHERE respondent_id = v_row.respondent_id;

    -- Mark the row.
    UPDATE public.withdrawals
    SET status            = p_new_status,
        failure_reason    = COALESCE(p_reason, failure_reason),
        paystack_event_id = COALESCE(p_event_id, paystack_event_id),
        processed_at      = now()
    WHERE id = p_withdrawal_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.refund_withdrawal(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refund_withdrawal(uuid, text, text, text) TO service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- complete_withdrawal
--
-- Marks a withdrawal as completed. Bumps withdrawn_total. Idempotent.
--
-- Called by paystack-transfer-webhook on transfer.success.
-- Note: balance was ALREADY decremented at request time, so we don't touch
-- available_balance here. We only bump withdrawn_total for accounting.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.complete_withdrawal(
    p_withdrawal_id uuid,
    p_event_id      text DEFAULT NULL
) RETURNS public.withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_row public.withdrawals;
BEGIN
    SELECT *
    INTO v_row
    FROM public.withdrawals
    WHERE id = p_withdrawal_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'WITHDRAWAL_NOT_FOUND' USING ERRCODE = 'no_data_found';
    END IF;

    -- Idempotency
    IF v_row.status = 'completed' THEN
        RETURN v_row;
    END IF;

    IF v_row.status IN ('failed', 'cancelled') THEN
        RAISE EXCEPTION 'WITHDRAWAL_TERMINAL_STATE' USING ERRCODE = 'check_violation';
    END IF;

    UPDATE public.respondent_earnings
    SET withdrawn_total = withdrawn_total + (v_row.amount_kobo::numeric / 100),
        updated_at      = now()
    WHERE respondent_id = v_row.respondent_id;

    UPDATE public.withdrawals
    SET status            = 'completed',
        paystack_event_id = COALESCE(p_event_id, paystack_event_id),
        completed_at      = now(),
        processed_at      = now()
    WHERE id = p_withdrawal_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_withdrawal(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_withdrawal(uuid, text) TO service_role;
