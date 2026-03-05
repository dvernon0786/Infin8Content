-- Add plan_type to organizations table for Trial Plan support
-- Default to 'starter' as safer fallback

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'starter';

-- Ensure the default is updated if the column already existed
ALTER TABLE organizations
ALTER COLUMN plan_type SET DEFAULT 'starter';

-- Initially, map existing plan column values to plan_type for backward compatibility
UPDATE organizations
SET plan_type = COALESCE(LOWER(plan), 'starter');

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plan_type_check') THEN
        ALTER TABLE organizations ADD CONSTRAINT plan_type_check CHECK (plan_type IN ('trial', 'starter', 'pro', 'agency'));
    END IF;
END $$;

-- Update the comment
COMMENT ON COLUMN organizations.plan_type IS 'Plan type for organizational limits: trial, starter, pro, agency';

-- Add partial index to optimize Trial plan article limiting checks
CREATE INDEX IF NOT EXISTS idx_articles_org_completed
ON articles (org_id)
WHERE status = 'completed';
