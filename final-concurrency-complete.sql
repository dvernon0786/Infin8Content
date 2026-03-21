-- Final validation after concurrency test
SELECT 
  id, 
  state, 
  status, 
  current_step,
  updated_at
FROM intent_workflows 
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';

-- Check competitor analysis results
SELECT 
  workflow_id,
  COUNT(*) as competitor_count,
  created_at
FROM organization_competitors 
WHERE workflow_id = '63fc648d-1518-405a-8e17-05973c608c71'
GROUP BY workflow_id, created_at
ORDER BY created_at DESC;
