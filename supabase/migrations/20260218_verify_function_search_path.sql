-- Verify function search_path settings
SELECT 
  p.proname as function_name,
  l.lanname as language,
  p.prosecdef as security_definer,
  p.proconfig as configuration
FROM pg_proc p
JOIN pg_language l ON p.prolang = l.oid
WHERE p.proname IN (
  'increment_version',
  'check_and_update_workflow_cost', 
  'check_organization_monthly_quota',
  'record_usage_and_increment',
  'check_workflow_cost_limit',
  'increment_workflow_cost',
  'record_usage_increment_and_complete_step'
) AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check if search_path is set
SELECT 
  proname,
  CASE 
    WHEN proconfig @> ARRAY['search_path=public'] THEN 'HAS search_path=public'
    WHEN proconfig IS NULL THEN 'NO search_path set'
    ELSE 'OTHER search_path: ' || array_to_string(proconfig, ', ')
  END as search_path_status
FROM pg_proc 
WHERE proname IN (
  'increment_version',
  'check_and_update_workflow_cost', 
  'check_organization_monthly_quota',
  'record_usage_and_increment',
  'check_workflow_cost_limit',
  'increment_workflow_cost',
  'record_usage_increment_and_complete_step'
) AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
