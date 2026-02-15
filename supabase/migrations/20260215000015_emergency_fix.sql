-- Emergency Fix Migration
-- Apply this first to resolve immediate production issues

-- Step 1: Drop legacy orchestration columns that are causing errors
ALTER TABLE intent_workflows 
DROP COLUMN IF EXISTS current_step,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS version;

-- Step 2: Drop legacy step timestamp columns
ALTER TABLE intent_workflows 
DROP COLUMN IF EXISTS step_1_icp_completed_at,
DROP COLUMN IF EXISTS step_2_competitor_completed_at,
DROP COLUMN IF EXISTS step_3_seeds_completed_at,
DROP COLUMN IF EXISTS step_4_longtails_completed_at,
DROP COLUMN IF EXISTS step_5_filtering_completed_at,
DROP COLUMN IF EXISTS step_6_clustering_completed_at,
DROP COLUMN IF EXISTS step_7_validation_completed_at,
DROP COLUMN IF EXISTS step_8_subtopics_completed_at,
DROP COLUMN IF EXISTS step_9_articles_completed_at;

-- Step 3: Drop legacy retry counters
ALTER TABLE intent_workflows 
DROP COLUMN IF EXISTS retry_count,
DROP COLUMN IF EXISTS step_1_icp_retry_count,
DROP COLUMN IF EXISTS step_2_competitors_retry_count,
DROP COLUMN IF EXISTS step_3_seeds_retry_count,
DROP COLUMN IF EXISTS step_4_longtails_retry_count,
DROP COLUMN IF EXISTS step_5_filtering_retry_count,
DROP COLUMN IF EXISTS step_6_clustering_retry_count,
DROP COLUMN IF EXISTS step_7_validation_retry_count,
DROP COLUMN IF EXISTS step_8_subtopics_retry_count,
DROP COLUMN IF EXISTS step_9_articles_retry_count;

-- Step 4: Drop legacy error message columns
ALTER TABLE intent_workflows 
DROP COLUMN IF EXISTS step_1_icp_last_error_message,
DROP COLUMN IF EXISTS step_2_competitors_last_error_message,
DROP COLUMN IF EXISTS step_3_seeds_last_error_message,
DROP COLUMN IF EXISTS step_4_longtails_last_error_message,
DROP COLUMN IF EXISTS step_5_filtering_last_error_message,
DROP COLUMN IF EXISTS step_6_clustering_last_error_message,
DROP COLUMN IF EXISTS step_7_validation_last_error_message,
DROP COLUMN IF EXISTS step_8_subtopics_last_error_message,
DROP COLUMN IF EXISTS step_9_articles_last_error_message;

-- Step 5: Verify state column exists
DO $$
DECLARE
  state_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intent_workflows'
      AND table_schema = 'public'
      AND column_name = 'state'
  ) INTO state_exists;
  
  IF NOT state_exists THEN
    RAISE EXCEPTION 'State column does not exist - please run unified workflow state migration first';
  END IF;
  
  RAISE NOTICE 'State column verified - emergency fix complete';
END $$;

-- Step 6: Report current schema status
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'intent_workflows'
    AND table_schema = 'public';
  
  RAISE NOTICE 'Emergency fix complete. Current column count: %', column_count;
END $$;
