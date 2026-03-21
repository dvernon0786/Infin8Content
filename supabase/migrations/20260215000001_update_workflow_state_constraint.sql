-- Update Workflow State Constraint for Unified States
-- Replaces legacy state constraint with unified step_* states
-- Date: February 15, 2026

-- Step 1: Drop the old constraint
ALTER TABLE intent_workflows DROP CONSTRAINT IF EXISTS valid_workflow_state;

-- Step 2: Add the new unified constraint
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

-- Step 3: Verify constraint is active
-- This should return no rows if all states are valid:
/*
SELECT id, state 
FROM intent_workflows 
WHERE state NOT IN (
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
);
*/
