-- Fix missing workflow_state_enum values
-- Add all running/failed states that are missing from Postgres enum

ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_4_longtails_running';
ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_4_longtails_failed';

ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_5_filtering_running';
ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_5_filtering_failed';

ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_6_clustering_running';
ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_6_clustering_failed';

ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_7_validation_running';
ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_7_validation_failed';

ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_8_subtopics_running';
ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_8_subtopics_failed';

ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_9_articles_running';
ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_9_articles_failed';
ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_9_articles_queued';

ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'completed';

-- Verify all enum values are now available
SELECT unnest(enum_range(NULL::workflow_state_enum)) as all_states;
