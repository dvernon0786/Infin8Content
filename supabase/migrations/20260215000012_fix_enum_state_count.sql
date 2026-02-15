-- Fix ENUM State Count Mismatch - Drop and Recreate Clean ENUM
-- 
-- The issue: An old ENUM with 28 states exists, preventing the clean 11-state ENUM
-- This migration drops the old ENUM and recreates the clean version

-- Step 1: Check current ENUM states
DO $$
DECLARE
  current_states TEXT[];
  state_count INTEGER;
BEGIN
  SELECT array_agg(enumlabel ORDER BY enumsortorder), COUNT(*) INTO current_states, state_count
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'workflow_state_enum');
  
  RAISE NOTICE 'Current ENUM has % states: %', state_count, array_to_string(current_states, ', ');
  
  IF state_count = 11 THEN
    RAISE NOTICE '✅ ENUM already has correct state count - no action needed';
    RETURN;
  END IF;
  
  RAISE NOTICE '⚠️  Dropping old ENUM with % states to recreate clean version', state_count;
END $$;

-- Step 2: Drop the state column temporarily (to break dependency)
ALTER TABLE intent_workflows ALTER COLUMN state DROP DEFAULT;

-- Step 3: Convert state column back to TEXT (to break ENUM dependency)
ALTER TABLE intent_workflows
  ALTER COLUMN state TYPE TEXT
  USING state::TEXT;

-- Step 4: Drop the old ENUM type
DROP TYPE IF EXISTS workflow_state_enum;

-- Step 5: Create clean ENUM with exactly 11 states
CREATE TYPE workflow_state_enum AS ENUM (
  'step_1_icp',
  'step_2_competitors', 
  'step_3_seeds',
  'step_4_longtails',
  'step_5_filtering',
  'step_6_clustering',
  'step_7_validation',
  'step_8_subtopics',
  'step_9_articles',
  'COMPLETED',
  'CANCELLED'
);

-- Step 6: Clean up any invalid states in the data
UPDATE intent_workflows
SET state = 'step_1_icp'
WHERE state NOT IN (
  'step_1_icp', 'step_2_competitors', 'step_3_seeds',
  'step_4_longtails', 'step_5_filtering', 'step_6_clustering',
  'step_7_validation', 'step_8_subtopics', 'step_9_articles',
  'COMPLETED', 'CANCELLED'
);

-- Step 7: Convert column back to clean ENUM
ALTER TABLE intent_workflows
  ALTER COLUMN state TYPE workflow_state_enum
  USING state::workflow_state_enum;

-- Step 8: Set proper default
ALTER TABLE intent_workflows
  ALTER COLUMN state SET DEFAULT 'step_1_icp'::workflow_state_enum;

-- Step 9: Enforce NOT NULL
ALTER TABLE intent_workflows
  ALTER COLUMN state SET NOT NULL;

-- Step 10: Verify the fix
DO $$
DECLARE
  new_states TEXT[];
  new_count INTEGER;
BEGIN
  SELECT array_agg(enumlabel ORDER BY enumsortorder), COUNT(*) INTO new_states, new_count
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'workflow_state_enum');
  
  RAISE NOTICE '✅ New ENUM has % states: %', new_count, array_to_string(new_states, ', ');
  
  IF new_count != 11 THEN
    RAISE EXCEPTION '❌ ENUM fix failed - expected 11 states, got %', new_count;
  END IF;
  
  RAISE NOTICE '✅ ENUM state count fixed successfully';
END $$;

-- Step 11: Add comment
COMMENT ON TYPE workflow_state_enum IS 'Clean workflow state enumeration - exactly 11 states for deterministic FSM';
