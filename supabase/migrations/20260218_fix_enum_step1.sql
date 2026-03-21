-- Fix missing workflow_state_enum values
-- Add all running/failed states that are missing from Postgres enum
-- Note: Each ALTER TYPE must be committed separately due to Postgres safety locks

ALTER TYPE workflow_state_enum ADD VALUE 'step_4_longtails_running';

-- Run this first, then commit, then run the next ALTER TYPE statements separately
-- Postgres requires each enum value addition to be committed before use

-- After first value is committed, run these one by one:
-- ALTER TYPE workflow_state_enum ADD VALUE 'step_4_longtails_failed';
-- ALTER TYPE workflow_state_enum ADD VALUE 'step_5_filtering_running';
-- ALTER TYPE workflow_state_enum ADD VALUE 'step_5_filtering_failed';
-- ALTER TYPE workflow_state_enum ADD VALUE 'step_6_clustering_running';
-- ALTER TYPE workflow_state_enum ADD VALUE 'step_6_clustering_failed';
-- ALTER TYPE workflow_state_enum ADD VALUE 'step_7_validation_running';
-- ALTER TYPE workflow_state_enum ADD VALUE 'step_7_validation_failed';
-- ALTER TYPE workflow_state_enum ADD VALUE 'step_8_subtopics_running';
-- ALTER TYPE workflow_state_enum ADD VALUE 'step_8_subtopics_failed';
-- ALTER TYPE workflow_state_enum ADD VALUE 'step_9_articles_running';
-- ALTER TYPE workflow_state_enum ADD VALUE 'step_9_articles_failed';
-- ALTER TYPE workflow_state_enum ADD VALUE 'step_9_articles_queued';
-- ALTER TYPE workflow_state_enum ADD VALUE 'completed';

-- Verify current enum values
SELECT unnest(enum_range(NULL::workflow_state_enum)) as all_states;
