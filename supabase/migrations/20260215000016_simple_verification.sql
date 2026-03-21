-- Simple Zero-Legacy Verification Migration
-- Avoids complex array syntax for maximum compatibility

-- Verify no legacy columns exist
DO $$
DECLARE
  found_legacy_columns INTEGER;
BEGIN
  -- Check for any remaining legacy columns
  SELECT COUNT(*)
  INTO found_legacy_columns
  FROM information_schema.columns
  WHERE table_name = 'intent_workflows'
    AND table_schema = 'public'
    AND column_name IN ('current_step', 'status', 'version', 'workflow_data', 
                        'step_1_icp_completed_at', 'step_2_competitor_completed_at',
                        'step_3_seeds_completed_at', 'step_4_longtails_completed_at',
                        'step_5_filtering_completed_at', 'step_6_clustering_completed_at',
                        'step_7_validation_completed_at', 'step_8_subtopics_completed_at',
                        'step_9_articles_completed_at', 'retry_count', 'step_1_icp_retry_count',
                        'step_2_competitors_retry_count', 'step_3_seeds_retry_count',
                        'step_4_longtails_retry_count', 'step_5_filtering_retry_count',
                        'step_6_clustering_retry_count', 'step_7_validation_retry_count',
                        'step_8_subtopics_retry_count', 'step_9_articles_retry_count',
                        'step_1_icp_last_error_message', 'step_2_competitors_last_error_message',
                        'step_3_seeds_last_error_message', 'step_4_longtails_last_error_message',
                        'step_5_filtering_last_error_message', 'step_6_clustering_last_error_message',
                        'step_7_validation_last_error_message', 'step_8_subtopics_last_error_message',
                        'step_9_articles_last_error_message');
  
  -- If any legacy columns found, raise error
  IF found_legacy_columns > 0 THEN
    RAISE EXCEPTION 'Legacy columns still exist: % found', found_legacy_columns;
  END IF;
  
  RAISE NOTICE 'Zero-legacy verification passed: No legacy columns found';
END $$;

-- Verify state column exists and is ENUM
DO $$
DECLARE
  state_column_exists BOOLEAN;
  state_column_type TEXT;
BEGIN
  -- Check if state column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intent_workflows'
      AND table_schema = 'public'
      AND column_name = 'state'
  ) INTO state_column_exists;
  
  IF NOT state_column_exists THEN
    RAISE EXCEPTION 'State column does not exist';
  END IF;
  
  -- Check if state column is ENUM type
  SELECT data_type
  INTO state_column_type
  FROM information_schema.columns
  WHERE table_name = 'intent_workflows'
    AND table_schema = 'public'
    AND column_name = 'state';
  
  IF state_column_type != 'USER-DEFINED' THEN
    RAISE EXCEPTION 'State column is not ENUM type: %', state_column_type;
  END IF;
  
  RAISE NOTICE 'State column verification passed: ENUM type confirmed';
END $$;

-- Verify workflow_state_enum exists and has correct states
DO $$
DECLARE
  enum_count INTEGER;
  expected_count INTEGER := 11;
BEGIN
  -- Count actual enum states
  SELECT COUNT(*)
  INTO enum_count
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'workflow_state_enum');
  
  IF enum_count != expected_count THEN
    RAISE EXCEPTION 'Workflow state enum count mismatch: expected % but found %', expected_count, enum_count;
  END IF;
  
  RAISE NOTICE 'Workflow state enum verification passed: % states', enum_count;
END $$;

-- Verify total column count is correct
DO $$
DECLARE
  actual_column_count INTEGER;
  expected_column_count INTEGER := 13; -- Should be 13 columns in zero-legacy schema
BEGIN
  SELECT COUNT(*)
  INTO actual_column_count
  FROM information_schema.columns
  WHERE table_name = 'intent_workflows'
    AND table_schema = 'public';
  
  IF actual_column_count != expected_column_count THEN
    RAISE EXCEPTION 'Column count mismatch: expected % but found %', expected_column_count, actual_column_count;
  END IF;
  
  RAISE NOTICE 'Column count verification passed: % columns', actual_column_count;
END $$;

-- Final verification summary
DO $$
DECLARE
  verification_results JSONB;
BEGIN
  verification_results := jsonb_build_object(
    'legacy_columns', 'NONE',
    'state_column', 'ENUM_TYPE',
    'workflow_state_enum', '11_STATES',
    'total_columns', 13,
    'zero_legacy_compliant', true,
    'verification_timestamp', NOW(),
    'migration_status', 'COMPLETE'
  );
  
  RAISE NOTICE 'Zero-Legacy Schema Verification Complete: %', verification_results;
END $$;
