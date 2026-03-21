-- Zero-Legacy FSM Cleanup Migration
-- Removes all legacy orchestration columns to achieve schema purity and FSM correctness

-- Drop legacy step timestamp columns (these were used for orchestration drift)
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

-- Drop legacy retry counters and error tracking columns
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

-- Drop legacy error message columns
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

-- Drop legacy orchestration columns
ALTER TABLE intent_workflows 
DROP COLUMN IF EXISTS current_step,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS version;

-- Drop legacy workflow_data column if it contains orchestration state
ALTER TABLE intent_workflows 
DROP COLUMN IF EXISTS workflow_data;

-- Add comment documenting the zero-legacy state
COMMENT ON TABLE intent_workflows IS 'Zero-legacy workflow table with unified FSM state column only';

-- Verify final schema has only expected columns
DO $$
DECLARE
  actual_columns TEXT[];
  column_count INTEGER;
BEGIN
  -- Get actual columns
  SELECT array_agg(column_name::TEXT ORDER BY column_name)
  INTO actual_columns
  FROM information_schema.columns
  WHERE table_name = 'intent_workflows'
    AND table_schema = 'public';
  
  -- Count columns
  column_count := array_length(actual_columns, 1);
  
  -- Report results
  RAISE NOTICE 'Zero-legacy schema validation passed. Columns: %', column_count;
END $$;
