-- Zero-Legacy Schema Verification Migration
-- Verifies that the intent_workflows table is in zero-legacy state

-- Verify no legacy columns exist
DO $$
DECLARE
  legacy_columns TEXT[] := ARRAY['current_step', 'status', 'version', 'workflow_data', 'step_1_icp_completed_at', 'step_2_competitor_completed_at', 'step_3_seeds_completed_at', 'step_4_longtails_completed_at', 'step_5_filtering_completed_at', 'step_6_clustering_completed_at', 'step_7_validation_completed_at', 'step_8_subtopics_completed_at', 'step_9_articles_completed_at', 'retry_count', 'step_1_icp_retry_count', 'step_2_competitors_retry_count', 'step_3_seeds_retry_count', 'step_4_longtails_retry_count', 'step_5_filtering_retry_count', 'step_6_clustering_retry_count', 'step_7_validation_retry_count', 'step_8_subtopics_retry_count', 'step_9_articles_retry_count', 'step_1_icp_last_error_message', 'step_2_competitors_last_error_message', 'step_3_seeds_last_error_message', 'step_4_longtails_last_error_message', 'step_5_filtering_last_error_message', 'step_6_clustering_last_error_message', 'step_7_validation_last_error_message', 'step_8_subtopics_last_error_message', 'step_9_articles_last_error_message'];
  
  found_legacy_columns TEXT[];
BEGIN
  -- Check for any remaining legacy columns
  SELECT array_agg(column_name::TEXT ORDER BY column_name)
  INTO found_legacy_columns
  FROM information_schema.columns
  WHERE table_name = 'intent_workflows'
    AND table_schema = 'public'
    AND column_name = ANY(legacy_columns);
  
  -- If any legacy columns found, raise error
  IF array_length(found_legacy_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Legacy columns still exist: %', array_to_string(found_legacy_columns, ', ');
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
  enum_states TEXT[];
  expected_states TEXT[] := ARRAY['step_1_icp', 'step_2_competitors', 'step_3_seeds', 'step_4_longtails', 'step_5_filtering', 'step_6_clustering', 'step_7_validation', 'step_8_subtopics', 'step_9_articles', 'COMPLETED', 'FAILED'];
  
  missing_states TEXT[];
  extra_states TEXT[];
  state_record RECORD;
BEGIN
  -- Get actual enum states
  FOR state_record IN 
    SELECT enumlabel FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'workflow_state_enum')
    ORDER BY enumlabel
  LOOP
    enum_states := array_append(enum_states, state_record.enumlabel);
  END LOOP;
  
  -- Find missing expected states
  SELECT unnest(expected_states)
  INTO missing_states
  FROM unnest(expected_states) AS expected
  WHERE NOT EXISTS (
    SELECT 1 FROM unnest(enum_states) AS actual
    WHERE actual = expected
  );
  
  -- Find extra states
  SELECT unnest(enum_states)
  INTO extra_states
  FROM unnest(enum_states) AS actual
  WHERE NOT EXISTS (
    SELECT 1 FROM unnest(expected_states) AS expected
    WHERE expected = actual
  );
  
  -- Report results
  IF array_length(missing_states, 1) > 0 THEN
    RAISE EXCEPTION 'Missing expected enum states: %', array_to_string(missing_states, ', ');
  END IF;
  
  IF array_length(extra_states, 1) > 0 THEN
    RAISE NOTICE 'Extra enum states found: %', array_to_string(extra_states, ', ');
  END IF;
  
  RAISE NOTICE 'Workflow state enum verification passed: % states', array_length(enum_states, 1);
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
