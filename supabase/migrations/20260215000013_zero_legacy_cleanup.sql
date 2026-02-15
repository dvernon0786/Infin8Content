-- ZERO-LEGACY MODE: Remove All Orchestration Drift Columns
-- 
-- This migration achieves true zero-legacy mode by removing all
-- orchestration columns that create dual truth sources.
-- After this migration, only domain data and state remain.

-- Step 1: Verify no critical data will be lost
DO $$
DECLARE
  timestamp_count INTEGER;
  retry_count INTEGER;
  version_count INTEGER;
BEGIN
  -- Check for data in step-specific timestamps (these are drift)
  SELECT COUNT(*) INTO timestamp_count
  FROM intent_workflows 
  WHERE step_1_icp_completed_at IS NOT NULL 
     OR step_2_competitor_completed_at IS NOT NULL;
  
  -- Check for retry count data (this is drift)
  SELECT COUNT(*) INTO retry_count
  FROM intent_workflows 
  WHERE step_2_competitors_retry_count IS NOT NULL AND step_2_competitors_retry_count > 0;
  
  -- Check for version usage (this is drift if not used)
  SELECT COUNT(*) INTO version_count
  FROM intent_workflows 
  WHERE version IS NOT NULL AND version > 1;
  
  RAISE NOTICE 'ZERO-LEGACY CLEANUP ANALYSIS:';
  RAISE NOTICE '  Step timestamps with data: %', timestamp_count;
  RAISE NOTICE '  Retry counts > 0: %', retry_count;
  RAISE NOTICE '  Version > 1: %', version_count;
  
  IF timestamp_count > 0 THEN
    RAISE NOTICE '⚠️  Step timestamp data will be lost - state is the source of truth';
  END IF;
  
  IF retry_count > 0 THEN
    RAISE NOTICE '⚠️  Retry count data will be lost - retries belong in audit tables';
  END IF;
  
  IF version_count > 0 THEN
    RAISE NOTICE '⚠️  Version data will be lost - optimistic locking not implemented';
  END IF;
  
  RAISE NOTICE '🎯 Proceeding with zero-legacy cleanup...';
END $$;

-- Step 2: Remove all orchestration drift columns
ALTER TABLE intent_workflows
  DROP COLUMN IF EXISTS step_1_icp_completed_at,
  DROP COLUMN IF EXISTS step_2_competitor_completed_at,
  DROP COLUMN IF EXISTS step_2_competitors_retry_count,
  DROP COLUMN IF EXISTS version;

-- Step 3: Verify final zero-legacy schema
DO $$
DECLARE
  remaining_columns INTEGER;
  expected_columns TEXT[];
  actual_columns TEXT[];
  missing_columns TEXT[];
  extra_columns TEXT[];
BEGIN
  -- Expected zero-legacy columns (domain data only)
  expected_columns := ARRAY[
    'id', 'organization_id', 'name', 'state', 'icp_data',
    'created_at', 'updated_at', 'created_by',
    'cancelled_at', 'cancelled_by',
    'article_link_count', 'article_linking_started_at', 'article_linking_completed_at'
  ];
  
  -- Count total remaining columns
  SELECT COUNT(*) INTO remaining_columns
  FROM information_schema.columns 
  WHERE table_name = 'intent_workflows';
  
  -- Get actual columns
  SELECT array_agg(column_name ORDER BY column_name) INTO actual_columns
  FROM information_schema.columns 
  WHERE table_name = 'intent_workflows';
  
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
  
  RAISE NOTICE 'ZERO-LEGACY SCHEMA VERIFICATION:';
  RAISE NOTICE '  Total columns: %', remaining_columns;
  RAISE NOTICE '  Expected columns: %', array_length(expected_columns, 1);
  RAISE NOTICE '  Actual columns: %', array_length(actual_columns, 1);
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION '❌ Missing expected columns: %', missing_columns;
  END IF;
  
  IF array_length(extra_columns, 1) > 0 THEN
    RAISE EXCEPTION '❌ Extra columns found: %', extra_columns;
  END IF;
  
  IF remaining_columns = array_length(expected_columns, 1) THEN
    RAISE NOTICE '✅ ZERO-LEGACY ACHIEVED: Clean schema with % columns', remaining_columns;
  ELSE
    RAISE EXCEPTION '❌ Schema mismatch: expected % columns, got %', array_length(expected_columns, 1), remaining_columns;
  END IF;
END $$;

-- Step 4: Add comment documenting zero-legacy achievement
COMMENT ON TABLE intent_workflows IS '
ZERO-LEGACY WORKFLOW SCHEMA - Mathematically Pure FSM

Core Columns (Orchestration):
- id, organization_id, name, state (ENUM), created_by, created_at, updated_at

Domain Data Columns:
- icp_data (ICP generation output)
- article_link_count, article_linking_started_at, article_linking_completed_at (article linking metrics)

Event Columns:
- cancelled_at, cancelled_by (cancellation events)

PRINCIPLES:
1. Single source of truth: state column only
2. No dual truth sources: no step timestamps, no retry counters
3. Domain/orchestration separation: icp_data for domain, state for orchestration
4. Deterministic FSM: linear progression with atomic transitions
5. Zero legacy: no orchestration drift columns

STATUS: ZERO-LEGACY MODE ACHIEVED
';
