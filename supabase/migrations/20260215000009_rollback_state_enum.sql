-- Rollback migration for workflow state ENUM conversion
-- This restores the original TEXT column if needed

-- Step 1: Drop the check constraint
ALTER TABLE intent_workflows DROP CONSTRAINT IF EXISTS valid_workflow_state;

-- Step 2: Drop the default value
ALTER TABLE intent_workflows ALTER COLUMN state DROP DEFAULT;

-- Step 3: Convert back to TEXT type
ALTER TABLE intent_workflows
  ALTER COLUMN state TYPE TEXT
  USING state::TEXT;

-- Step 4: Restore the original default value
ALTER TABLE intent_workflows ALTER COLUMN state SET DEFAULT 'CREATED';

-- Step 5: Restore comment
COMMENT ON COLUMN intent_workflows.state IS 'Workflow state - legacy TEXT column';

-- Step 6: Verify rollback worked
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM intent_workflows 
  WHERE state IS NULL;
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % workflows with NULL state after rollback', invalid_count;
  END IF;
  
  RAISE NOTICE 'Successfully rolled back workflow state column to TEXT type';
END $$;
