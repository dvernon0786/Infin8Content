-- Verify Step 1 data was saved to database
SELECT 
    id,
    website_url,
    business_description,
    target_audiences,
    onboarding_completed,
    updated_at
FROM organizations 
WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';
