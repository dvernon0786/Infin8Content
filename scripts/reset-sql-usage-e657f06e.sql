-- Reset SQL editor usage for specific user
-- User ID: e657f06e-772c-4d5c-b3ee-2fcb94463212

-- The table is named 'usage_tracking' not 'usage'
-- Update SQL queries count for this organization
UPDATE usage_tracking 
SET 
  usage_count = 0,
  last_updated = NOW()
WHERE organization_id = 'e657f06e-772c-4d5c-b3ee-2fcb94463212'
AND metric_type = 'sql_queries';

-- Verify the reset
SELECT 
  organization_id,
  metric_type,
  usage_count,
  billing_period,
  last_updated
FROM usage_tracking 
WHERE organization_id = 'e657f06e-772c-4d5c-b3ee-2fcb94463212'
AND metric_type = 'sql_queries';

-- If no record exists, insert one
INSERT INTO usage_tracking (
  organization_id,
  metric_type,
  usage_count,
  billing_period,
  last_updated,
  created_at
) 
SELECT 
  'e657f06e-772c-4d5c-b3ee-2fcb94463212',
  'sql_queries',
  0,
  TO_CHAR(NOW(), 'YYYY-MM'),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM usage_tracking 
  WHERE organization_id = 'e657f06e-772c-4d5c-b3ee-2fcb94463212'
  AND metric_type = 'sql_queries'
);
