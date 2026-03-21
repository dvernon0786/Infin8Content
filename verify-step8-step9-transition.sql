-- Database schema verification for Step 8 → Step 9 transition

-- 1. Check workflow state
SELECT 
  id, 
  state, 
  status, 
  current_step,
  updated_at
FROM intent_workflows 
WHERE id = '264146a5-8a6b-48d5-9140-d3966e1c7124';

-- 2. Check keywords with completed subtopics (the filter used in approval)
SELECT 
  id,
  keyword,
  subtopics_status,
  article_status,
  parent_seed_keyword_id
FROM keywords 
WHERE workflow_id = '264146a5-8a6b-48d5-9140-d3966e1c7124'
  AND subtopics_status = 'completed'
ORDER BY id;

-- 3. Check approved keywords (intent_approvals table)
SELECT 
  ia.entity_id,
  ia.entity_type,
  ia.decision,
  ia.created_at,
  k.keyword,
  k.subtopics_status,
  k.article_status
FROM intent_approvals ia
JOIN keywords k ON ia.entity_id = k.id
WHERE ia.entity_type = 'keyword'
  AND k.workflow_id = '264146a5-8a6b-48d5-9140-d3966e1c7124'
ORDER BY ia.created_at;

-- 4. Check if ALL completed subtopics are approved
WITH completed_keywords AS (
  SELECT id 
  FROM keywords 
  WHERE workflow_id = '264146a5-8a6b-48d5-9140-d3966e1c7124'
    AND subtopics_status = 'completed'
),
approved_keywords AS (
  SELECT entity_id as id
  FROM intent_approvals 
  WHERE entity_type = 'keyword'
    AND entity_id IN (SELECT id FROM completed_keywords)
)
SELECT 
  (SELECT COUNT(*) FROM completed_keywords) as total_completed,
  (SELECT COUNT(*) FROM approved_keywords) as total_approved,
  CASE 
    WHEN (SELECT COUNT(*) FROM completed_keywords) = (SELECT COUNT(*) FROM approved_keywords) 
    THEN 'READY_FOR_STEP9'
    ELSE 'NOT_READY'
  END as status;

-- 5. Check recent audit logs for subtopic approval
SELECT 
  action,
  actor_id,
  created_at,
  metadata
FROM audit_logs 
WHERE entity_id IN (
  SELECT id FROM keywords 
  WHERE workflow_id = '264146a5-8a6b-48d5-9140-d3966e1c7124'
)
  AND action LIKE '%subtopic%'
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check if any keywords have null parent_seed_keyword_id (the old filter issue)
SELECT 
  COUNT(*) as total_keywords,
  COUNT(CASE WHEN parent_seed_keyword_id IS NULL THEN 1 END) as null_parent_count,
  COUNT(CASE WHEN parent_seed_keyword_id IS NOT NULL THEN 1 END) as not_null_parent_count
FROM keywords 
WHERE workflow_id = '264146a5-8a6b-48d5-9140-d3966e1c7124';
