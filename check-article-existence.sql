-- Check if the specific article exists
SELECT 
    id,
    title,
    keyword,
    status,
    org_id,
    created_at,
    updated_at
FROM articles 
WHERE id = 'daf31137-3d00-41ab-89ae-a455acb2f086';

-- Check all articles for this organization
SELECT 
    id,
    title,
    keyword,
    status,
    org_id,
    created_at,
    updated_at
FROM articles 
WHERE org_id = '039754b3-c797-45b3-b1b5-ad4acab980c0'
ORDER BY created_at DESC;

-- Check if user exists and their organization
SELECT 
    id,
    email,
    org_id,
    created_at
FROM users 
WHERE id = '64999e57-929c-4de0-8d11-8eae4ceab32a';

-- Check recent articles created (last 10)
SELECT 
    id,
    title,
    keyword,
    status,
    org_id,
    created_at
FROM articles 
ORDER BY created_at DESC 
LIMIT 10;
