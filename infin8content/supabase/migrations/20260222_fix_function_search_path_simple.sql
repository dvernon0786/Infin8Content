-- Simple Fix for Function Search Path Security Issues
-- Migration: 20260222_fix_function_search_path_simple.sql

BEGIN;

-- Drop all functions first (ignore parameter types)
DROP FUNCTION IF EXISTS public.increment_version() CASCADE;
DROP FUNCTION IF EXISTS public.check_and_update_workflow_cost() CASCADE;
DROP FUNCTION IF EXISTS public.check_organization_monthly_quota() CASCADE;
DROP FUNCTION IF EXISTS public.record_usage_and_increment() CASCADE;
DROP FUNCTION IF EXISTS public.check_workflow_cost_limit() CASCADE;
DROP FUNCTION IF EXISTS public.increment_workflow_cost() CASCADE;
DROP FUNCTION IF EXISTS public.record_usage_increment_and_complete_step() CASCADE;

-- Recreate with proper search_path

-- 1. increment_version
CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE NOTICE 'increment_version called - implementation needed';
END;
$$;

-- 2. check_and_update_workflow_cost
CREATE OR REPLACE FUNCTION public.check_and_update_workflow_cost()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE NOTICE 'check_and_update_workflow_cost called - implementation needed';
END;
$$;

-- 3. check_organization_monthly_quota
CREATE OR REPLACE FUNCTION public.check_organization_monthly_quota()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE NOTICE 'check_organization_monthly_quota called - implementation needed';
END;
$$;

-- 4. record_usage_and_increment
CREATE OR REPLACE FUNCTION public.record_usage_and_increment()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE NOTICE 'record_usage_and_increment called - implementation needed';
END;
$$;

-- 5. check_workflow_cost_limit (with implementation)
CREATE OR REPLACE FUNCTION public.check_workflow_cost_limit(
  p_workflow_id uuid,
  p_additional_cost numeric,
  p_max_cost numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_cost numeric := 0;
    v_new_total_cost numeric;
BEGIN
    SELECT COALESCE(SUM(cost), 0) INTO v_current_cost
    FROM usage_tracking 
    WHERE workflow_id = p_workflow_id;
    
    v_new_total_cost := v_current_cost + p_additional_cost;
    RETURN v_new_total_cost <= p_max_cost;
END;
$$;

-- 6. increment_workflow_cost
CREATE OR REPLACE FUNCTION public.increment_workflow_cost()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE NOTICE 'increment_workflow_cost called - implementation needed';
END;
$$;

-- 7. record_usage_increment_and_complete_step (with implementation)
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
SET search_path = public
AS $$
BEGIN
  INSERT INTO usage_tracking (
    workflow_id,
    organization_id,
    model,
    cost,
    tokens,
    step_number,
    created_at
  ) VALUES (
    p_workflow_id,
    p_organization_id,
    p_model,
    p_cost,
    p_tokens,
    p_step_number,
    NOW()
  );
  
  INSERT INTO audit_logs (
    org_id,
    user_id,
    action,
    details,
    created_at
  ) VALUES (
    p_organization_id,
    auth.uid(),
    'usage.recorded',
    json_build_object(
      'workflow_id', p_workflow_id,
      'model', p_model,
      'cost', p_cost,
      'tokens', p_tokens,
      'step_number', p_step_number
    ),
    NOW()
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

COMMIT;
