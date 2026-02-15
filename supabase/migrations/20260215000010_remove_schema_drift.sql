-- Final Schema Cleanup - Remove Drift Columns for FSM Purity
-- 
-- This migration removes all schema drift columns that violate
-- the deterministic finite state machine principles.
-- After this cleanup, the schema will have only essential columns.

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
  WHERE retry_count IS NOT NULL AND retry_count > 0;
  
  -- Check for version usage (this is drift if not used)
  SELECT COUNT(*) INTO version_count
  FROM intent_workflows 
  WHERE version IS NOT NULL AND version > 1;
  
  RAISE NOTICE 'Schema drift analysis:';
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
END $$;

-- Step 2: Remove step-specific timestamp columns (drift - state is source of truth)
ALTER TABLE intent_workflows
  DROP COLUMN IF EXISTS step_1_icp_completed_at,
  DROP COLUMN IF EXISTS step_2_competitor_completed_at;

-- Step 3: Remove retry counters (drift - retries belong in audit/job tables)
ALTER TABLE intent_workflows
  DROP COLUMN IF EXISTS retry_count,
  DROP COLUMN IF EXISTS step_2_competitors_retry_count;

-- Step 4: Remove unused version column (drift - optimistic locking not implemented)
ALTER TABLE intent_workflows
  DROP COLUMN IF EXISTS version;

-- Step 5: Keep article linking columns (domain data, not orchestration drift)
-- These are legitimate domain outputs, not state management
-- article_link_count, article_linking_started_at, article_linking_completed_at

-- Step 6: Keep cancellation columns (legitimate domain events)
-- cancelled_at, cancelled_by

-- Step 7: Keep error message columns (legitimate debugging data)
-- step_1_icp_error_message, step_2_competitor_error_message, etc.

-- Step 8: Verify final clean schema
DO $$
DECLARE
  remaining_columns INTEGER;
  drift_columns INTEGER;
BEGIN
  -- Count total remaining columns
  SELECT COUNT(*) INTO remaining_columns
  FROM information_schema.columns 
  WHERE table_name = 'intent_workflows';
  
  -- Count remaining drift columns (should be 0)
  SELECT COUNT(*) INTO drift_columns
  FROM information_schema.columns 
  WHERE table_name = 'intent_workflows'
  AND column_name IN (
    'step_1_icp_completed_at', 'step_2_competitor_completed_at',
    'retry_count', 'step_2_competitors_retry_count', 'version'
  );
  
  RAISE NOTICE 'Final schema verification:';
  RAISE NOTICE '  Total columns: %', remaining_columns;
  RAISE NOTICE '  Remaining drift columns: %', drift_columns;
  
  IF drift_columns = 0 THEN
    RAISE NOTICE '✅ Schema drift cleanup completed successfully';
  ELSE
    RAISE EXCEPTION '❌ Schema drift cleanup failed - % columns remain', drift_columns;
  END IF;
END $$;

-- Step 9: Add comment documenting the clean FSM schema
COMMENT ON TABLE intent_workflows IS '
Clean deterministic finite state machine schema:

Core Columns:
- id, organization_id, name, state (ENUM), created_by, created_at, updated_at
- icp_data (domain output), cancelled_at, cancelled_by (domain events)

Domain Output Columns:
- article_link_count, article_linking_started_at, article_linking_completed_at

Debugging Columns:
- step_X_error_message (for operational debugging)

Principles:
1. State is the single source of truth for workflow progression
2. No step-specific timestamps (state represents progress)
3. No retry counters in main table (belongs in audit/job tables)
4. No version column (optimistic locking not implemented)
5. Domain data separated from orchestration state
6. Deterministic transitions enforced by ENUM and advanceWorkflow()
';
