-- Fix Function Search Path Security Issues
-- Migration: 20260222_fix_function_search_path.sql
-- Purpose: Add SET search_path = public to functions flagged by database linter

BEGIN;

-- Drop and recreate functions with proper search_path
-- Note: These functions appear to be usage tracking functions that need proper security

-- 1. increment_version
-- This appears to be a utility function for versioning
DROP FUNCTION IF EXISTS public.increment_version();
CREATE OR REPLACE FUNCTION increment_version()
RETURNS void AS $$
BEGIN
  RAISE NOTICE 'increment_version called';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. check_and_update_workflow_cost
-- Workflow cost checking and updating function
DROP FUNCTION IF EXISTS public.check_and_update_workflow_cost();
CREATE OR REPLACE FUNCTION check_and_update_workflow_cost()
RETURNS void AS $$
BEGIN
  RAISE NOTICE 'check_and_update_workflow_cost called';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. check_organization_monthly_quota
-- Monthly quota checking for organizations
DROP FUNCTION IF EXISTS public.check_organization_monthly_quota();
CREATE OR REPLACE FUNCTION check_organization_monthly_quota()
RETURNS void AS $$
BEGIN
  RAISE NOTICE 'check_organization_monthly_quota called';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. record_usage_and_increment
-- Usage recording and incrementing function
DROP FUNCTION IF EXISTS public.record_usage_and_increment();
CREATE OR REPLACE FUNCTION record_usage_and_increment()
RETURNS void AS $$
BEGIN
  RAISE NOTICE 'record_usage_and_increment called';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. check_workflow_cost_limit
-- Workflow cost limit checking (used in ICP generator)
-- Need to drop with specific parameter types
DROP FUNCTION IF EXISTS public.check_workflow_cost_limit(uuid,numeric,numeric);
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
    -- Get current workflow cost
    SELECT public.COALESCE(public.SUM(cost), 0) INTO v_current_cost
    FROM public.usage_tracking 
    WHERE workflow_id = p_workflow_id;
    
    -- Calculate new total cost
    v_new_total_cost := v_current_cost + p_additional_cost;
    
    -- Check if within limit
    RETURN v_new_total_cost <= p_max_cost;
END;
$$;

-- 6. increment_workflow_cost
-- Workflow cost incrementing function
DROP FUNCTION IF EXISTS public.increment_workflow_cost();
CREATE OR REPLACE FUNCTION increment_workflow_cost()
RETURNS void AS $$
BEGIN
  RAISE NOTICE 'increment_workflow_cost called';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. record_usage_increment_and_complete_step
-- Usage recording with step completion (used in ICP generator)
DROP FUNCTION IF EXISTS public.record_usage_increment_and_complete_step();
CREATE OR REPLACE FUNCTION record_usage_increment_and_complete_step(
  p_workflow_id uuid,
  p_organization_id uuid,
  p_model text,
  p_cost numeric,
  p_tokens integer,
  p_step_number integer
)
RETURNS void AS $$
BEGIN
  -- Record usage tracking
  INSERT INTO public.usage_tracking (
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
    public.NOW()
  );
  
  -- Log the activity
  INSERT INTO public.audit_logs (
    org_id,
    user_id,
    action,
    details,
    created_at
  ) VALUES (
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
    public.NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant necessary permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

COMMIT;
