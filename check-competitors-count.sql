-- Check competitors count for this organization
SELECT 
    COUNT(*) as competitor_count
FROM organization_competitors 
WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0'
AND is_active = true;
