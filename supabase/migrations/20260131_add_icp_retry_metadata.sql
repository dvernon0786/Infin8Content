-- Story 34.3: Harden ICP Generation with Automatic Retry & Failure Recovery
-- Add retry metadata columns to intent_workflows table

ALTER TABLE intent_workflows
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS step_1_icp_last_error_message TEXT;

-- Create index for efficient retry tracking queries
CREATE INDEX IF NOT EXISTS idx_intent_workflows_retry_count 
ON intent_workflows(organization_id, retry_count) 
WHERE retry_count > 0;

-- Add comment for documentation
COMMENT ON COLUMN intent_workflows.retry_count IS 'Number of retry attempts for ICP generation (0 = initial attempt, max 3 total attempts)';
COMMENT ON COLUMN intent_workflows.step_1_icp_last_error_message IS 'Last error message from ICP generation attempt for audit trail';
