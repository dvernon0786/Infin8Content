-- Check what organizations exist in the database
SELECT 
    id,
    name,
    created_at,
    status
FROM organizations 
ORDER BY created_at DESC;

-- Check if the hardcoded org ID exists
SELECT 
    id,
    name,
    created_at
FROM organizations 
WHERE id = 'e657f06e-772c-4d5c-b3ee-2fcb94463212';

-- Get the most recent organization to use as replacement
SELECT 
    id,
    name,
    created_at
FROM organizations 
ORDER BY created_at DESC 
LIMIT 1;
