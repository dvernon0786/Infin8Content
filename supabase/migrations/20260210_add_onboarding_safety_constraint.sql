-- Add database-level safety constraint for onboarding completion
-- This prevents onboarding_completed=true without required data
-- Even via direct SQL, scripts, or future dev mistakes

-- Add CHECK constraint to organizations table
ALTER TABLE organizations 
ADD CONSTRAINT onboarding_completed_requires_data
CHECK (
  onboarding_completed = false OR (
    website_url IS NOT NULL 
    AND website_url != ''
    AND business_description IS NOT NULL 
    AND business_description != ''
    AND char_length(business_description) >= 20
    AND target_audiences IS NOT NULL 
    AND jsonb_array_length(target_audiences) > 0
    AND keyword_settings IS NOT NULL 
    AND keyword_settings != '{}'::jsonb
    AND content_defaults IS NOT NULL 
    AND content_defaults != '{}'::jsonb
    AND EXISTS (
      SELECT 1 FROM organization_competitors 
      WHERE organization_id = organizations.id 
      AND is_active = true
    )
  )
);

-- Add comment for documentation
COMMENT ON CONSTRAINT onboarding_completed_requires_data ON organizations IS 
  'Prevents onboarding completion without all required canonical data fields and at least one active competitor';
