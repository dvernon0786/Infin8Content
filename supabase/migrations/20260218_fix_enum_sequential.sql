-- Fix missing workflow_state_enum values
-- Each ALTER TYPE must be run in a separate session/transaction

-- Step 1: Add step_4_longtails_running (run this first, wait for success)
ALTER TYPE workflow_state_enum ADD VALUE 'step_4_longtails_running';

-- Step 2: After Step 1 succeeds, run this in a new session
ALTER TYPE workflow_state_enum ADD VALUE 'step_4_longtails_failed';

-- Step 3: Add step 5 states
ALTER TYPE workflow_state_enum ADD VALUE 'step_5_filtering_running';
ALTER TYPE workflow_state_enum ADD VALUE 'step_5_filtering_failed';

-- Step 4: Add step 6 states  
ALTER TYPE workflow_state_enum ADD VALUE 'step_6_clustering_running';
ALTER TYPE workflow_state_enum ADD VALUE 'step_6_clustering_failed';

-- Step 5: Add step 7 states
ALTER TYPE workflow_state_enum ADD VALUE 'step_7_validation_running';
ALTER TYPE workflow_state_enum ADD VALUE 'step_7_validation_failed';

-- Step 6: Add step 8 states
ALTER TYPE workflow_state_enum ADD VALUE 'step_8_subtopics_running';
ALTER TYPE workflow_state_enum ADD VALUE 'step_8_subtopics_failed';

-- Step 7: Add step 9 states
ALTER TYPE workflow_state_enum ADD VALUE 'step_9_articles_running';
ALTER TYPE workflow_state_enum ADD VALUE 'step_9_articles_failed';
ALTER TYPE workflow_state_enum ADD VALUE 'step_9_articles_queued';

-- Step 8: Add final state
ALTER TYPE workflow_state_enum ADD VALUE 'completed';

-- Verification query (run after all additions)
SELECT unnest(enum_range(NULL::workflow_state_enum)) as all_states;
