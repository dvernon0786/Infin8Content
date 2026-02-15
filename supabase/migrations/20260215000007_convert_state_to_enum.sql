-- Convert workflow state column to strict ENUM type
-- This provides database-level enforcement of valid states

-- Convert the existing text column to ENUM type
-- The USING clause safely casts existing text values to the new ENUM
ALTER TABLE intent_workflows
  ALTER COLUMN state TYPE workflow_state_enum
  USING state::workflow_state_enum;

-- Add a check constraint to ensure state is always valid (redundant but safe)
ALTER TABLE intent_workflows
  ADD CONSTRAINT valid_workflow_state 
  CHECK (state IS NOT NULL);

-- Add comment for documentation
COMMENT ON COLUMN intent_workflows.state IS 'Unified workflow state using strict ENUM type - single source of truth';
