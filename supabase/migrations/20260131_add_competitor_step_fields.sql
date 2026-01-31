-- Migration: Add competitor analysis step fields to intent_workflows table
-- Story 34.2: Extract Seed Keywords from Competitor URLs via DataForSEO
-- Date: 2026-01-31

-- Add competitor analysis step fields to intent_workflows table
ALTER TABLE intent_workflows
ADD COLUMN IF NOT EXISTS step_2_competitor_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS step_2_competitor_error_message TEXT;

-- Create index for workflow status queries on competitor step
CREATE INDEX IF NOT EXISTS idx_intent_workflows_competitor_status 
ON intent_workflows(status) 
WHERE status = 'step_2_competitors';

-- Add comments for documentation
COMMENT ON COLUMN intent_workflows.step_2_competitor_completed_at IS 'Timestamp when competitor seed keyword extraction step was completed';
COMMENT ON COLUMN intent_workflows.step_2_competitor_error_message IS 'Error message if competitor analysis failed';
