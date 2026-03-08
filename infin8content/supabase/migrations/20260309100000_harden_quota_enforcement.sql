-- Quota Enforcement Hardening
-- Add usage_reset_at and article_usage counter for atomic quota enforcement

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS usage_reset_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS article_usage INTEGER NOT NULL DEFAULT 0;

-- Update plan_type default to 'trial' (Bug #4 fix)
ALTER TABLE organizations
ALTER COLUMN plan_type SET DEFAULT 'trial';

-- 1. Initialize usage_reset_at for existing orgs that don't have one (fallback to start-of-month)
UPDATE organizations
SET usage_reset_at = date_trunc('month', now()) + interval '1 month'
WHERE usage_reset_at IS NULL;

-- 2. Backfill synchronization for existing data
-- This ensures the atomic counter matches the actual article table reality on cold start
UPDATE organizations
SET article_usage = COALESCE((
    SELECT count(id)
    FROM articles
    WHERE articles.org_id = organizations.id
    AND articles.created_at >= (organizations.usage_reset_at - interval '1 month')
    AND articles.status IN ('processing', 'completed', 'reviewing')
), 0);

COMMENT ON COLUMN organizations.usage_reset_at IS 'Timestamp when the current usage period ends. Synchronized with Stripe billing cycle.';
COMMENT ON COLUMN organizations.article_usage IS 'Cached counter for atomic usage enforcement. Reset when now > usage_reset_at.';
