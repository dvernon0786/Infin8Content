-- Check current organization state after Step 3 attempt
SELECT 
    id,
    website_url,
    business_description,
    target_audiences,
    keyword_settings,
    content_defaults,
    updated_at
FROM organizations 
WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';
