-- Add retry metadata columns to intent_workflows table
-- Story 34.4: Handle Competitor Analysis Failures with Retry
-- These columns track retry attempts and error messages for competitor analysis step

-- Add retry count column for step_2_competitors
ALTER TABLE intent_workflows 
ADD COLUMN step_2_competitors_retry_count INTEGER DEFAULT 0;

-- Add last error message column for step_2_competitors  
ALTER TABLE intent_workflows
ADD COLUMN step_2_competitors_last_error_message TEXT;

-- Add indexes for performance (optional but recommended)
CREATE INDEX idx_intent_workflows_competitors_retry_count ON intent_workflows(step_2_competitors_retry_count) WHERE step_2_competitors_retry_count > 0;

-- Add RLS policies for new columns (if intent_workflows has RLS enabled)
-- These policies inherit the existing intent_workflows RLS since we're just adding columns

-- Comments for documentation
COMMENT ON COLUMN intent_workflows.step_2_competitors_retry_count IS 'Number of retry attempts for competitor analysis step (Story 34.4)';
COMMENT ON COLUMN intent_workflows.step_2_competitors_last_error_message IS 'Last error message from competitor analysis step (Story 34.4)';
