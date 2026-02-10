-- Reset all onboarding data for organization c4506850-7afc-4929-963b-6da922ff36d0

-- 1. Reset onboarding fields in organizations table
UPDATE organizations 
SET 
    website_url = NULL,
    business_description = NULL,
    target_audiences = NULL,
    keyword_settings = NULL,
    content_defaults = NULL,
    blog_config = NULL,
    onboarding_completed = false,
    onboarding_completed_at = NULL,
    onboarding_version = NULL,
    updated_at = NOW()
WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- 2. Delete all competitors
DELETE FROM organization_competitors 
WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- 3. Verify reset
SELECT 
    id,
    website_url,
    business_description,
    target_audiences,
    keyword_settings::text as keyword_settings,
    content_defaults::text as content_defaults,
    blog_config::text as blog_config,
    onboarding_completed,
    onboarding_completed_at,
    onboarding_version,
    updated_at
FROM organizations 
WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- 4. Verify competitors deleted
SELECT COUNT(*) as competitors_remaining
FROM organization_competitors 
WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0';
