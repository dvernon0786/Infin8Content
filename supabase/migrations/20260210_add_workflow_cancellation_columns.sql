-- Add cancellation support to intent_workflows table
-- Enables proper workflow cancellation with audit trail

-- Add cancellation tracking columns
ALTER TABLE intent_workflows 
ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN cancelled_by UUID REFERENCES auth.users(id);

-- Add index for cancellation queries
CREATE INDEX idx_intent_workflows_cancelled_at ON intent_workflows(cancelled_at) WHERE cancelled_at IS NOT NULL;
CREATE INDEX idx_intent_workflows_cancelled_by ON intent_workflows(cancelled_by) WHERE cancelled_by IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN intent_workflows.cancelled_at IS 'Timestamp when workflow was cancelled by user';
COMMENT ON COLUMN intent_workflows.cancelled_by IS 'User who cancelled the workflow (references auth.users)';
