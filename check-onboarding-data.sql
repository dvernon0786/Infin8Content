-- Check all onboarding data for organization c4506850-7afc-4929-963b-6da922ff36d0

SELECT 
    id,
    website_url,
    business_description,
    target_audiences,
    keyword_settings::text as keyword_settings,
    content_defaults::text as content_defaults,
    integration::text as integration,
    blog_config::text as blog_config,
    onboarding_completed,
    onboarding_completed_at,
    onboarding_version,
    updated_at
FROM organizations 
WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- Check competitors count and details
SELECT 
    COUNT(*) as competitor_count,
    array_agg(name ORDER BY created_at) as competitor_names,
    array_agg(url ORDER BY created_at) as competitor_urls
FROM organization_competitors 
WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0'
AND is_active = true
GROUP BY organization_id;
