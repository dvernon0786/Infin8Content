-- Check integration data for organization c4506850-7afc-4929-963b-6da922ff36d0

SELECT 
    id,
    integration::text as integration_data,
    onboarding_completed,
    onboarding_completed_at,
    updated_at
FROM organizations 
WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- Also check all onboarding fields together
SELECT 
    id,
    website_url,
    business_description,
    target_audiences,
    keyword_settings::text as keyword_settings,
    content_defaults::text as content_defaults,
    integration::text as integration_data,
    onboarding_completed,
    onboarding_completed_at,
    updated_at
FROM organizations 
WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';
