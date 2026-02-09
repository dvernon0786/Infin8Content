-- Migration: Add cluster_validation_results table for Story 36.3
-- Story: 36-3-validate-cluster-coherence-and-structure
-- Date: 2026-02-01

-- Create cluster_validation_results table for storing validation outcomes
CREATE TABLE IF NOT EXISTS cluster_validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id) ON DELETE CASCADE,
  hub_keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  validation_status TEXT NOT NULL CHECK (validation_status IN ('valid', 'invalid')),
  avg_similarity DECIMAL(3,2) CHECK (avg_similarity >= 0 AND avg_similarity <= 1),
  spoke_count INTEGER NOT NULL CHECK (spoke_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure each hub keyword gets one validation result per workflow
  UNIQUE (workflow_id, hub_keyword_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cluster_validation_results_workflow_id 
ON cluster_validation_results(workflow_id);

CREATE INDEX IF NOT EXISTS idx_cluster_validation_results_hub_keyword_id 
ON cluster_validation_results(hub_keyword_id);

CREATE INDEX IF NOT EXISTS idx_cluster_validation_results_status 
ON cluster_validation_results(validation_status);

-- Add comments for documentation
COMMENT ON TABLE cluster_validation_results IS 'Validation results for hub-and-spoke keyword clusters';
COMMENT ON COLUMN cluster_validation_results.workflow_id IS 'Reference to the intent workflow';
COMMENT ON COLUMN cluster_validation_results.hub_keyword_id IS 'Hub keyword being validated';
COMMENT ON COLUMN cluster_validation_results.validation_status IS 'Binary validation outcome (valid/invalid)';
COMMENT ON COLUMN cluster_validation_results.avg_similarity IS 'Average semantic similarity between hub and spokes';
COMMENT ON COLUMN cluster_validation_results.spoke_count IS 'Number of spokes in the cluster';

-- Enable RLS for security
ALTER TABLE cluster_validation_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS cluster_validation_results_org_access ON cluster_validation_results;

-- Create RLS policy for organization access
-- Users can only access validation results from their organization
CREATE POLICY cluster_validation_results_org_access ON cluster_validation_results
  FOR ALL
  USING (
    workflow_id IN (
      SELECT id FROM intent_workflows 
      WHERE organization_id = public.get_auth_user_org_id()
    )
  )
  WITH CHECK (
    workflow_id IN (
      SELECT id FROM intent_workflows 
      WHERE organization_id = public.get_auth_user_org_id()
    )
  );
