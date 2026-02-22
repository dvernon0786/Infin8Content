-- Check current workflow state for approval debugging
SELECT 
  id, 
  state, 
  status, 
  current_step,
  updated_at
FROM intent_workflows 
WHERE id = '03a9142e-9ac5-460e-b7ac-65ac03d84ef8'
LIMIT 1;
