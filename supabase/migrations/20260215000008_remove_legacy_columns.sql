-- Legacy Column Cleanup Migration - Final Clean Schema
-- 
-- This migration removes all legacy workflow columns after unified state implementation
-- The codebase has been fully updated to use only the unified state column

-- Step 1: Verify no data will be lost
DO $$
DECLARE
  legacy_count INTEGER;
BEGIN
  -- Check if any workflows still use legacy columns
  SELECT COUNT(*) INTO legacy_count
  FROM intent_workflows 
  WHERE status IS NOT NULL 
     OR current_step IS NOT NULL 
     OR workflow_data IS NOT NULL
     OR retry_count IS NOT NULL;
  
  IF legacy_count > 0 THEN
    RAISE NOTICE 'Found % workflows with legacy column data - data will be lost', legacy_count;
  ELSE
    RAISE NOTICE 'No legacy column data found - safe to proceed';
  END IF;
END $$;

-- Step 2: Drop legacy error message columns (no longer needed)
ALTER TABLE intent_workflows
  DROP COLUMN IF EXISTS step_1_icp_error_message,
  DROP COLUMN IF EXISTS step_2_competitor_error_message,
  DROP COLUMN IF EXISTS step_3_seeds_error_message,
  DROP COLUMN IF EXISTS step_4_longtails_error_message,
  DROP COLUMN IF EXISTS step_5_filter_error_message,
  DROP COLUMN IF EXISTS step_6_cluster_error_message,
  DROP COLUMN IF EXISTS step_7_validate_error_message,
  DROP COLUMN IF EXISTS step_8_subtopics_error_message,
  DROP COLUMN IF EXISTS step_9_articles_error_message;

-- Step 3: Drop legacy last error message columns (no longer needed)
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

-- Step 4: Drop legacy dual-state columns
ALTER TABLE intent_workflows
  DROP COLUMN IF EXISTS status,         -- Replaced by unified state
  DROP COLUMN IF EXISTS current_step,  -- Replaced by state-driven progression
  DROP COLUMN IF EXISTS workflow_data,  -- Replaced by specific columns (icp_data)
  DROP COLUMN IF EXISTS retry_count;   -- No longer needed

-- Step 5: Add comment documenting the clean schema
COMMENT ON TABLE intent_workflows IS 'Clean unified workflow schema with single state column and specific data columns';

-- Step 6: Verify final clean schema
DO $$
DECLARE
  remaining_columns INTEGER;
BEGIN
  -- Count remaining columns (should be ~8-10 for clean schema)
  SELECT COUNT(*) INTO remaining_columns
  FROM information_schema.columns 
  WHERE table_name = 'intent_workflows';
  
  RAISE NOTICE 'Final schema has % columns - clean unified workflow achieved', remaining_columns;
END $$;
