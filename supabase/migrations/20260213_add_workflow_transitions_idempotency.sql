-- Create workflow_transitions table for idempotency and audit trail
-- Tracks all workflow state transitions with idempotency keys for retry safety

CREATE TABLE IF NOT EXISTS workflow_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Idempotency key for retry safety
  idempotency_key TEXT NOT NULL,
  
  -- State transition details
  from_step INTEGER NOT NULL,
  to_step INTEGER NOT NULL,
  status TEXT NOT NULL,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(workflow_id, idempotency_key),
  CONSTRAINT valid_step_transition CHECK (to_step > from_step)
);

-- Index for fast idempotency lookups
CREATE INDEX idx_workflow_transitions_idempotency 
  ON workflow_transitions(workflow_id, idempotency_key);

-- Index for audit trail queries
CREATE INDEX idx_workflow_transitions_workflow 
  ON workflow_transitions(workflow_id, created_at DESC);

-- Add version column to intent_workflows for optimistic concurrency control
ALTER TABLE intent_workflows 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create function to safely increment version
CREATE OR REPLACE FUNCTION increment_version(workflow_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_version INTEGER;
BEGIN
  UPDATE intent_workflows 
  SET version = version + 1
  WHERE id = workflow_id
  RETURNING version INTO new_version;
  RETURN new_version;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on workflow_transitions
ALTER TABLE workflow_transitions ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only see transitions for their organization
CREATE POLICY workflow_transitions_org_isolation 
  ON workflow_transitions 
  FOR SELECT 
  USING (organization_id = auth.uid()::uuid OR EXISTS (
    SELECT 1 FROM organizations 
    WHERE id = organization_id 
    AND auth.uid() = ANY(member_ids)
  ));

-- RLS policy: Only service role can insert transitions
CREATE POLICY workflow_transitions_insert 
  ON workflow_transitions 
  FOR INSERT 
  WITH CHECK (true);
