-- Migration: Add ICP generation fields to intent_workflows table
-- Story 34.1: Generate ICP Document via Perplexity AI
-- Date: 2026-01-31

-- Add ICP-related columns to intent_workflows table
ALTER TABLE intent_workflows
ADD COLUMN IF NOT EXISTS icp_data JSONB,
ADD COLUMN IF NOT EXISTS step_1_icp_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS step_1_icp_error_message TEXT;

-- Create index for faster queries on icp_data
CREATE INDEX IF NOT EXISTS idx_intent_workflows_icp_data 
ON intent_workflows USING GIN (icp_data);

-- Create index for workflow status queries
CREATE INDEX IF NOT EXISTS idx_intent_workflows_status 
ON intent_workflows(status) 
WHERE status = 'step_1_icp';

-- Add comment for documentation
COMMENT ON COLUMN intent_workflows.icp_data IS 'Generated ICP data containing industries, buyer roles, pain points, and value proposition';
COMMENT ON COLUMN intent_workflows.step_1_icp_completed_at IS 'Timestamp when ICP generation step was completed';
COMMENT ON COLUMN intent_workflows.step_1_icp_error_message IS 'Error message if ICP generation failed';
