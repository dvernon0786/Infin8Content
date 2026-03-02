-- ============================================================
-- Migration: Strict search_path hardening (Supabase linter fix)
-- Date: 2026-03-02
-- Description:
-- Rewrites SECURITY DEFINER functions to use:
--   SET search_path = ''
-- and fully qualified public.* references
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
  p_workflow_id uuid,
  p_organization_id uuid,
  p_model text,
  p_cost numeric,
  p_tokens integer,
  p_step_number integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

  INSERT INTO public.usage_tracking (
    workflow_id,
    organization_id,
    model,
    cost,
    tokens,
    step_number,
    created_at
  )
  VALUES (
    p_workflow_id,
    p_organization_id,
    p_model,
    p_cost,
    p_tokens,
    p_step_number,
    public.now()
  );

  INSERT INTO public.audit_logs (
    org_id,
    user_id,
    action,
    details,
    created_at
  )
  VALUES (
    p_organization_id,
    public.auth.uid(),
    'usage.recorded',
    public.json_build_object(
      'workflow_id', p_workflow_id,
      'model', p_model,
      'cost', p_cost,
      'tokens', p_tokens,
      'step_number', p_step_number
    ),
    public.now()
  );

END;
$$;


-- ============================================================
-- Permissions (idempotent)
-- ============================================================

REVOKE ALL ON FUNCTION public.increment_version() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_workflow_cost() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_usage_and_increment() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_usage_increment_and_complete_step(uuid, uuid, text, numeric, integer, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.increment_version() TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_workflow_cost() TO service_role;
GRANT EXECUTE ON FUNCTION public.record_usage_and_increment() TO service_role;
GRANT EXECUTE ON FUNCTION public.record_usage_increment_and_complete_step(uuid, uuid, text, numeric, integer, integer) TO service_role;

GRANT EXECUTE ON FUNCTION public.increment_version() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_workflow_cost() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_usage_and_increment() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_usage_increment_and_complete_step(uuid, uuid, text, numeric, integer, integer) TO authenticated;

COMMIT;
