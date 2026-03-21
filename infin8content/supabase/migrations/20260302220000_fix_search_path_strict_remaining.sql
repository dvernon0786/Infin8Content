-- ============================================================
-- Migration: Final Strict search_path Hardening
-- Date: 2026-03-02
-- Description: Hardens triggers and remaining business logic
-- Rewrites functions to use SET search_path = '' and public.* qualification
-- ============================================================

BEGIN;

-- 1️⃣ ensure_all_sections_completed (Trigger Function)
CREATE OR REPLACE FUNCTION public.ensure_all_sections_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
        IF EXISTS (
            SELECT 1 
            FROM public.article_sections 
            WHERE article_id = NEW.id 
            AND status <> 'completed'
        ) THEN
            RAISE EXCEPTION 'Architectural violation: Cannot mark article % completed while sections still pending.', NEW.id;
        END IF;

        IF NEW.sections IS NULL OR public.jsonb_array_length(NEW.sections) = 0 THEN
             RAISE EXCEPTION 'Architectural violation: Cannot mark article % completed with empty sections.', NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- 2️⃣ reseed_sections (Core Article Logic)
CREATE OR REPLACE FUNCTION public.reseed_sections(
  p_article_id UUID,
  p_sections   JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.article_sections WHERE article_id = p_article_id;

  INSERT INTO public.article_sections (
    article_id, section_order, section_header, section_type, planner_output, status, created_at, updated_at
  )
  SELECT
    p_article_id,
    (s->>'section_order')::int,
    s->>'section_header',
    s->>'section_type',
    s->'planner_output',
    'pending',
    public.now(),
    public.now()
  FROM public.jsonb_array_elements(p_sections) AS s;
END;
$$;

-- 3️⃣ check_workflow_cost_limit (Logic Implementation)
CREATE OR REPLACE FUNCTION public.check_workflow_cost_limit(
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
    v_new_total_cost numeric;
BEGIN
    SELECT COALESCE(SUM(cost), 0) INTO v_current_cost
    FROM public.usage_tracking 
    WHERE workflow_id = p_workflow_id;
    
    v_new_total_cost := v_current_cost + p_additional_cost;
    RETURN v_new_total_cost <= p_max_cost;
END;
$$;

-- 4️⃣ check_and_update_workflow_cost (Stub)
CREATE OR REPLACE FUNCTION public.check_and_update_workflow_cost()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN RAISE NOTICE 'check_and_update_workflow_cost called'; END; $$;

-- 5️⃣ check_organization_monthly_quota (Stub)
CREATE OR REPLACE FUNCTION public.check_organization_monthly_quota()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN RAISE NOTICE 'check_organization_monthly_quota called'; END; $$;

-- CLEANUP STRAY OVERLOADS (Safety Pass)
-- This drops any versions that DO NOT have a fixed search_path set.
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.proname IN ('reseed_sections', 'ensure_all_sections_completed', 'check_workflow_cost_limit', 'check_and_update_workflow_cost', 'check_organization_monthly_quota')
        AND p.proconfig IS NULL
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.nspname || '.' || r.proname || '(' || r.args || ') CASCADE';
    END LOOP;
END $$;

-- Update Permissions
REVOKE ALL ON FUNCTION public.reseed_sections(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reseed_sections(UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.reseed_sections(UUID, JSONB) TO authenticated;

COMMIT;
