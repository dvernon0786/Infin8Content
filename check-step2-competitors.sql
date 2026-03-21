-- Check Step 2 competitors data
SELECT 
    id,
    organization_id,
    url,
    domain,
    name,
    is_active,
    created_by,
    created_at
FROM organization_competitors 
WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0'
ORDER BY created_at DESC;
