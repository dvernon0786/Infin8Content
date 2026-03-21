-- Check workflow state after ICP completion
SELECT 
  id, 
  state, 
  status, 
  current_step,
  updated_at
FROM intent_workflows 
WHERE id = '50d72011-a9bf-4221-afc9-4c0573f9dac9'
LIMIT 100;
