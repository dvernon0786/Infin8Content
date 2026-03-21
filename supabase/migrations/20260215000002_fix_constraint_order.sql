-- Fix Constraint Order: Migrate Data First, Then Update Constraint
-- This fixes the "constraint violated by some row" error
-- Date: February 15, 2026

-- Step 1: Drop the constraint completely (allows any state temporarily)
ALTER TABLE intent_workflows DROP CONSTRAINT IF EXISTS valid_workflow_state;

-- Step 2: Migrate all legacy states to unified states
-- This will work now because there's no constraint blocking it

-- Migrate COMPETITOR states
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

-- Migrate ICP states
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

-- Migrate SEED_REVIEW states
UPDATE intent_workflows 
SET state = 'step_3_seeds' 
WHERE state = 'SEED_REVIEW_PENDING';

UPDATE intent_workflows 
SET state = 'step_4_longtails' 
WHERE state = 'SEED_REVIEW_COMPLETED';

-- Migrate CLUSTERING states
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

-- Migrate VALIDATION states
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

-- Migrate ARTICLE states
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

-- Migrate PUBLISH states
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

-- Step 3: Add the new constraint (now all rows are valid)
ALTER TABLE intent_workflows 
ADD CONSTRAINT valid_workflow_state 
CHECK (state IN (
    'CREATED', 'CANCELLED', 'COMPLETED',
    'step_1_icp', 
    'step_2_competitors', 
    'step_3_seeds', 
    'step_4_longtails', 
    'step_5_filtering', 
    'step_6_clustering', 
    'step_7_validation', 
    'step_8_subtopics', 
    'step_9_articles'
));

-- Step 4: Verify everything worked
-- This should show only unified states now:
/*
SELECT state, COUNT(*) as count
FROM intent_workflows 
GROUP BY state 
ORDER BY state;
*/
