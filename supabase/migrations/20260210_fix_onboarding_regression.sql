-- Fix onboarding regression by resetting broken onboardings
-- This migration repairs organizations marked complete without actual data

-- 1️⃣ Reset broken onboardings (set completed=false where data missing)
UPDATE organizations
SET 
  onboarding_completed = false,
  onboarding_completed_at = NULL,
  onboarding_version = 'v2-reset'
WHERE onboarding_completed = true
AND (
  website_url IS NULL
  OR business_description IS NULL
  OR target_audiences IS NULL
  OR keyword_settings IS NULL
  OR keyword_settings = '{}'
  OR content_defaults IS NULL
  OR content_defaults = '{}'
);

-- 2️⃣ Report affected organizations for verification
SELECT 
  id,
  name,
  onboarding_completed,
  onboarding_version,
  CASE 
    WHEN website_url IS NULL THEN 'missing_website_url'
    WHEN business_description IS NULL THEN 'missing_business_description'
    WHEN target_audiences IS NULL THEN 'missing_target_audiences'
    WHEN keyword_settings IS NULL OR keyword_settings = '{}' THEN 'missing_keyword_settings'
    WHEN content_defaults IS NULL OR content_defaults = '{}' THEN 'missing_content_defaults'
    ELSE 'unknown'
  END as missing_field
FROM organizations
WHERE onboarding_completed = false
AND onboarding_version = 'v2-reset';

-- 3️⃣ Add comment for documentation
COMMENT ON TABLE organizations IS 
  'Fixed onboarding regression: organizations marked complete must have all required data fields populated';
