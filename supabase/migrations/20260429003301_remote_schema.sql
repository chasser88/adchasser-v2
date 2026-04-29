


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."auto_approve_pending_completions"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  approved_count int := 0;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id, respondent_id, reward_amount
    FROM public.respondent_completions
    WHERE quality_status  = 'pending'
      AND payment_status  = 'pending'
      AND completed_at    < now() - INTERVAL '24 hours'
  LOOP
    -- Approve the completion
    UPDATE public.respondent_completions
    SET
      quality_status = 'approved',
      payment_status = 'credited'
    WHERE id = rec.id;

    -- Move from pending to available in wallet
    UPDATE public.respondent_earnings
    SET
      pending_balance   = GREATEST(0, pending_balance - rec.reward_amount),
      available_balance = available_balance + rec.reward_amount,
      total_earned      = total_earned + rec.reward_amount,
      updated_at        = now()
    WHERE respondent_id = rec.respondent_id;

    approved_count := approved_count + 1;
  END LOOP;

  RETURN approved_count;
END;
$$;


ALTER FUNCTION "public"."auto_approve_pending_completions"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."respondents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "phone" "text",
    "phone_verified" boolean DEFAULT false,
    "full_name" "text",
    "avatar_url" "text",
    "date_of_birth" "date",
    "gender" "text",
    "state" "text",
    "lga" "text",
    "country" "text" DEFAULT 'Nigeria'::"text",
    "education_level" "text",
    "employment_status" "text",
    "monthly_income" "text",
    "household_size" integer,
    "marital_status" "text",
    "num_children" integer DEFAULT 0,
    "housing_type" "text",
    "devices_owned" "text"[],
    "internet_usage" "text",
    "social_platforms" "text"[],
    "tv_consumption" "text",
    "radio_consumption" "text",
    "shopping_behaviour" "text"[],
    "profile_complete" boolean DEFAULT false,
    "profile_score" integer DEFAULT 0,
    "device_fingerprint" "text",
    "ip_address" "text",
    "flagged" boolean DEFAULT false,
    "flag_reason" "text",
    "status" "text" DEFAULT 'active'::"text",
    "onboarding_done" boolean DEFAULT false,
    "whatsapp_joined" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."respondents" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compute_profile_score"("r" "public"."respondents") RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE score int := 0;
BEGIN
  IF r.full_name IS NOT NULL THEN score := score + 10; END IF;
  IF r.phone IS NOT NULL AND r.phone_verified THEN score := score + 15; END IF;
  IF r.date_of_birth IS NOT NULL THEN score := score + 10; END IF;
  IF r.gender IS NOT NULL THEN score := score + 5; END IF;
  IF r.state IS NOT NULL THEN score := score + 5; END IF;
  IF r.lga IS NOT NULL THEN score := score + 5; END IF;
  IF r.education_level IS NOT NULL THEN score := score + 5; END IF;
  IF r.employment_status IS NOT NULL THEN score := score + 5; END IF;
  IF r.monthly_income IS NOT NULL THEN score := score + 5; END IF;
  IF r.household_size IS NOT NULL THEN score := score + 5; END IF;
  IF r.marital_status IS NOT NULL THEN score := score + 5; END IF;
  IF r.devices_owned IS NOT NULL AND array_length(r.devices_owned, 1) > 0 THEN score := score + 5; END IF;
  IF r.social_platforms IS NOT NULL AND array_length(r.social_platforms, 1) > 0 THEN score := score + 5; END IF;
  IF r.shopping_behaviour IS NOT NULL AND array_length(r.shopping_behaviour, 1) > 0 THEN score := score + 5; END IF;
  IF r.internet_usage IS NOT NULL THEN score := score + 5; END IF;
  RETURN LEAST(score, 100);
END;
$$;


ALTER FUNCTION "public"."compute_profile_score"("r" "public"."respondents") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compute_sample_size"("planned_reach" bigint, "confidence_level" numeric DEFAULT 95, "margin_of_error" numeric DEFAULT 5) RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  z    numeric;
  e    numeric;
  p    numeric := 0.5;
  n0   numeric;
  n    numeric;
BEGIN
  -- Z-score lookup
  z := CASE
    WHEN confidence_level >= 99 THEN 2.576
    WHEN confidence_level >= 95 THEN 1.960
    WHEN confidence_level >= 90 THEN 1.645
    ELSE 1.645
  END;

  e  := margin_of_error / 100.0;
  n0 := (z * z * p * (1 - p)) / (e * e);

  -- Finite population correction
  IF planned_reach IS NOT NULL AND planned_reach > 0 THEN
    n := n0 / (1 + (n0 - 1) / planned_reach);
  ELSE
    n := n0;
  END IF;

  RETURN CEIL(n);
