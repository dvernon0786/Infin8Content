-- Add onboarding columns to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_version TEXT DEFAULT 'v1',
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS target_audiences TEXT[],
ADD COLUMN IF NOT EXISTS blog_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS content_defaults JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS keyword_settings JSONB DEFAULT '{}'::jsonb;

-- Create index for onboarding_completed filtering (idempotent)
CREATE INDEX IF NOT EXISTS idx_organizations_onboarding_completed 
ON organizations(onboarding_completed);

-- Verify RLS policies allow updates to new columns
-- Check for UPDATE policies with column restrictions
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'organizations'
AND cmd = 'UPDATE';

-- If UPDATE policies use column whitelisting, ensure new columns are included
-- Example policy update (run manually if needed):
-- ALTER POLICY "Users can update own organization" ON organizations
-- USING (organization_id = auth.uid()::uuid)
-- WITH CHECK (organization_id = auth.uid()::uuid);

-- Verify new columns are accessible through RLS
SELECT column_name, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name IN (
  'onboarding_completed', 'onboarding_version', 'website_url',
  'business_description', 'target_audiences', 'blog_config',
  'content_defaults', 'keyword_settings'
);
