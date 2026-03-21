-- Test correct state machine integration
-- Run the ICP function with proper state = 'ICP_COMPLETED'

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

-- Verify proper state synchronization
SELECT state, current_step, status
FROM intent_workflows 
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';
