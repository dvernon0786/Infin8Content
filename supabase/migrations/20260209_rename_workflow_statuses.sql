-- Migration-safe workflow status normalization
-- Run AFTER normalizer is deployed

-- Update legacy status values to canonical ones
UPDATE intent_workflows
SET status = 'step_3_keywords'
WHERE status = 'step_3_seeds';

UPDATE intent_workflows
SET status = 'step_4_longtails'
WHERE status = 'step_4_topics';

UPDATE intent_workflows
SET status = 'step_9_articles'
WHERE status = 'step_5_generation';

UPDATE intent_workflows
SET status = 'step_8_subtopics'
WHERE status = 'step_8_approval';

-- Verify migration results
SELECT DISTINCT status FROM intent_workflows ORDER BY status;

-- Count any remaining legacy values (should be 0)
SELECT 
  COUNT(*) as legacy_count,
  status
FROM intent_workflows 
WHERE status IN ('step_3_seeds', 'step_4_topics', 'step_5_generation', 'step_8_approval')
GROUP BY status;
