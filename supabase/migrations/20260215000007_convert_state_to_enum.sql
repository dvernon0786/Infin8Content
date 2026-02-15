-- Clean ENUM conversion - Step by step approach
-- This handles the type conversion properly without casting issues

-- Step 1: Create backup of existing states
CREATE TABLE IF NOT EXISTS intent_workflows_state_backup AS 
SELECT id, state::text as original_state FROM intent_workflows;

-- Step 2: Verify ENUM type exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_state_enum') THEN
    RAISE EXCEPTION 'workflow_state_enum type does not exist. Run the ENUM creation migration first.';
  END IF;
END $$;

-- Step 3: Check current column type
DO $$
DECLARE
  current_type TEXT;
BEGIN
  SELECT data_type INTO current_type
  FROM information_schema.columns 
  WHERE table_name = 'intent_workflows' AND column_name = 'state';
  
  RAISE NOTICE 'Current state column type: %', current_type;
  
  IF current_type != 'text' THEN
    RAISE EXCEPTION 'State column is not TEXT type. Current type: %', current_type;
  END IF;
END $$;

-- Step 4: Clean up any invalid data first
UPDATE intent_workflows 
SET state = 'CREATED' 
WHERE state NOT IN (
  'CREATED', 'CANCELLED', 'COMPLETED',
  'step_1_icp', 'step_2_competitors', 'step_3_seeds',
  'step_4_longtails', 'step_5_filtering', 'step_6_clustering',
  'step_7_validation', 'step_8_subtopics', 'step_9_articles'
);

-- Step 5: Drop default value
ALTER TABLE intent_workflows ALTER COLUMN state DROP DEFAULT;

-- Step 6: Convert to ENUM using explicit cast
ALTER TABLE intent_workflows
  ALTER COLUMN state TYPE workflow_state_enum
  USING state::text::workflow_state_enum;

-- Step 7: Set new default
ALTER TABLE intent_workflows ALTER COLUMN state SET DEFAULT 'step_1_icp';

-- Step 8: Add constraint (compatible with all PostgreSQL versions)
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'intent_workflows' 
    AND constraint_name = 'valid_workflow_state'
  ) THEN
    ALTER TABLE intent_workflows
      ADD CONSTRAINT valid_workflow_state 
      CHECK (state IS NOT NULL);
    RAISE NOTICE 'Added valid_workflow_state constraint';
  ELSE
    RAISE NOTICE 'valid_workflow_state constraint already exists';
  END IF;
END $$;

-- Step 9: Verify conversion
DO $$
DECLARE
  enum_count INTEGER;
  text_count INTEGER;
BEGIN
  -- Count total workflows
  SELECT COUNT(*) INTO text_count
  FROM intent_workflows;
  
  -- Count workflows with valid ENUM states
  SELECT COUNT(*) INTO enum_count
  FROM intent_workflows 
  WHERE state IS NOT NULL;
  
  RAISE NOTICE 'Conversion verification: % total workflows, % with valid ENUM states', text_count, enum_count;
  
  IF enum_count != text_count THEN
    RAISE EXCEPTION 'Conversion failed: % workflows have NULL states', text_count - enum_count;
  END IF;
  
  RAISE NOTICE 'ENUM conversion completed successfully';
END $$;