END;
$$;


ALTER FUNCTION "public"."compute_sample_size"("planned_reach" bigint, "confidence_level" numeric, "margin_of_error" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_respondent_wallet"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.respondent_earnings (respondent_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_respondent_wallet"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."credit_respondent_on_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.payment_status = 'credited' AND OLD.payment_status != 'credited' THEN
    UPDATE public.respondent_earnings
    SET
      available_balance = available_balance + NEW.reward_amount,
      total_earned      = total_earned + NEW.reward_amount,
      pending_balance   = GREATEST(0, pending_balance - NEW.reward_amount),
      updated_at        = now()
    WHERE respondent_id = NEW.respondent_id;
  END IF;

  IF NEW.payment_status = 'pending' AND OLD.payment_status IS DISTINCT FROM 'pending' THEN
    UPDATE public.respondent_earnings
    SET
      pending_balance = pending_balance + NEW.reward_amount,
      updated_at      = now()
    WHERE respondent_id = NEW.respondent_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."credit_respondent_on_approval"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_on_withdrawal"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.respondent_earnings
    SET
      available_balance = GREATEST(0, available_balance - NEW.amount),
      withdrawn_total   = withdrawn_total + NEW.amount,
      updated_at        = now()
    WHERE respondent_id = NEW.respondent_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."deduct_on_withdrawal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_available_surveys"("p_respondent_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "status" "text", "survey_slug" "text", "description" "text", "brand_id" "uuid", "coverage" "jsonb", "brand_name" "text", "brand_color" "text", "brand_logo_char" "text", "brand_logo_url" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id, c.name, c.status, c.survey_slug,
    c.description, c.brand_id, c.coverage,
    b.name::text, b.color::text, b.logo_char::text, b.logo_url::text
  FROM public.campaigns c
  LEFT JOIN public.brands b ON b.id = c.brand_id
  WHERE 
    c.status IN ('active', 'completed')
    AND c.survey_slug IS NOT NULL
    AND c.id NOT IN (
      SELECT rc.campaign_id 
      FROM public.respondent_completions rc
      WHERE rc.respondent_id = p_respondent_id
        AND rc.quality_status IN ('pending', 'approved', 'rejected')
    )
    AND c.id NOT IN (
      SELECT rc.campaign_id
      FROM public.respondent_completions rc
      WHERE rc.respondent_id = p_respondent_id
        AND rc.quality_status = 'retry_allowed'
        AND rc.retry_allowed_until IS NOT NULL
        AND rc.retry_allowed_until < now()
    );
END;
$$;


ALTER FUNCTION "public"."get_available_surveys"("p_respondent_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.email = 'charlzillion@gmail.com' THEN 'admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_pending_balance"("p_respondent_id" "uuid", "p_amount" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.respondent_earnings
  SET
    pending_balance = pending_balance + p_amount,
    updated_at      = now()
  WHERE respondent_id = p_respondent_id;
END;
$$;


ALTER FUNCTION "public"."increment_pending_balance"("p_respondent_id" "uuid", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_response_complete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL) THEN
    PERFORM net.http_post(
      url     := 'https://ngnnlwnkuohwwlhutqwb.supabase.co/functions/v1/notify-response',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nbm5sd25rdW9od3dsaHV0cXdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI3NjUzOCwiZXhwIjoyMDkwODUyNTM4fQ.1v2SKxMcTA0TzncDCcPEqhTGIcZbkmQIydaptfbLEd0'
      ),
      body    := jsonb_build_object(
        'record', jsonb_build_object(
          'id',                 NEW.id,
          'campaign_id',        NEW.campaign_id,
          'track',              NEW.track,
          'completed_at',       NEW.completed_at,
          'score_recall',       NEW.score_recall,
          'score_emotion',      NEW.score_emotion,
          'score_brand_equity', NEW.score_brand_equity
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_response_complete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."respondent_daily_withdrawal_total_kobo"("p_respondent_id" "uuid") RETURNS bigint
    LANGUAGE "sql" STABLE
    AS $$
  SELECT COALESCE(SUM(amount_kobo), 0)::bigint
  FROM withdrawal_requests
  WHERE respondent_id = p_respondent_id
    AND status IN ('pending_approval', 'queued', 'processing', 'success')
    AND requested_at >= (now() - interval '24 hours');
$$;


ALTER FUNCTION "public"."respondent_daily_withdrawal_total_kobo"("p_respondent_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_sample_size"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.required_sample_size := public.compute_sample_size(
    NEW.planned_reach,
    COALESCE(NEW.confidence_level, 95),
    COALESCE(NEW.margin_of_error, 5)
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_sample_size"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_cms_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."update_cms_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brand_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "campaign_id" "uuid",
    "amount_kobo" bigint NOT NULL,
    "currency" "text" DEFAULT 'NGN'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "paystack_reference" "text" NOT NULL,
    "paystack_access_code" "text",
    "authorization_code" "text",
    "payment_method" "text",
    "customer_email" "text",
    "metadata" "jsonb",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "brand_payments_amount_kobo_check" CHECK (("amount_kobo" > 0))
);


ALTER TABLE "public"."brand_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brands" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "logo_char" "text" DEFAULT 'B'::"text" NOT NULL,
    "color" "text" DEFAULT '#C9A84C'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "brand_type" "text" DEFAULT 'goods'::"text",
    "category_code" "text",
    "logo_url" "text",
    "product_image_url" "text",
    "website" "text",
    "description" "text",
    CONSTRAINT "brands_brand_type_check" CHECK (("brand_type" = ANY (ARRAY['goods'::"text", 'services'::"text", 'mixed'::"text"])))
);


ALTER TABLE "public"."brands" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "launched_at" "date",
    "channels" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "survey_slug" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "planned_reach" bigint,
    "coverage" "jsonb" DEFAULT '[]'::"jsonb",
    "confidence_level" numeric DEFAULT 95,
    "margin_of_error" numeric DEFAULT 5,
    "required_sample_size" integer,
    CONSTRAINT "campaigns_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'paused'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."survey_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "track" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "segment_life_stage" "text",
    "segment_purchase_freq" "text",
    "segment_brand_rel" "text",
    "segment_media_habit" "text",
    "segment_economic" "text",
    "score_exposure" numeric(5,2),
    "score_recall" numeric(5,2),
    "score_emotion" numeric(5,2),
    "score_brand_equity" numeric(5,2),
    "score_purchase_intent" numeric(5,2),
    "score_resonance" numeric(5,2),
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "completion_pct" numeric(5,2),
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "respondent_id" "uuid",
    CONSTRAINT "survey_responses_track_check" CHECK (("track" = ANY (ARRAY['A'::"text", 'B'::"text", 'unknown'::"text"])))
);

ALTER TABLE ONLY "public"."survey_responses" REPLICA IDENTITY FULL;


ALTER TABLE "public"."survey_responses" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."campaign_analytics" AS
 SELECT "c"."id" AS "campaign_id",
    "c"."name" AS "campaign_name",
    "b"."id" AS "brand_id",
    "b"."name" AS "brand_name",
    "count"("r"."id") AS "total_responses",
    "count"("r"."id") FILTER (WHERE ("r"."track" = 'A'::"text")) AS "track_a_count",
    "count"("r"."id") FILTER (WHERE ("r"."track" = 'B'::"text")) AS "track_b_count",
    "count"("r"."id") FILTER (WHERE ("r"."completed_at" IS NOT NULL)) AS "completed_count",
    "round"(((100.0 * ("count"("r"."id") FILTER (WHERE ("r"."completed_at" IS NOT NULL)))::numeric) / (NULLIF("count"("r"."id"), 0))::numeric), 1) AS "completion_rate",
    "round"("avg"("r"."score_recall"), 1) AS "avg_recall",
    "round"("avg"("r"."score_emotion"), 1) AS "avg_emotion",
    "round"("avg"("r"."score_brand_equity"), 1) AS "avg_brand_equity",
    "round"("avg"("r"."score_purchase_intent"), 1) AS "avg_purchase_intent",
    "round"("avg"("r"."score_resonance"), 1) AS "avg_resonance",
    "c"."status",
    "c"."launched_at",
    "c"."created_at"
   FROM (("public"."campaigns" "c"
     JOIN "public"."brands" "b" ON (("b"."id" = "c"."brand_id")))
     LEFT JOIN "public"."survey_responses" "r" ON (("r"."campaign_id" = "c"."id")))
  GROUP BY "c"."id", "c"."name", "b"."id", "b"."name", "c"."status", "c"."launched_at", "c"."created_at";


ALTER VIEW "public"."campaign_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaign_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "asset_type" "text" NOT NULL,
    "label" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "public_url" "text",
    "file_name" "text" NOT NULL,
    "file_size" bigint,
    "mime_type" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "campaign_assets_asset_type_check" CHECK (("asset_type" = ANY (ARRAY['video'::"text", 'audio'::"text", 'static'::"text"])))
);


ALTER TABLE "public"."campaign_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "sector_code" "text" NOT NULL,
    "sector_name" "text" NOT NULL,
    "brand_type_suggestion" "text" DEFAULT 'goods'::"text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "categories_brand_type_suggestion_check" CHECK (("brand_type_suggestion" = ANY (ARRAY['goods'::"text", 'services'::"text", 'mixed'::"text"])))
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cms_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "page_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cms_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cms_brand_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "site_name" "text" DEFAULT 'AdChasser'::"text" NOT NULL,
    "tagline" "text" DEFAULT 'Brand Campaign Intelligence Platform'::"text" NOT NULL,
    "primary_color" "text" DEFAULT '#C9A84C'::"text" NOT NULL,
    "secondary_color" "text" DEFAULT '#3b82f6'::"text" NOT NULL,
    "headline_font" "text" DEFAULT 'Playfair Display'::"text" NOT NULL,
    "body_font" "text" DEFAULT 'DM Sans'::"text" NOT NULL,
    "logo_url" "text",
    "favicon_url" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cms_brand_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cms_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cms_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."paystack_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "paystack_event" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "reference" "text",
    "payload" "jsonb" NOT NULL,
    "processed" boolean DEFAULT false,
    "processed_at" timestamp with time zone,
    "error_message" "text",
    "received_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."paystack_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."respondent_completions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "respondent_id" "uuid",
    "campaign_id" "uuid",
    "survey_response_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "time_spent_seconds" integer,
    "quality_score" integer DEFAULT 0,
    "quality_status" "text" DEFAULT 'pending'::"text",
    "quality_flags" "jsonb" DEFAULT '[]'::"jsonb",
    "retry_count" integer DEFAULT 0,
    "retry_allowed_until" timestamp with time zone,
    "reward_amount" numeric DEFAULT 1000,
    "payment_status" "text" DEFAULT 'pending'::"text",
    "respondent_notified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."respondent_completions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."respondent_earnings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "respondent_id" "uuid",
    "total_earned" numeric DEFAULT 0,
    "pending_balance" numeric DEFAULT 0,
    "available_balance" numeric DEFAULT 0,
    "withdrawn_total" numeric DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."respondent_earnings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."respondent_payment_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "respondent_id" "uuid",
    "method_type" "text" DEFAULT 'bank_transfer'::"text",
    "is_default" boolean DEFAULT false,
    "bank_name" "text",
    "bank_code" "text",
    "account_number" "text",
    "account_name" "text",
    "country" "text" DEFAULT 'Nigeria'::"text",
    "currency" "text" DEFAULT 'NGN'::"text",
    "paystack_recipient_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "paystack_bank_code" "text",
    "verified_account_name" "text",
    "verified_at" timestamp with time zone,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."respondent_payment_methods" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."segment_analytics" AS
 SELECT "campaign_id",
    "segment_life_stage",
    "segment_purchase_freq",
    "segment_brand_rel",
    "segment_media_habit",
    "track",
    "count"(*) AS "response_count",
    "round"("avg"("score_recall"), 1) AS "avg_recall",
    "round"("avg"("score_emotion"), 1) AS "avg_emotion",
    "round"("avg"("score_brand_equity"), 1) AS "avg_brand_equity",
    "round"("avg"("score_purchase_intent"), 1) AS "avg_purchase_intent"
   FROM "public"."survey_responses" "r"
  WHERE ("completed_at" IS NOT NULL)
  GROUP BY "campaign_id", "segment_life_stage", "segment_purchase_freq", "segment_brand_rel", "segment_media_habit", "track";


ALTER VIEW "public"."segment_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."survey_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "response_id" "uuid" NOT NULL,
    "question_id" "text" NOT NULL,
    "section_num" integer NOT NULL,
    "question_type" "text" NOT NULL,
    "answer_text" "text",
    "answer_single" "text",
    "answer_multi" "text"[],
    "answer_numeric" numeric(5,2),
    "answer_json" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."survey_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."withdrawal_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "respondent_id" "uuid",
    "currency" "text" DEFAULT 'NGN'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "payment_method_id" "uuid",
    "paystack_transfer_id" "text",
    "paystack_reference" "text",
    "failure_reason" "text",
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    "amount_kobo" bigint NOT NULL,
    "idempotency_key" "text",
    "approval_required" boolean DEFAULT false,
    "approved_by" "text",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    CONSTRAINT "chk_amount_kobo_positive" CHECK (("amount_kobo" > 0))
);


ALTER TABLE "public"."withdrawal_requests" OWNER TO "postgres";


ALTER TABLE ONLY "public"."brand_payments"
    ADD CONSTRAINT "brand_payments_paystack_reference_key" UNIQUE ("paystack_reference");



ALTER TABLE ONLY "public"."brand_payments"
    ADD CONSTRAINT "brand_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_assets"
    ADD CONSTRAINT "campaign_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_survey_slug_key" UNIQUE ("survey_slug");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cms_blocks"
    ADD CONSTRAINT "cms_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cms_brand_settings"
    ADD CONSTRAINT "cms_brand_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cms_pages"
    ADD CONSTRAINT "cms_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cms_pages"
    ADD CONSTRAINT "cms_pages_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."paystack_events"
    ADD CONSTRAINT "paystack_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."respondent_completions"
    ADD CONSTRAINT "respondent_completions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."respondent_earnings"
    ADD CONSTRAINT "respondent_earnings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."respondent_payment_methods"
    ADD CONSTRAINT "respondent_payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."respondents"
    ADD CONSTRAINT "respondents_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."respondents"
    ADD CONSTRAINT "respondents_email_unique" UNIQUE ("email");



ALTER TABLE ONLY "public"."respondents"
    ADD CONSTRAINT "respondents_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."respondents"
    ADD CONSTRAINT "respondents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."respondents"
    ADD CONSTRAINT "respondents_user_id_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."survey_answers"
    ADD CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_bp_campaign" ON "public"."brand_payments" USING "btree" ("campaign_id");



CREATE INDEX "idx_bp_status" ON "public"."brand_payments" USING "btree" ("status");



CREATE INDEX "idx_bp_user_id" ON "public"."brand_payments" USING "btree" ("user_id");



CREATE INDEX "idx_campaign_assets_campaign" ON "public"."campaign_assets" USING "btree" ("campaign_id");



CREATE INDEX "idx_campaigns_brand_id" ON "public"."campaigns" USING "btree" ("brand_id");



CREATE INDEX "idx_campaigns_status" ON "public"."campaigns" USING "btree" ("status");



CREATE INDEX "idx_completions_campaign" ON "public"."respondent_completions" USING "btree" ("campaign_id");



CREATE INDEX "idx_completions_respondent" ON "public"."respondent_completions" USING "btree" ("respondent_id");



CREATE INDEX "idx_earnings_respondent" ON "public"."respondent_earnings" USING "btree" ("respondent_id");



CREATE UNIQUE INDEX "idx_pse_paystack_event" ON "public"."paystack_events" USING "btree" ("paystack_event");



CREATE INDEX "idx_pse_reference" ON "public"."paystack_events" USING "btree" ("reference") WHERE ("reference" IS NOT NULL);



CREATE INDEX "idx_pse_unprocessed" ON "public"."paystack_events" USING "btree" ("processed", "received_at") WHERE ("processed" = false);



CREATE INDEX "idx_respondents_email" ON "public"."respondents" USING "btree" ("email");



CREATE INDEX "idx_respondents_phone" ON "public"."respondents" USING "btree" ("phone");



CREATE INDEX "idx_respondents_user_id" ON "public"."respondents" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_rpm_recipient_code" ON "public"."respondent_payment_methods" USING "btree" ("paystack_recipient_code") WHERE ("paystack_recipient_code" IS NOT NULL);



CREATE INDEX "idx_survey_answers_question" ON "public"."survey_answers" USING "btree" ("question_id");



CREATE INDEX "idx_survey_answers_response" ON "public"."survey_answers" USING "btree" ("response_id");



CREATE INDEX "idx_survey_responses_campaign" ON "public"."survey_responses" USING "btree" ("campaign_id");



CREATE INDEX "idx_survey_responses_respondent" ON "public"."survey_responses" USING "btree" ("respondent_id");



CREATE INDEX "idx_survey_responses_track" ON "public"."survey_responses" USING "btree" ("track");



CREATE INDEX "idx_withdrawals_respondent" ON "public"."withdrawal_requests" USING "btree" ("respondent_id");



CREATE UNIQUE INDEX "idx_wr_idempotency_key" ON "public"."withdrawal_requests" USING "btree" ("idempotency_key") WHERE ("idempotency_key" IS NOT NULL);



CREATE INDEX "idx_wr_paystack_reference" ON "public"."withdrawal_requests" USING "btree" ("paystack_reference") WHERE ("paystack_reference" IS NOT NULL);



CREATE INDEX "idx_wr_paystack_transfer_id" ON "public"."withdrawal_requests" USING "btree" ("paystack_transfer_id") WHERE ("paystack_transfer_id" IS NOT NULL);



CREATE INDEX "idx_wr_status_created" ON "public"."withdrawal_requests" USING "btree" ("status", "requested_at");



CREATE OR REPLACE TRIGGER "campaigns_sample_size" BEFORE INSERT OR UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."sync_sample_size"();



CREATE OR REPLACE TRIGGER "cms_blocks_updated_at" BEFORE UPDATE ON "public"."cms_blocks" FOR EACH ROW EXECUTE FUNCTION "public"."update_cms_updated_at"();



CREATE OR REPLACE TRIGGER "cms_brand_settings_updated_at" BEFORE UPDATE ON "public"."cms_brand_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_cms_updated_at"();



CREATE OR REPLACE TRIGGER "cms_pages_updated_at" BEFORE UPDATE ON "public"."cms_pages" FOR EACH ROW EXECUTE FUNCTION "public"."update_cms_updated_at"();



CREATE OR REPLACE TRIGGER "on_completion_status_change" AFTER UPDATE ON "public"."respondent_completions" FOR EACH ROW EXECUTE FUNCTION "public"."credit_respondent_on_approval"();



CREATE OR REPLACE TRIGGER "on_respondent_created" AFTER INSERT ON "public"."respondents" FOR EACH ROW EXECUTE FUNCTION "public"."create_respondent_wallet"();



CREATE OR REPLACE TRIGGER "on_response_complete" AFTER UPDATE ON "public"."survey_responses" FOR EACH ROW EXECUTE FUNCTION "public"."notify_response_complete"();



CREATE OR REPLACE TRIGGER "on_withdrawal_completed" AFTER UPDATE ON "public"."withdrawal_requests" FOR EACH ROW EXECUTE FUNCTION "public"."deduct_on_withdrawal"();



CREATE OR REPLACE TRIGGER "trg_brands_updated_at" BEFORE UPDATE ON "public"."brands" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_campaigns_updated_at" BEFORE UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."brand_payments"
    ADD CONSTRAINT "brand_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."campaign_assets"
    ADD CONSTRAINT "campaign_assets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."cms_blocks"
    ADD CONSTRAINT "cms_blocks_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "public"."cms_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."respondent_completions"
    ADD CONSTRAINT "respondent_completions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."respondent_completions"
    ADD CONSTRAINT "respondent_completions_respondent_id_fkey" FOREIGN KEY ("respondent_id") REFERENCES "public"."respondents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."respondent_completions"
    ADD CONSTRAINT "respondent_completions_survey_response_id_fkey" FOREIGN KEY ("survey_response_id") REFERENCES "public"."survey_responses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."respondent_earnings"
    ADD CONSTRAINT "respondent_earnings_respondent_id_fkey" FOREIGN KEY ("respondent_id") REFERENCES "public"."respondents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."respondent_payment_methods"
    ADD CONSTRAINT "respondent_payment_methods_respondent_id_fkey" FOREIGN KEY ("respondent_id") REFERENCES "public"."respondents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."respondents"
    ADD CONSTRAINT "respondents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_answers"
    ADD CONSTRAINT "survey_answers_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "public"."survey_responses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_respondent_id_fkey" FOREIGN KEY ("respondent_id") REFERENCES "public"."respondents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_respondent_id_fkey" FOREIGN KEY ("respondent_id") REFERENCES "public"."respondents"("id") ON DELETE CASCADE;



CREATE POLICY "Admin manages categories" ON "public"."categories" USING (true) WITH CHECK (true);



CREATE POLICY "Admin reads all" ON "public"."user_profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles" "user_profiles_1"
  WHERE (("user_profiles_1"."id" = "auth"."uid"()) AND ("user_profiles_1"."role" = 'admin'::"text")))));



