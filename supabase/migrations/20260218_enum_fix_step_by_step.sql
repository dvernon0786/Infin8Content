-- Complete workflow_state_enum fix - run each statement separately
-- Postgres requires each ALTER TYPE to be committed before use

-- Step 1: Add step_5_filtering_failed
ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_5_filtering_failed';

-- Step 2: Add step_6_clustering_running (run after Step 1 succeeds)
-- ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_6_clustering_running';

-- Step 3: Add step_6_clustering_failed (run after Step 2 succeeds)
-- ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_6_clustering_failed';

-- Step 4: Add step_7_validation_running (run after Step 3 succeeds)
-- ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_7_validation_running';

-- Step 5: Add step_7_validation_failed (run after Step 4 succeeds)
-- ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_7_validation_failed';

-- Step 6: Add step_8_subtopics_running (run after Step 5 succeeds)
-- ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_8_subtopics_running';

-- Step 7: Add step_8_subtopics_failed (run after Step 6 succeeds)
-- ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_8_subtopics_failed';

-- Step 8: Add step_9_articles_running (run after Step 7 succeeds)
-- ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_9_articles_running';

-- Step 9: Add step_9_articles_failed (run after Step 8 succeeds)
-- ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_9_articles_failed';

-- Step 10: Add step_9_articles_queued (run after Step 9 succeeds)
-- ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_9_articles_queued';

-- Step 11: CRITICAL - Fix case mismatch (run after Step 10 succeeds)
-- ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'completed';

-- Verification (run after all steps complete)
-- SELECT COUNT(*) as total_states FROM unnest(enum_range(NULL::workflow_state_enum));

-- Check for critical states (run after all steps complete)
-- SELECT unnest
-- FROM unnest(enum_range(NULL::workflow_state_enum)) as unnest
-- WHERE unnest::text LIKE '%running%' OR unnest::text LIKE '%failed%' OR unnest::text = 'completed';
