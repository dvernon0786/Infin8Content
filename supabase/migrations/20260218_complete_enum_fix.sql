-- Complete workflow_state_enum fix - add all missing states
-- Run each ALTER TYPE separately due to Postgres transaction safety

-- Missing failed states
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

-- CRITICAL: Fix case mismatch - TypeScript uses 'completed' (lowercase)
ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'completed';

-- Verification - should show 24-26 total states
SELECT COUNT(*) as total_states FROM unnest(enum_range(NULL::workflow_state_enum));

-- Check for critical states
SELECT unnest
FROM unnest(enum_range(NULL::workflow_state_enum)) as unnest
WHERE unnest::text LIKE '%running%' OR unnest::text LIKE '%failed%' OR unnest::text = 'completed';
