-- Test script for atomic cost guard functions
-- Run this to verify everything works correctly

-- Test 1: Check if functions exist
SELECT 
  proname as function_name,
  prosrc as source_code
FROM pg_proc 
WHERE proname IN ('check_and_update_workflow_cost', 'get_organization_monthly_ai_cost', 'check_organization_monthly_quota');

-- Test 2: Check if ai_usage_ledger table exists
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'ai_usage_ledger'
ORDER BY ordinal_position;

-- Test 3: Test atomic cost guard with dummy data
-- (This will fail if workflow doesn't exist, which is expected)
SELECT check_and_update_workflow_cost('00000000-0000-0000-0000-000000000000', 0.01, 1.00);

-- Test 4: Test monthly cost function
SELECT get_organization_monthly_ai_cost('00000000-0000-0000-0000-000000000000');

-- Test 5: Test quota check
SELECT check_organization_monthly_quota('00000000-0000-0000-0000-000000000000', 25.00);
