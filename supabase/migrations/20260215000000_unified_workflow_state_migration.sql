-- Unified Workflow State Migration
-- Clean migration from legacy COMPETITOR_* states to unified step_* states
-- Date: February 15, 2026

-- Step 1: Update workflow state enum constraint (if needed)
-- This will be handled by the application code update

-- Step 2: Migrate existing workflows from legacy states to unified states
UPDATE intent_workflows 
SET state = 'step_2_competitors' 
WHERE state IN (
    'COMPETITOR_PENDING', 
    'COMPETITOR_PROCESSING', 
    'COMPETITOR_FAILED'
);

UPDATE intent_workflows 
SET state = 'step_3_seeds' 
WHERE state = 'COMPETITOR_COMPLETED';

-- Step 3: Migrate other legacy states to unified equivalents
UPDATE intent_workflows 
SET state = 'step_1_icp' 
WHERE state IN (
    'ICP_PENDING', 
    'ICP_PROCESSING', 
    'ICP_FAILED'
);

UPDATE intent_workflows 
SET state = 'step_2_competitors' 
WHERE state = 'ICP_COMPLETED';

-- Handle SEED_REVIEW states
UPDATE intent_workflows 
SET state = 'step_3_seeds' 
WHERE state = 'SEED_REVIEW_PENDING';

UPDATE intent_workflows 
SET state = 'step_4_longtails' 
WHERE state = 'SEED_REVIEW_COMPLETED';

-- Handle CLUSTERING states
UPDATE intent_workflows 
SET state = 'step_6_clustering' 
WHERE state IN (
    'CLUSTERING_PENDING', 
    'CLUSTERING_PROCESSING', 
    'CLUSTERING_FAILED'
);

UPDATE intent_workflows 
SET state = 'step_7_validation' 
WHERE state = 'CLUSTERING_COMPLETED';

-- Handle VALIDATION states
UPDATE intent_workflows 
SET state = 'step_7_validation' 
WHERE state IN (
    'VALIDATION_PENDING', 
    'VALIDATION_PROCESSING', 
    'VALIDATION_FAILED'
);

UPDATE intent_workflows 
SET state = 'step_8_subtopics' 
WHERE state = 'VALIDATION_COMPLETED';

-- Handle ARTICLE states
UPDATE intent_workflows 
SET state = 'step_9_articles' 
WHERE state IN (
    'ARTICLE_PENDING', 
    'ARTICLE_PROCESSING', 
    'ARTICLE_FAILED'
);

UPDATE intent_workflows 
SET state = 'COMPLETED' 
WHERE state = 'ARTICLE_COMPLETED';

-- Handle PUBLISH states
UPDATE intent_workflows 
SET state = 'step_9_articles' 
WHERE state IN (
    'PUBLISH_PENDING', 
    'PUBLISH_PROCESSING', 
    'PUBLISH_FAILED'
);

UPDATE intent_workflows 
SET state = 'COMPLETED' 
WHERE state = 'PUBLISH_COMPLETED';

-- Step 4: Verification query
-- Run this after migration to verify results:
/*
SELECT 
    state,
    COUNT(*) as count,
    updated_at
FROM intent_workflows 
GROUP BY state 
ORDER BY state;

-- Expected states should only be:
-- CREATED, step_1_icp, step_2_competitors, step_3_seeds, step_4_longtails, 
-- step_5_filtering, step_6_clustering, step_7_validation, step_8_subtopics, 
-- step_9_articles, COMPLETED, CANCELLED
*/

-- Step 5: Clean up any remaining legacy states (emergency only)
-- Uncomment ONLY if verification shows unexpected states
/*
UPDATE intent_workflows 
SET state = 'step_2_competitors' 
WHERE state NOT IN (
    'CREATED', 'step_1_icp', 'step_2_competitors', 'step_3_seeds', 'step_4_longtails', 
    'step_5_filtering', 'step_6_clustering', 'step_7_validation', 'step_8_subtopics', 
    'step_9_articles', 'COMPLETED', 'CANCELLED'
);
*/
