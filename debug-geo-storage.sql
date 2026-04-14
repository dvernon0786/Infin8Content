-- Debug query to check what's stored in organizations table
SELECT 
  id,
  name,
  keyword_settings,
  created_at,
  updated_at
FROM organizations 
ORDER BY created_at DESC
LIMIT 10;
