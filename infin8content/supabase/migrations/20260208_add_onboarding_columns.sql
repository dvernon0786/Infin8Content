-- Add comprehensive onboarding columns to organizations table
-- This migration adds all onboarding-related fields that the application code expects

-- Core onboarding state tracking
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_version TEXT DEFAULT 'v1';

-- Onboarding data fields (from Step 1: Business)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS target_audiences TEXT[];

-- Onboarding data fields (from Steps 3-5)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS blog_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS content_defaults JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS keyword_settings JSONB DEFAULT '{}';

-- Performance indexes for middleware and guards
CREATE INDEX IF NOT EXISTS idx_organizations_onboarding_completed ON organizations (onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_organizations_onboarding_version ON organizations (onboarding_version);

-- Documentation comments
COMMENT ON COLUMN organizations.onboarding_completed IS 'Whether the organization has completed onboarding';
COMMENT ON COLUMN organizations.onboarding_completed_at IS 'Timestamp when onboarding was completed';
COMMENT ON COLUMN organizations.onboarding_version IS 'Version of onboarding flow completed';
COMMENT ON COLUMN organizations.website_url IS 'Organization website URL from onboarding Step 1';
COMMENT ON COLUMN organizations.business_description IS 'Business description from onboarding Step 1';
COMMENT ON COLUMN organizations.target_audiences IS 'Target audiences from onboarding Step 1';
COMMENT ON COLUMN organizations.blog_config IS 'Blog configuration from onboarding Step 3';
COMMENT ON COLUMN organizations.content_defaults IS 'Content defaults from onboarding Step 4';
COMMENT ON COLUMN organizations.keyword_settings IS 'Keyword settings from onboarding Step 5';

-- Backfill existing organizations that should be considered onboarded
-- (Only if they have existing data that suggests they completed onboarding)
UPDATE organizations
SET onboarding_completed = true,
    onboarding_completed_at = COALESCE(updated_at, created_at)
WHERE onboarding_completed = false
  AND (
    -- Consider orgs with any onboarding data as completed
    website_url IS NOT NULL
    OR business_description IS NOT NULL
    OR blog_config != '{}'::jsonb
    OR content_defaults != '{}'::jsonb
    OR keyword_settings != '{}'::jsonb
  );
