-- Reset workflow for Step 2 testing
-- Workflow ID: 63fc648d-1518-405a-8e17-05973c608c71
-- Organization ID: 4b124ab6-0145-49a5-8821-0652e25f4544

-- 1. Reset workflow to step 2 (before competitor analysis)
UPDATE intent_workflows 
SET 
    status = 'step_1_icp',
    current_step = 2,
    step_2_competitor_completed_at = NULL,
    step_2_competitor_error_message = NULL,
    step_2_competitors_retry_count = 0,
    step_2_competitors_last_error_message = NULL,
    updated_at = NOW()
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';

-- 2. Delete existing keywords for this organization (keywords are linked via competitor_url_id)
DELETE FROM keywords 
WHERE organization_id = '4b124ab6-0145-49a5-8821-0652e25f4544';

-- 3. Verify the reset
SELECT 
    id,
    status,
    current_step,
    step_2_competitor_completed_at,
    step_2_competitor_error_message,
    updated_at
FROM intent_workflows 
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';

-- 4. Check keyword count (should be 0)
SELECT COUNT(*) as keyword_count 
FROM keywords 
WHERE organization_id = '4b124ab6-0145-49a5-8821-0652e25f4544';
