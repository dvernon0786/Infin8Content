-- Fix the 3-field state mismatch
UPDATE intent_workflows
SET
  current_step = 3,
  status = 'step_2_competitors',
  updated_at = NOW()
WHERE id = '50d72011-a9bf-4221-afc9-4c0573f9dac9';

-- Verify the fix
SELECT 
  state, 
  current_step, 
  status, 
  step_2_competitor_completed_at,
  updated_at
FROM intent_workflows 
WHERE id = '50d72011-a9bf-4221-afc9-4c0573f9dac9';