CREATE POLICY "Categories readable by all" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Public all answers" ON "public"."survey_answers" USING (true) WITH CHECK (true);



CREATE POLICY "Public all responses" ON "public"."survey_responses" USING (true) WITH CHECK (true);



CREATE POLICY "Users read own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "anyone_can_read_active_campaigns" ON "public"."campaigns" FOR SELECT TO "authenticated" USING (("status" = ANY (ARRAY['active'::"text", 'completed'::"text"])));



CREATE POLICY "anyone_can_read_brands" ON "public"."brands" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "assets_all" ON "public"."campaign_assets" USING ((EXISTS ( SELECT 1
   FROM "public"."campaigns" "c"
  WHERE (("c"."id" = "campaign_assets"."campaign_id") AND (("c"."user_id" = "auth"."uid"()) OR ("auth"."uid"() = '4a05e9c5-005b-4dba-8160-5b3354c5df37'::"uuid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."campaigns" "c"
  WHERE (("c"."id" = "campaign_assets"."campaign_id") AND (("c"."user_id" = "auth"."uid"()) OR ("auth"."uid"() = '4a05e9c5-005b-4dba-8160-5b3354c5df37'::"uuid"))))));



CREATE POLICY "assets_select" ON "public"."campaign_assets" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."campaigns" "c"
  WHERE (("c"."id" = "campaign_assets"."campaign_id") AND (("c"."user_id" = "auth"."uid"()) OR ("auth"."uid"() = '4a05e9c5-005b-4dba-8160-5b3354c5df37'::"uuid"))))));



