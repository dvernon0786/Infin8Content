-- Test the fixed SQL function directly
-- This bypasses API authentication and tests the core atomic function

SELECT record_usage_increment_and_complete_step(
  '63fc648d-1518-405a-8e17-05973c608c71'::uuid,
  '4b124ab6-0145-49a5-8821-0652e25f4544'::uuid,
  'test-model',
  100,
  50,
  0.001,
  '{"test": "data"}'::jsonb,
  150,
  NOW(),
  gen_random_uuid()
);

-- Check if ledger row was created
SELECT id, workflow_id, cost, idempotency_key, created_at 
FROM ai_usage_ledger 
WHERE workflow_id = '63fc648d-1518-405a-8e17-05973c608c71'
ORDER BY created_at DESC LIMIT 1;

-- Check if workflow was updated
SELECT id, status, current_step, step_1_icp_completed_at, updated_at
FROM intent_workflows 
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';
