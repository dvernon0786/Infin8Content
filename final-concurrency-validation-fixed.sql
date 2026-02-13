-- Final validation after concurrency test
SELECT 
  id, 
  state, 
  status, 
  current_step,
  updated_at
FROM intent_workflows 
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';

-- Check what tables exist for competitor data
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%competitor%'
ORDER BY table_name;
