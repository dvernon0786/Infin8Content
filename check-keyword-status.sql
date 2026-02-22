-- Check latest workflows and their keyword counts
SELECT 
  w.id,
  w.state,
  w.created_at,
  COUNT(k.id) as total_keywords,
  COUNT(CASE WHEN k.parent_seed_keyword_id IS NULL THEN 1 END) as seed_keywords,
  COUNT(CASE WHEN k.parent_seed_keyword_id IS NOT NULL THEN 1 END) as longtail_keywords,
  COUNT(CASE WHEN k.longtail_status = 'complete' THEN 1 END) as longtails_completed,
  COUNT(CASE WHEN k.subtopics_status = 'complete' THEN 1 END) as subtopics_completed
FROM intent_workflows w
LEFT JOIN keywords k ON w.id = k.workflow_id
WHERE w.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY w.id, w.state, w.created_at
ORDER BY w.created_at DESC
LIMIT 10;

-- Check specific workflow details (most recent)
WITH latest_workflow AS (
  SELECT id FROM intent_workflows 
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  ORDER BY created_at DESC 
  LIMIT 1
)
SELECT 
  k.keyword,
  k.search_volume,
  k.parent_seed_keyword_id,
  k.longtail_status,
  k.subtopics_status,
  k.article_status,
  k.created_at
FROM keywords k
WHERE k.workflow_id = (SELECT id FROM latest_workflow)
ORDER BY 
  CASE WHEN k.parent_seed_keyword_id IS NULL THEN 0 ELSE 1 END,
  k.search_volume DESC;
