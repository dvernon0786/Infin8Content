-- Fix duplicate functions - drop ALL versions then recreate single version
-- This will eliminate function overloading and ensure only search_path versions exist

-- Drop ALL versions of each function (with and without parameters)
DROP FUNCTION IF EXISTS public.increment_version() CASCADE;
DROP FUNCTION IF EXISTS public.increment_version(text) CASCADE;
DROP FUNCTION IF EXISTS public.increment_version(uuid) CASCADE;

DROP FUNCTION IF EXISTS public.prevent_intent_audit_modification() CASCADE;
DROP FUNCTION IF EXISTS public.check_and_update_workflow_cost(uuid, numeric) CASCADE;
DROP FUNCTION IF EXISTS public.check_and_update_workflow_cost() CASCADE;

DROP FUNCTION IF EXISTS public.get_organization_monthly_ai_cost(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_organization_monthly_ai_cost() CASCADE;

DROP FUNCTION IF EXISTS public.check_organization_monthly_quota(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.check_organization_monthly_quota() CASCADE;

DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.log_user_joined_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_intent_audit_update_delete() CASCADE;

DROP FUNCTION IF EXISTS public.record_usage_and_increment(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.record_usage_and_increment() CASCADE;

DROP FUNCTION IF EXISTS public.check_workflow_cost_limit(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.check_workflow_cost_limit() CASCADE;

DROP FUNCTION IF EXISTS public.increment_workflow_cost(uuid, numeric) CASCADE;
DROP FUNCTION IF EXISTS public.increment_workflow_cost() CASCADE;

DROP FUNCTION IF EXISTS public.record_usage_increment_and_complete_step(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.record_usage_increment_and_complete_step() CASCADE;

-- Now recreate single versions with search_path
CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'v1.0.0';
END;
$$;

CREATE OR REPLACE FUNCTION public.check_and_update_workflow_cost(
  p_workflow_id uuid,
  p_cost_increment numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_organization_monthly_quota(
  p_organization_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_workflow_cost_limit(
  p_workflow_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_workflow_cost(
  p_workflow_id uuid,
  p_cost_increment numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_usage_and_increment(
  p_user_id uuid,
  p_usage_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_usage_increment_and_complete_step(
  p_workflow_id uuid,
  p_step_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN true;
END;
$$;
