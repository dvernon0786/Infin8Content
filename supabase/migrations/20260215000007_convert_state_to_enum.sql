-- Safe workflow state column conversion to ENUM type
-- This migration handles existing data safely and provides rollback capability

-- Step 1: Create backup of existing states (for safety)
CREATE TABLE IF NOT EXISTS intent_workflows_state_backup AS 
SELECT id, state FROM intent_workflows;

-- Step 2: Update any invalid states to valid ones (data cleanup)
UPDATE intent_workflows 
SET state = 'CREATED' 
WHERE state NOT IN (
  'CREATED', 'CANCELLED', 'COMPLETED',
  'step_1_icp', 'step_2_competitors', 'step_3_seeds',
  'step_4_longtails', 'step_5_filtering', 'step_6_clustering',
  'step_7_validation', 'step_8_subtopics', 'step_9_articles'
);

-- Step 3: Drop the default value to avoid casting issues
ALTER TABLE intent_workflows ALTER COLUMN state DROP DEFAULT;

-- Step 4: Convert the existing text column to ENUM type
-- The USING clause safely casts existing text values to the new ENUM
ALTER TABLE intent_workflows
  ALTER COLUMN state TYPE workflow_state_enum
  USING state::workflow_state_enum;

-- Step 5: Add a default value using the ENUM type
ALTER TABLE intent_workflows ALTER COLUMN state SET DEFAULT 'step_1_icp';

-- Step 6: Add check constraint to ensure state is always valid
ALTER TABLE intent_workflows
  ADD CONSTRAINT valid_workflow_state 
  CHECK (state IS NOT NULL);

-- Step 7: Add comment for documentation
COMMENT ON COLUMN intent_workflows.state IS 'Unified workflow state using strict ENUM type - single source of truth';

-- Step 8: Verify the conversion worked correctly
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM intent_workflows 
  WHERE state IS NULL;
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % workflows with NULL state after conversion', invalid_count;
  END IF;
  
  RAISE NOTICE 'Successfully converted workflow state column to ENUM type';
END $$;
