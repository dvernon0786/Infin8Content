-- Add missing user_id column to workflow_transition_audit table
-- This column is referenced in the audit logging code but missing from schema

ALTER TABLE workflow_transition_audit
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add comment for documentation
COMMENT ON COLUMN workflow_transition_audit.user_id IS 'User who performed the workflow transition';