CREATE POLICY "brand_settings_auth_write" ON "public"."cms_brand_settings" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "brand_settings_public_read" ON "public"."cms_brand_settings" FOR SELECT USING (true);



ALTER TABLE "public"."brands" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brands_all" ON "public"."brands" USING ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() = '4a05e9c5-005b-4dba-8160-5b3354c5df37'::"uuid"))) WITH CHECK ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() = '4a05e9c5-005b-4dba-8160-5b3354c5df37'::"uuid")));



CREATE POLICY "brands_select" ON "public"."brands" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() = '4a05e9c5-005b-4dba-8160-5b3354c5df37'::"uuid")));



ALTER TABLE "public"."campaign_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "campaigns_all" ON "public"."campaigns" USING ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() = '4a05e9c5-005b-4dba-8160-5b3354c5df37'::"uuid"))) WITH CHECK ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() = '4a05e9c5-005b-4dba-8160-5b3354c5df37'::"uuid")));



CREATE POLICY "campaigns_select" ON "public"."campaigns" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() = '4a05e9c5-005b-4dba-8160-5b3354c5df37'::"uuid")));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cms_blocks_auth_read_all" ON "public"."cms_blocks" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "cms_blocks_auth_write" ON "public"."cms_blocks" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "cms_blocks_public_read" ON "public"."cms_blocks" FOR SELECT USING (("page_id" IN ( SELECT "cms_pages"."id"
   FROM "public"."cms_pages"
  WHERE ("cms_pages"."published" = true))));



