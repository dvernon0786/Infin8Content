-- Create intent_workflows table for Story 33.1
-- Multi-tenant workflow management with organization isolation

-- ============================================================================
-- Task 1: Create intent_workflows database table
-- ============================================================================

-- Intent workflows table: Stores workflow records with organization context
CREATE TABLE IF NOT EXISTS intent_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'step_0_auth' CHECK (status IN ('step_0_auth', 'step_1_icp', 'step_2_competitors', 'step_3_keywords', 'step_4_topics', 'step_5_generation', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    workflow_data JSONB DEFAULT '{}'::jsonb
);

-- Add table comment
COMMENT ON TABLE intent_workflows IS 'Multi-tenant intent workflow management with organization isolation and status tracking';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_intent_workflows_organization_id ON intent_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_intent_workflows_status ON intent_workflows(status);
CREATE INDEX IF NOT EXISTS idx_intent_workflows_created_by ON intent_workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_intent_workflows_created_at ON intent_workflows(created_at);

-- Create unique constraint on workflow name within organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_intent_workflows_org_name ON intent_workflows(organization_id, name);

-- Create trigger to automatically update updated_at on row updates
-- Drop trigger if exists to make migration idempotent
DROP TRIGGER IF EXISTS update_intent_workflows_updated_at ON intent_workflows;
CREATE TRIGGER update_intent_workflows_updated_at
    BEFORE UPDATE ON intent_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Task 1.3: Implement RLS policies for organization isolation
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE intent_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access workflows from their own organization
DROP POLICY IF EXISTS "Users can view workflows from their organization" ON intent_workflows;
CREATE POLICY "Users can view workflows from their organization" ON intent_workflows
    FOR SELECT USING (
        organization_id = (
            SELECT org_id 
            FROM users 
            WHERE auth_user_id = auth.uid()
            LIMIT 1
        )
    );

-- RLS Policy: Users can only insert workflows for their own organization
DROP POLICY IF EXISTS "Users can insert workflows for their organization" ON intent_workflows;
CREATE POLICY "Users can insert workflows for their organization" ON intent_workflows
    FOR INSERT WITH CHECK (
        organization_id = (
            SELECT org_id 
            FROM users 
            WHERE auth_user_id = auth.uid()
            LIMIT 1
        )
    );

-- RLS Policy: Users can only update workflows from their own organization
DROP POLICY IF EXISTS "Users can update workflows from their organization" ON intent_workflows;
CREATE POLICY "Users can update workflows from their organization" ON intent_workflows
    FOR UPDATE USING (
        organization_id = (
            SELECT org_id 
            FROM users 
            WHERE auth_user_id = auth.uid()
            LIMIT 1
        )
    );

-- RLS Policy: Users can only delete workflows from their own organization
DROP POLICY IF EXISTS "Users can delete workflows from their organization" ON intent_workflows;
CREATE POLICY "Users can delete workflows from their organization" ON intent_workflows
    FOR DELETE USING (
        organization_id = (
            SELECT org_id 
            FROM users 
            WHERE auth_user_id = auth.uid()
            LIMIT 1
        )
    );

-- RLS Policy: Service role bypasses RLS for admin operations
DROP POLICY IF EXISTS "Service role full access" ON intent_workflows;
CREATE POLICY "Service role full access" ON intent_workflows
    FOR ALL USING (
        pg_has_role('service_role', 'member')
    );

-- ============================================================================
-- Additional constraints and validation
-- ============================================================================

-- Ensure workflow name is not empty
DO $$ 
BEGIN
    ALTER TABLE intent_workflows ADD CONSTRAINT check_intent_workflows_name_not_empty 
        CHECK (length(trim(name)) > 0);
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- Ensure workflow_data is valid JSON (already enforced by JSONB type)
-- No additional constraint needed

-- ============================================================================
-- Audit trigger for workflow creation
-- ============================================================================

-- Create function to log workflow creation events
CREATE OR REPLACE FUNCTION log_intent_workflow_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Log workflow creation to audit trail
    INSERT INTO audit_logs (action, user_id, organization_id, details, ip_address, user_agent)
    SELECT 
        'intent.workflow.created',
        NEW.created_by,
        NEW.organization_id,
        jsonb_build_object(
            'workflow_id', NEW.id,
            'workflow_name', NEW.name,
            'workflow_status', NEW.status
        ),
        inet_client_addr(),
        current_setting('request.headers')::jsonb->>'user-agent'
    WHERE EXISTS (SELECT 1 FROM users WHERE id = NEW.created_by);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the insert if audit logging fails
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for workflow creation audit
-- Drop trigger if exists to make migration idempotent
DROP TRIGGER IF EXISTS log_intent_workflow_creation_trigger ON intent_workflows;
CREATE TRIGGER log_intent_workflow_creation_trigger
    AFTER INSERT ON intent_workflows
    FOR EACH ROW
    EXECUTE FUNCTION log_intent_workflow_creation();
