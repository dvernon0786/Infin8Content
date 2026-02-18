-- Verify all workflow_state_enum values have been added
-- Run this after adding all enum values to confirm completeness

SELECT unnest(enum_range(NULL::workflow_state_enum)) as all_states
ORDER BY all_states;

-- Check specifically for the critical Step 4 running state
SELECT unnest
FROM unnest(enum_range(NULL::workflow_state_enum)) as unnest
WHERE unnest::text LIKE '%longtails_running%';

-- Count total enum values
SELECT 
  COUNT(*) as total_states,
  array_agg(unnest ORDER BY unnest) as all_states_array
FROM unnest(enum_range(NULL::workflow_state_enum)) as unnest;
