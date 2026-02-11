-- Clear integration/blog_config data for organization c4506850-7afc-4929-963b-6da922ff36d0

-- Clear integrations field (contains WordPress connection data)
UPDATE organizations 
SET 
    integrations = NULL,
    updated_at = NOW()
WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- Verify the integration data is cleared
SELECT 
    id,
    integrations,
    updated_at
FROM organizations 
WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';
