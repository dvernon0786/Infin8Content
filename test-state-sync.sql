-- Test state synchronization fix
-- Run the ICP function again to verify state is now properly updated

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

-- Verify state synchronization
SELECT state, current_step, status
FROM intent_workflows 
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';
