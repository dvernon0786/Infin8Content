-- Story 34.3: Harden ICP Generation with Automatic Retry & Failure Recovery
-- Add rate_limits table for persistent, distributed rate limiting

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  key TEXT NOT NULL,
  window_start BIGINT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, key)
);

-- Create index for efficient lookups by organization and key
CREATE INDEX IF NOT EXISTS idx_rate_limits_org_key 
ON rate_limits(organization_id, key);

-- Create index for cleanup queries (expired windows)
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start 
ON rate_limits(window_start);

-- Add comments for documentation
COMMENT ON TABLE rate_limits IS 'Persistent rate limit tracking for distributed systems. Tracks API usage per organization across multiple servers.';
COMMENT ON COLUMN rate_limits.organization_id IS 'Organization ID for multi-tenancy';
COMMENT ON COLUMN rate_limits.key IS 'Rate limit key (e.g., icp_generation:org-id)';
COMMENT ON COLUMN rate_limits.window_start IS 'Unix timestamp (milliseconds) when the current rate limit window started';
COMMENT ON COLUMN rate_limits.request_count IS 'Number of requests made in the current window';
