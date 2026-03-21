-- Check if keywords were actually stored for the workflow
-- Replace 'e0b0fe95-3d56-4e0e-b528-2e4c369a6ba3' with your actual workflow ID

SELECT 
  seed_keyword,
  search_volume,
  competition_level,
  keyword_difficulty,
  longtail_status,
  subtopics_status,
  article_status,
  created_at,
  competitor_url_id
FROM keywords 
WHERE workflow_id = 'e0b0fe95-3d56-4e0e-b528-2e4c369a6ba3'
ORDER BY search_volume DESC, created_at DESC;

-- Also check workflow state
SELECT 
  state,
  updated_at
FROM intent_workflows 
WHERE id = 'e0b0fe95-3d56-4e0e-b528-2e4c369a6ba3';

-- Check if audit table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'workflow_transition_audit';
