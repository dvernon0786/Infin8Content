-- Check if the workflow exists and its current state
SELECT 
  id, 
  state, 
  status, 
  current_step,
  organization_id,
  updated_at
FROM intent_workflows 
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';
