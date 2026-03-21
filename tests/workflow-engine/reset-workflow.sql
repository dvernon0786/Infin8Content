-- Reset workflow to COMPETITOR_PENDING state for testing
-- Workflow ID: 63fc648d-1518-405a-8e17-05973c608c71
-- Organization ID: 4b124ab6-0145-49a5-8821-0652e25f4544

-- 1. Reset workflow state to COMPETITOR_PENDING
UPDATE intent_workflows
SET 
  state = 'COMPETITOR_PENDING',
  updated_at = NOW()
WHERE 
  id = '63fc648d-1518-405a-8e17-05973c608c71'
AND organization_id = '4b124ab6-0145-49a5-8821-0652e25f4544';

-- 2. Delete all keywords for this workflow (to start fresh)
DELETE FROM keywords
WHERE 
  workflow_id = '63fc648d-1518-405a-8e17-05973c608c71'
AND organization_id = '4b124ab6-0145-49a5-8821-0652e25f4544';

-- 3. Verify the reset
SELECT 
  id,
  state,
  updated_at,
  organization_id
FROM intent_workflows
WHERE 
  id = '63fc648d-1518-405a-8e17-05973c608c71'
AND organization_id = '4b124ab6-0145-49a5-8821-0652e25f4544';

-- 4. Verify keywords are deleted
SELECT COUNT(*) as keyword_count
FROM keywords
WHERE 
  workflow_id = '63fc648d-1518-405a-8e17-05973c608c71'
AND organization_id = '4b124ab6-0145-49a5-8821-0652e25f4544';
