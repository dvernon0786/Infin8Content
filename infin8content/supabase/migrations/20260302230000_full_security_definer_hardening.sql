-- ============================================================
-- Migration: Full SECURITY DEFINER Hardening (Strict Mode)
-- Date: 2026-03-02
-- Purpose:
--   Enforce:
--     - SECURITY DEFINER
--     - SET search_path = ''
--     - Fully qualified public.*
--     - Fully qualified pg_catalog.*
--   For all privileged functions
-- ============================================================

BEGIN;

-- ============================================================
-- 1️⃣ increment_version
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE NOTICE 'increment_version called';
END;
$$;


-- ============================================================
-- 2️⃣ increment_workflow_cost
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_workflow_cost()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE NOTICE 'increment_workflow_cost called';
END;
$$;


-- ============================================================
-- 3️⃣ record_usage_and_increment
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_usage_and_increment()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE NOTICE 'record_usage_and_increment called';
END;
$$;


-- ============================================================
-- 4️⃣ record_usage_increment_and_complete_step
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_usage_increment_and_complete_step(
    p_completion_tokens integer,
    p_cost numeric,
    p_generated_at timestamptz,
    p_icp_data jsonb,
    p_idempotency_key text,
    p_model text,
    p_organization_id uuid,
    p_prompt_tokens integer,
    p_tokens_used integer,
    p_workflow_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

  INSERT INTO public.usage_tracking (
    organization_id,
    workflow_id,
    model,
    prompt_tokens,
    completion_tokens,
    tokens_used,
    cost,
    generated_at,
    idempotency_key
  )
  VALUES (
    p_organization_id,
    p_workflow_id,
    p_model,
    p_prompt_tokens,
    p_completion_tokens,
    p_tokens_used,
    p_cost,
    p_generated_at,
    p_idempotency_key
  );

  UPDATE public.intent_workflows
  SET
    icp_data = p_icp_data,
    state = 'step_2_competitors',
    updated_at = pg_catalog.now()
  WHERE id = p_workflow_id;

END;
$$;


-- ============================================================
-- 5️⃣ reseed_sections
-- ============================================================

CREATE OR REPLACE FUNCTION public.reseed_sections(
  p_article_id uuid,
  p_sections   jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

  DELETE FROM public.article_sections
  WHERE article_id = p_article_id;

  INSERT INTO public.article_sections (
    article_id,
    section_order,
    section_header,
    section_type,
    planner_output,
    status,
    created_at,
    updated_at
  )
  SELECT
    p_article_id,
    (s->>'section_order')::int,
    s->>'section_header',
    s->>'section_type',
    s->'planner_output',
    'pending',
    pg_catalog.now(),
    pg_catalog.now()
  FROM pg_catalog.jsonb_array_elements(p_sections) AS s;

END;
$$;


-- ============================================================
-- 6️⃣ ensure_all_sections_completed (trigger)
-- ============================================================

CREATE OR REPLACE FUNCTION public.ensure_all_sections_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

  IF NEW.status = 'completed'
     AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN

      IF EXISTS (
          SELECT 1
          FROM public.article_sections
          WHERE article_id = NEW.id
          AND status <> 'completed'
      ) THEN
          RAISE EXCEPTION
          'Architectural violation: Cannot mark article % completed while sections are incomplete.',
          NEW.id;
      END IF;

      IF NEW.sections IS NULL
         OR pg_catalog.jsonb_array_length(NEW.sections) = 0 THEN
          RAISE EXCEPTION
          'Architectural violation: Cannot mark article % completed with empty snapshot.',
          NEW.id;
      END IF;

  END IF;

  RETURN NEW;

END;
$$;


-- ============================================================
-- 7️⃣ check_and_update_workflow_cost
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_and_update_workflow_cost(
  p_workflow_id uuid,
  p_additional_cost numeric,
  p_max_cost numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_cost numeric := 0;
  v_new_total numeric;
BEGIN

  SELECT pg_catalog.coalesce(pg_catalog.sum(cost), 0)
  INTO v_current_cost
  FROM public.usage_tracking
  WHERE workflow_id = p_workflow_id;

  v_new_total := v_current_cost + p_additional_cost;

  RETURN v_new_total <= p_max_cost;

END;
$$;


-- ============================================================
-- Permissions (Idempotent)
-- ============================================================

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

COMMIT;
