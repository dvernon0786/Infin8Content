-- Create workflow transition audit table for enterprise audit trail
-- This table logs every state transition for complete traceability

CREATE TABLE IF NOT EXISTS workflow_transition_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  previous_state TEXT NOT NULL,
  new_state TEXT NOT NULL,
  transition_reason TEXT NOT NULL DEFAULT 'workflow_transition',
  transitioned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure we can track workflow progression
  CONSTRAINT workflow_transition_audit_workflow_state_check 
    CHECK (previous_state IS NOT NULL AND new_state IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_transition_audit_workflow_id 
  ON workflow_transition_audit(workflow_id);

CREATE INDEX IF NOT EXISTS idx_workflow_transition_audit_organization_id 
  ON workflow_transition_audit(organization_id);

CREATE INDEX IF NOT EXISTS idx_workflow_transition_audit_transitioned_at 
  ON workflow_transition_audit(transitioned_at DESC);

-- RLS (Row Level Security) for organization isolation
ALTER TABLE workflow_transition_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Organizations can only see their own audit logs (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'workflow_transition_audit' 
        AND policyname = 'Organizations can view their own workflow audit logs'
    ) THEN
        CREATE POLICY "Organizations can view their own workflow audit logs" 
        ON workflow_transition_audit FOR SELECT 
        USING (organization_id IN (SELECT id FROM organizations WHERE id = auth.uid()));
    END IF;
END $$;

-- RLS Policy: Service role can insert audit logs (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'workflow_transition_audit' 
        AND policyname = 'Service role can insert workflow audit logs'
    ) THEN
        CREATE POLICY "Service role can insert workflow audit logs" 
        ON workflow_transition_audit FOR INSERT 
        WITH CHECK (true);
    END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT ON workflow_transition_audit TO authenticated;
GRANT SELECT, INSERT ON workflow_transition_audit TO service_role;

-- Comment for documentation
COMMENT ON TABLE workflow_transition_audit IS 'Enterprise audit trail for all workflow state transitions';
COMMENT ON COLUMN workflow_transition_audit.workflow_id IS 'Reference to the workflow being transitioned';
COMMENT ON COLUMN workflow_transition_audit.organization_id IS 'Organization for multi-tenant isolation';
COMMENT ON COLUMN workflow_transition_audit.previous_state IS 'State before transition';
COMMENT ON COLUMN workflow_transition_audit.new_state IS 'State after transition';
COMMENT ON COLUMN workflow_transition_audit.transition_reason IS 'Reason for the transition';
COMMENT ON COLUMN workflow_transition_audit.transitioned_at IS 'When the transition occurred';
