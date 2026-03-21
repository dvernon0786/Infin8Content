-- Reset onboarding state for testing purposes
-- This will clear all onboarding data and reset completion flags
UPDATE organizations 
SET 
  website_url = NULL,
  business_description = NULL,
  target_audiences = NULL,
  keyword_settings = NULL,
  content_defaults = NULL,
  integration = NULL,
  onboarding_completed = false,
  onboarding_completed_at = NULL,
  updated_at = NOW()
WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- Clear competitors for this org
DELETE FROM organization_competitors 
WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- Verify reset
SELECT 
  website_url IS NULL as website_cleared,
  business_description IS NULL as business_cleared,
  target_audiences IS NULL as audiences_cleared,
  keyword_settings IS NULL as keywords_cleared,
  content_defaults IS NULL as content_cleared,
  integration IS NULL as integration_cleared,
  onboarding_completed as completion_status,
  (SELECT COUNT(*) FROM organization_competitors WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0') as competitor_count
FROM organizations 
WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';
