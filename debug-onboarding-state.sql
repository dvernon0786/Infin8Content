-- Debug onboarding state for org c4506850-7afc-4929-963b-6da922ff36d0
SELECT 
  id,
  website_url,
  business_description,
  target_audiences,
  keyword_settings,
  content_defaults,
  integration,
  onboarding_completed,
  onboarding_completed_at,
  updated_at
FROM organizations 
WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- Check competitor count
SELECT 
  COUNT(*) as competitor_count,
  organization_id
FROM organization_competitors 
WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0'
AND is_active = true;

-- Check what validation should return
SELECT 
  CASE 
    WHEN website_url IS NULL OR website_url = '' THEN 'website_url missing'
    ELSE 'website_url present'
  END as website_status,
  CASE 
    WHEN business_description IS NULL OR business_description = '' THEN 'business_description missing'
    ELSE 'business_description present'
  END as business_status,
  CASE 
    WHEN target_audiences IS NULL OR NOT jsonb_array_length(target_audiences) > 0 THEN 'target_audiences missing'
    ELSE 'target_audiences present'
  END as audiences_status,
  CASE 
    WHEN keyword_settings IS NULL OR NOT jsonb_typeof(keyword_settings) = 'object' OR jsonb_typeof(keyword_settings) = 'null' THEN 'keyword_settings missing'
    ELSE 'keyword_settings present'
  END as keywords_status,
  CASE 
    WHEN content_defaults IS NULL OR NOT jsonb_typeof(content_defaults) = 'object' OR jsonb_typeof(content_defaults) = 'null' THEN 'content_defaults missing'
    ELSE 'content_defaults present'
  END as content_status,
  CASE 
    WHEN integration IS NULL OR NOT jsonb_typeof(integration) = 'object' OR jsonb_typeof(integration) = 'null' THEN 'integration missing'
    ELSE 'integration present'
  END as integration_status
FROM organizations 
WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';
