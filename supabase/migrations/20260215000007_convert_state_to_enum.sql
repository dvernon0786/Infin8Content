-- Production-safe ENUM conversion - Clean pattern without type comparison errors
-- This handles the type conversion properly by cleaning data while column is still TEXT

-- Step 1: Create backup of existing states
CREATE TABLE IF NOT EXISTS intent_workflows_state_backup AS 
SELECT id, state::text as original_state FROM intent_workflows;

-- Step 2: Clean invalid rows while column is still TEXT
UPDATE intent_workflows
SET state = 'step_1_icp'
WHERE state IS NULL
   OR state NOT IN (
      'step_1_icp','step_2_competitors','step_3_seeds',
      'step_4_longtails','step_5_filtering','step_6_clustering',
      'step_7_validation','step_8_subtopics','step_9_articles',
      'COMPLETED','CANCELLED'
   );

-- Step 3: Drop default BEFORE casting
ALTER TABLE intent_workflows ALTER COLUMN state DROP DEFAULT;

-- Step 4: Convert column to ENUM using explicit cast
ALTER TABLE intent_workflows
  ALTER COLUMN state TYPE workflow_state_enum
  USING state::workflow_state_enum;

-- Step 5: Re-apply default explicitly cast
ALTER TABLE intent_workflows
  ALTER COLUMN state SET DEFAULT 'step_1_icp'::workflow_state_enum;

-- Step 6: Enforce NOT NULL (no redundant CHECK constraint needed)
ALTER TABLE intent_workflows
  ALTER COLUMN state SET NOT NULL;

-- Step 7: Verify conversion
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