CREATE POLICY "cms_pages_auth_read_all" ON "public"."cms_pages" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "cms_pages_auth_write" ON "public"."cms_pages" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "cms_pages_public_read" ON "public"."cms_pages" FOR SELECT USING (("published" = true));



CREATE POLICY "completions_own" ON "public"."respondent_completions" USING (("respondent_id" IN ( SELECT "respondents"."id"
   FROM "public"."respondents"
  WHERE ("respondents"."user_id" = "auth"."uid"()))));



CREATE POLICY "earnings_own" ON "public"."respondent_earnings" USING (("respondent_id" IN ( SELECT "respondents"."id"
   FROM "public"."respondents"
  WHERE ("respondents"."user_id" = "auth"."uid"()))));



CREATE POLICY "payment_methods_own" ON "public"."respondent_payment_methods" USING (("respondent_id" IN ( SELECT "respondents"."id"
   FROM "public"."respondents"
  WHERE ("respondents"."user_id" = "auth"."uid"()))));



CREATE POLICY "public_read_brands" ON "public"."brands" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "public_read_campaign_assets" ON "public"."campaign_assets" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "respondents_own" ON "public"."respondents" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."survey_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."survey_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "withdrawals_own" ON "public"."withdrawal_requests" USING (("respondent_id" IN ( SELECT "respondents"."id"
   FROM "public"."respondents"
  WHERE ("respondents"."user_id" = "auth"."uid"()))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";












GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."auto_approve_pending_completions"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_approve_pending_completions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_approve_pending_completions"() TO "service_role";



GRANT ALL ON TABLE "public"."respondents" TO "anon";
GRANT ALL ON TABLE "public"."respondents" TO "authenticated";
GRANT ALL ON TABLE "public"."respondents" TO "service_role";



GRANT ALL ON FUNCTION "public"."compute_profile_score"("r" "public"."respondents") TO "anon";
GRANT ALL ON FUNCTION "public"."compute_profile_score"("r" "public"."respondents") TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_profile_score"("r" "public"."respondents") TO "service_role";



GRANT ALL ON FUNCTION "public"."compute_sample_size"("planned_reach" bigint, "confidence_level" numeric, "margin_of_error" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."compute_sample_size"("planned_reach" bigint, "confidence_level" numeric, "margin_of_error" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_sample_size"("planned_reach" bigint, "confidence_level" numeric, "margin_of_error" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_respondent_wallet"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_respondent_wallet"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_respondent_wallet"() TO "service_role";



GRANT ALL ON FUNCTION "public"."credit_respondent_on_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."credit_respondent_on_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."credit_respondent_on_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_on_withdrawal"() TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_on_withdrawal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_on_withdrawal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_surveys"("p_respondent_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_surveys"("p_respondent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_surveys"("p_respondent_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_pending_balance"("p_respondent_id" "uuid", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_pending_balance"("p_respondent_id" "uuid", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_pending_balance"("p_respondent_id" "uuid", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_response_complete"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_response_complete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_response_complete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."respondent_daily_withdrawal_total_kobo"("p_respondent_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."respondent_daily_withdrawal_total_kobo"("p_respondent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."respondent_daily_withdrawal_total_kobo"("p_respondent_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_sample_size"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_sample_size"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_sample_size"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_cms_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_cms_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_cms_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";
























GRANT ALL ON TABLE "public"."brand_payments" TO "anon";
GRANT ALL ON TABLE "public"."brand_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."brand_payments" TO "service_role";



GRANT ALL ON TABLE "public"."brands" TO "anon";
GRANT ALL ON TABLE "public"."brands" TO "authenticated";
GRANT ALL ON TABLE "public"."brands" TO "service_role";



GRANT ALL ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."survey_responses" TO "anon";
GRANT ALL ON TABLE "public"."survey_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_responses" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_analytics" TO "anon";
GRANT ALL ON TABLE "public"."campaign_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_assets" TO "anon";
GRANT ALL ON TABLE "public"."campaign_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_assets" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."cms_blocks" TO "anon";
GRANT ALL ON TABLE "public"."cms_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."cms_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."cms_brand_settings" TO "anon";
GRANT ALL ON TABLE "public"."cms_brand_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."cms_brand_settings" TO "service_role";



GRANT ALL ON TABLE "public"."cms_pages" TO "anon";
GRANT ALL ON TABLE "public"."cms_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."cms_pages" TO "service_role";



GRANT ALL ON TABLE "public"."paystack_events" TO "anon";
GRANT ALL ON TABLE "public"."paystack_events" TO "authenticated";
GRANT ALL ON TABLE "public"."paystack_events" TO "service_role";



GRANT ALL ON TABLE "public"."respondent_completions" TO "anon";
GRANT ALL ON TABLE "public"."respondent_completions" TO "authenticated";
GRANT ALL ON TABLE "public"."respondent_completions" TO "service_role";



GRANT ALL ON TABLE "public"."respondent_earnings" TO "anon";
GRANT ALL ON TABLE "public"."respondent_earnings" TO "authenticated";
GRANT ALL ON TABLE "public"."respondent_earnings" TO "service_role";



GRANT ALL ON TABLE "public"."respondent_payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."respondent_payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."respondent_payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."segment_analytics" TO "anon";
GRANT ALL ON TABLE "public"."segment_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."segment_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."survey_answers" TO "anon";
GRANT ALL ON TABLE "public"."survey_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_answers" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."withdrawal_requests" TO "anon";
GRANT ALL ON TABLE "public"."withdrawal_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."withdrawal_requests" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop policy "public_read_brands" on "public"."brands";

drop policy "public_read_campaign_assets" on "public"."campaign_assets";


  create policy "public_read_brands"
  on "public"."brands"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "public_read_campaign_assets"
  on "public"."campaign_assets"
  as permissive
  for select
  to anon, authenticated
using (true);


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Public delete storage"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'campaign-assets'::text));



  create policy "Public insert storage"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'campaign-assets'::text));



  create policy "Public read storage"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'campaign-assets'::text));



  create policy "Public update storage"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'campaign-assets'::text));



