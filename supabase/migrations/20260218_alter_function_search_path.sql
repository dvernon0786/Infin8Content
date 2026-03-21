-- Alternative approach: Use ALTER FUNCTION to set search_path
-- This might be more detectable by the linter

ALTER FUNCTION public.increment_version() SET search_path = public;
ALTER FUNCTION public.check_and_update_workflow_cost(uuid, numeric) SET search_path = public;
ALTER FUNCTION public.check_organization_monthly_quota(uuid) SET search_path = public;
ALTER FUNCTION public.check_workflow_cost_limit(uuid) SET search_path = public;
ALTER FUNCTION public.increment_workflow_cost(uuid, numeric) SET search_path = public;
ALTER FUNCTION public.record_usage_and_increment(uuid, text) SET search_path = public;
ALTER FUNCTION public.record_usage_increment_and_complete_step(uuid, text) SET search_path = public;

-- Also set for audit functions
ALTER FUNCTION public.prevent_intent_audit_modification() SET search_path = public;
ALTER FUNCTION public.prevent_intent_audit_update_delete() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.log_user_joined_trigger() SET search_path = public;
