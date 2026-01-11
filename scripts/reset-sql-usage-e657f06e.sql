-- Reset SQL editor usage for specific user
-- User ID: e657f06e-772c-4d5c-b3ee-2fcb94463212

UPDATE user_usage 
SET 
  sql_queries_count = 0,
  sql_queries_reset_at = NOW(),
  updated_at = NOW()
WHERE user_id = 'e657f06e-772c-4d5c-b3ee-2fcb94463212';

-- Verify the reset
SELECT 
  user_id,
  sql_queries_count,
  sql_queries_reset_at,
  updated_at
FROM user_usage 
WHERE user_id = 'e657f06e-772c-4d5c-b3ee-2fcb94463212';

-- If no record exists, insert one
INSERT INTO user_usage (
  user_id,
  org_id,
  sql_queries_count,
  sql_queries_reset_at,
  created_at,
  updated_at
) 
SELECT 
  'e657f06e-772c-4d5c-b3ee-2fcb94463212',
  org_id,
  0,
  NOW(),
  NOW(),
  NOW()
FROM users 
WHERE id = 'e657f06e-772c-4d5c-b3ee-2fcb94463212'
AND NOT EXISTS (
  SELECT 1 FROM user_usage WHERE user_id = 'e657f06e-772c-4d5c-b3ee-2fcb94463212'
);
