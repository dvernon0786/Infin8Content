-- Create strict workflow state ENUM for database-level validation
-- This enforces state integrity at the database level

-- Create the ENUM type with all valid workflow states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'workflow_state_enum'
  ) THEN
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
    RAISE NOTICE 'Created workflow_state_enum type';
  ELSE
    RAISE NOTICE 'workflow_state_enum type already exists';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON TYPE workflow_state_enum IS 'Strict workflow state enumeration for intent workflow engine - matches transition graph exactly';
