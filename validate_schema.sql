-- DIRECT SCHEMA VALIDATION
-- Verify the final clean schema matches expected 13 columns

DO $$
DECLARE
  actual_columns TEXT[];
  expected_columns TEXT[] := ARRAY[
    'id', 'organization_id', 'name', 'state', 'icp_data',
    'created_at', 'updated_at', 'created_by',
    'cancelled_at', 'cancelled_by',
    'article_link_count', 'article_linking_started_at', 'article_linking_completed_at'
  ];
  column_count INTEGER;
  missing_columns TEXT[];
  extra_columns TEXT[];
  drift_columns TEXT[] := ARRAY[
    'step_1_icp_completed_at', 'step_2_competitor_completed_at',
    'step_2_competitors_retry_count', 'version',
    'status', 'current_step', 'workflow_data'
  ];
  found_drift TEXT[];
BEGIN
  -- Get actual columns
  SELECT array_agg(column_name ORDER BY column_name), COUNT(*) INTO actual_columns, column_count
  FROM information_schema.columns 
  WHERE table_name = 'intent_workflows';
  
  -- Check for drift columns
  SELECT array_agg(col) INTO found_drift
  FROM unnest(actual_columns) col
  WHERE col = ANY(drift_columns);
  
  -- Find missing expected columns
  SELECT array_agg(col) INTO missing_columns
  FROM unnest(expected_columns) col
  WHERE NOT EXISTS (
    SELECT 1 FROM unnest(actual_columns) ac WHERE ac = col
  );
  
  -- Find extra columns
  SELECT array_agg(col) INTO extra_columns
  FROM unnest(actual_columns) col
  WHERE NOT EXISTS (
    SELECT 1 FROM unnest(expected_columns) ec WHERE ec = col
  );
  
  -- Report results
  RAISE NOTICE 'SCHEMA VALIDATION RESULTS:';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Expected columns: %', array_length(expected_columns, 1);
  RAISE NOTICE 'Actual columns: %', column_count;
  RAISE NOTICE '';
  
  IF array_length(found_drift, 1) > 0 THEN
    RAISE EXCEPTION '❌ LEGACY DRIFT COLUMNS FOUND: %', found_drift;
  ELSE
    RAISE NOTICE '✅ No legacy drift columns found';
  END IF;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION '❌ MISSING EXPECTED COLUMNS: %', missing_columns;
  ELSE
    RAISE NOTICE '✅ All expected columns present';
  END IF;
  
  IF array_length(extra_columns, 1) > 0 THEN
    RAISE NOTICE '⚠️  EXTRA COLUMNS FOUND: %', extra_columns;
  ELSE
    RAISE NOTICE '✅ No extra columns found';
  END IF;
  
  IF column_count = array_length(expected_columns, 1) THEN
    RAISE NOTICE '✅ COLUMN COUNT MATCH: % columns (expected)', column_count;
  ELSE
    RAISE EXCEPTION '❌ COLUMN COUNT MISMATCH: expected %, found %', array_length(expected_columns, 1), column_count;
  END IF;
  
  -- Show final schema
  RAISE NOTICE '';
  RAISE NOTICE 'FINAL CLEAN SCHEMA:';
  RAISE NOTICE '==================';
  FOR i IN 1..array_length(actual_columns, 1) LOOP
    RAISE NOTICE '%', actual_columns[i];
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎯 VALIDATION: %', 
    CASE 
      WHEN column_count = array_length(expected_columns, 1) AND array_length(found_drift, 1) = 0 THEN '✅ PASSED - Clean 13-column schema'
      ELSE '❌ FAILED - Schema issues detected'
    END;
END $$;
