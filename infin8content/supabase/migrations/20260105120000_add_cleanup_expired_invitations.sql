-- Add cleanup function for expired team invitations
-- Story 1.10: Team Member Invites and Role Assignments

-- ============================================================================
-- Create cleanup function for expired invitations
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update invitations where expires_at < NOW() AND status = 'pending' to status = 'expired'
  UPDATE team_invitations
  SET status = 'expired',
      updated_at = NOW()
  WHERE expires_at < NOW()
    AND status = 'pending';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Add function comment
-- ============================================================================

COMMENT ON FUNCTION cleanup_expired_invitations() IS 'Updates expired team invitations (expires_at < NOW() AND status = pending) to status = expired. Returns count of updated rows. Can be run via cron job or scheduled task.';

