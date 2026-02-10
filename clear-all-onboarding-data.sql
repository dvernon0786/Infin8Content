-- Clear all onboarding data for organization c4506850-7afc-4929-963b-6da922ff36d0
-- This will reset Steps 1-5 to start fresh

-- Step 2: Clear competitors (organization_competitors table)
DELETE FROM organization_competitors 
WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- Steps 1, 3, 4: Clear organization onboarding fields
UPDATE organizations 
SET 
    website_url = NULL,
    business_description = NULL,
    target_audiences = NULL,
    keyword_settings = NULL,
    content_defaults = NULL,
    blog_config = NULL,
    updated_at = NOW()
WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- Verify the reset
SELECT 
    id,
    website_url,
    business_description,
    target_audiences,
    keyword_settings,
    content_defaults,
    blog_config,
    updated_at
FROM organizations 
WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- Check competitors count after reset
SELECT 
    COUNT(*) as competitor_count
FROM organization_competitors 
WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0'
AND is_active = true;
