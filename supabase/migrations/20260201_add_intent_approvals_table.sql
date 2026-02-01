-- Migration: Create intent_approvals table for seed keyword approval governance
-- Story 35.3: Approve Seed Keywords Before Expansion
-- Date: 2026-02-01

-- ============================================================================
-- Task 1: Create intent_approvals database table
-- ============================================================================

-- Intent approvals table: Stores human approval decisions for workflow governance
CREATE TABLE IF NOT EXISTS intent_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id) ON DELETE CASCADE,
  approval_type TEXT NOT NULL CHECK (approval_type IN ('seed_keywords')),
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  approver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feedback TEXT,
  approved_items JSONB, -- array of approved seed keyword IDs for partial approvals
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workflow_id, approval_type)
);

-- Add table comment
COMMENT ON TABLE intent_approvals IS 'Human approval governance for intent workflow steps, ensuring quality control before downstream processing';

-- Add column comments for documentation
COMMENT ON COLUMN intent_approvals.workflow_id IS 'Reference to the intent workflow being governed';
COMMENT ON COLUMN intent_approvals.approval_type IS 'Type of approval (seed_keywords, subtopics, etc.)';
COMMENT ON COLUMN intent_approvals.decision IS 'Approval decision (approved or rejected)';
COMMENT ON COLUMN intent_approvals.approver_id IS 'User who made the approval decision';
COMMENT ON COLUMN intent_approvals.feedback IS 'Optional feedback or notes about the decision';
COMMENT ON COLUMN intent_approvals.approved_items IS 'JSON array of specifically approved item IDs (for partial approvals)';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_intent_approvals_workflow_id ON intent_approvals(workflow_id);
CREATE INDEX IF NOT EXISTS idx_intent_approvals_approval_type ON intent_approvals(approval_type);
CREATE INDEX IF NOT EXISTS idx_intent_approvals_decision ON intent_approvals(decision);
CREATE INDEX IF NOT EXISTS idx_intent_approvals_approver_id ON intent_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_intent_approvals_created_at ON intent_approvals(created_at);

-- Create trigger to automatically update updated_at on row updates
-- Drop trigger if exists to make migration idempotent
DROP TRIGGER IF EXISTS update_intent_approvals_updated_at ON intent_approvals;
CREATE TRIGGER update_intent_approvals_updated_at
    BEFORE UPDATE ON intent_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Task 1.3: Implement RLS policies for organization isolation
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE intent_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view approvals from their own organization
DROP POLICY IF EXISTS "Users can view approvals from their organization" ON intent_approvals;
CREATE POLICY "Users can view approvals from their organization" ON intent_approvals
    FOR SELECT USING (
        workflow_id IN (
            SELECT id 
            FROM intent_workflows 
            WHERE organization_id = (
                SELECT org_id 
                FROM users 
                WHERE auth_user_id = auth.uid()
                LIMIT 1
            )
        )
    );

-- RLS Policy: Users can only insert approvals for their own organization
DROP POLICY IF EXISTS "Users can insert approvals for their organization" ON intent_approvals;
CREATE POLICY "Users can insert approvals for their organization" ON intent_approvals
    FOR INSERT WITH CHECK (
        workflow_id IN (
            SELECT id 
            FROM intent_workflows 
            WHERE organization_id = (
                SELECT org_id 
                FROM users 
                WHERE auth_user_id = auth.uid()
                LIMIT 1
            )
        )
    );

-- RLS Policy: Users can only update approvals from their own organization
DROP POLICY IF EXISTS "Users can update approvals from their organization" ON intent_approvals;
CREATE POLICY "Users can update approvals from their organization" ON intent_approvals
    FOR UPDATE USING (
        workflow_id IN (
            SELECT id 
            FROM intent_workflows 
            WHERE organization_id = (
                SELECT org_id 
                FROM users 
                WHERE auth_user_id = auth.uid()
                LIMIT 1
            )
        )
    );

-- RLS Policy: Service role bypasses RLS for admin operations
DROP POLICY IF EXISTS "Service role full access" ON intent_approvals;
CREATE POLICY "Service role full access" ON intent_approvals
    FOR ALL USING (
        pg_has_role('service_role', 'member')
    );

-- ============================================================================
-- Additional constraints and validation
-- ============================================================================

-- Ensure feedback is reasonable length if provided
DO $$ 
BEGIN
    ALTER TABLE intent_approvals ADD CONSTRAINT check_intent_approvals_feedback_length 
        CHECK (feedback IS NULL OR length(trim(feedback)) <= 2000);
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- Ensure approved_items is valid JSON array if provided
DO $$ 
BEGIN
    ALTER TABLE intent_approvals ADD CONSTRAINT check_intent_approvals_approved_items_json 
        CHECK (approved_items IS NULL OR jsonb_typeof(approved_items) = 'array');
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;
