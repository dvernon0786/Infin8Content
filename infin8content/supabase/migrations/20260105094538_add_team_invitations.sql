-- Add team_invitations table for team member invites and role assignments
-- Story 1.10: Team Member Invites and Role Assignments

-- ============================================================================
-- Create team_invitations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Create indexes for performance
-- ============================================================================

-- Index for invitation acceptance lookup by token
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);

-- Index for duplicate invitation checks (email + org combination)
CREATE INDEX IF NOT EXISTS idx_team_invitations_email_org ON team_invitations(email, org_id);

-- Index for team list queries by organization
CREATE INDEX IF NOT EXISTS idx_team_invitations_org_id ON team_invitations(org_id);

-- Index for cleanup queries (expired invitations)
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at ON team_invitations(expires_at);

-- ============================================================================
-- Create trigger for auto-updating updated_at timestamp
-- ============================================================================

DROP TRIGGER IF EXISTS update_team_invitations_updated_at ON team_invitations;
CREATE TRIGGER update_team_invitations_updated_at
    BEFORE UPDATE ON team_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Add table and column comments
-- ============================================================================

COMMENT ON TABLE team_invitations IS 'Team member invitations with role assignments and expiration';
COMMENT ON COLUMN team_invitations.email IS 'Email address of the invited team member';
COMMENT ON COLUMN team_invitations.org_id IS 'Organization ID that the invitation is for';
COMMENT ON COLUMN team_invitations.role IS 'Role assigned to the team member (editor or viewer only, not owner)';
COMMENT ON COLUMN team_invitations.token IS 'Unique invitation token used for acceptance (UUID format)';
COMMENT ON COLUMN team_invitations.status IS 'Invitation status: pending, accepted, or expired';
COMMENT ON COLUMN team_invitations.expires_at IS 'Timestamp when invitation expires (7 days from creation)';
COMMENT ON COLUMN team_invitations.accepted_at IS 'Timestamp when invitation was accepted';
COMMENT ON COLUMN team_invitations.created_by IS 'User ID of the organization owner who created the invitation';

