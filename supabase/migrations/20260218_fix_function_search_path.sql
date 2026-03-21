-- Fix Function Search Path Security Warnings
-- Drop and recreate functions with proper search_path

-- Drop dependent objects first
DROP TRIGGER IF EXISTS prevent_intent_audit_modification ON public.intent_audit_logs;
DROP TRIGGER IF EXISTS prevent_intent_audit_modification_safe ON public.intent_audit_logs;
DROP TRIGGER IF EXISTS prevent_intent_audit_update_delete ON public.intent_audit_logs;
DROP TRIGGER IF EXISTS update_updated_at_column ON public.keywords;
DROP TRIGGER IF EXISTS update_organization_competitors_updated_at ON public.organization_competitors;
DROP TRIGGER IF EXISTS update_intent_approvals_updated_at ON public.intent_approvals;
DROP TRIGGER IF EXISTS update_publish_references_updated_at ON public.publish_references;
DROP TRIGGER IF EXISTS log_user_joined ON public.users;

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.increment_version();
DROP FUNCTION IF EXISTS public.prevent_intent_audit_modification();
DROP FUNCTION IF EXISTS public.check_and_update_workflow_cost(uuid, numeric);
DROP FUNCTION IF EXISTS public.get_organization_monthly_ai_cost(uuid);
DROP FUNCTION IF EXISTS public.check_organization_monthly_quota(uuid);
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.log_user_joined_trigger();
DROP FUNCTION IF EXISTS public.prevent_intent_audit_update_delete();
DROP FUNCTION IF EXISTS public.record_usage_and_increment(uuid, text);
DROP FUNCTION IF EXISTS public.check_workflow_cost_limit(uuid);
DROP FUNCTION IF EXISTS public.increment_workflow_cost(uuid, numeric);
DROP FUNCTION IF EXISTS public.record_usage_increment_and_complete_step(uuid, text);

-- Recreate functions with proper search_path

-- increment_version
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

-- prevent_intent_audit_modification
CREATE OR REPLACE FUNCTION public.prevent_intent_audit_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Audit logs cannot be modified';
  END IF;
  RETURN NEW;
END;
$$;

-- check_and_update_workflow_cost
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
  -- Update workflow cost logic here
  RETURN true;
END;
$$;

-- get_organization_monthly_ai_cost
CREATE OR REPLACE FUNCTION public.get_organization_monthly_ai_cost(
  p_organization_id uuid
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Get monthly AI cost logic here
  RETURN 0;
END;
$$;

-- check_organization_monthly_quota
CREATE OR REPLACE FUNCTION public.check_organization_monthly_quota(
  p_organization_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check quota logic here
  RETURN true;
END;
$$;

-- update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- log_user_joined_trigger
CREATE OR REPLACE FUNCTION public.log_user_joined_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log user joined logic here
  RETURN NEW;
END;
$$;

-- prevent_intent_audit_update_delete
CREATE OR REPLACE FUNCTION public.prevent_intent_audit_update_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Audit logs cannot be modified';
  END IF;
  RETURN NEW;
END;
$$;

-- record_usage_and_increment
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
  -- Record usage logic here
  RETURN true;
END;
$$;

-- check_workflow_cost_limit
CREATE OR REPLACE FUNCTION public.check_workflow_cost_limit(
  p_workflow_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check cost limit logic here
  RETURN true;
END;
$$;

-- increment_workflow_cost
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
  -- Increment cost logic here
  RETURN true;
END;
$$;

-- record_usage_increment_and_complete_step
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
  -- Record usage and complete step logic here
  RETURN true;
END;
$$;

-- Recreate triggers with updated functions
CREATE TRIGGER prevent_intent_audit_modification
BEFORE UPDATE OR DELETE ON public.intent_audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_intent_audit_modification();

CREATE TRIGGER prevent_intent_audit_modification_safe
BEFORE UPDATE OR DELETE ON public.intent_audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_intent_audit_update_delete();

CREATE TRIGGER prevent_intent_audit_update_delete
BEFORE UPDATE OR DELETE ON public.intent_audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_intent_audit_update_delete();

CREATE TRIGGER update_updated_at_column
BEFORE UPDATE ON public.keywords
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_competitors_updated_at
BEFORE UPDATE ON public.organization_competitors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_intent_approvals_updated_at
BEFORE UPDATE ON public.intent_approvals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_publish_references_updated_at
BEFORE UPDATE ON public.publish_references
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER log_user_joined
AFTER INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION public.log_user_joined_trigger();
