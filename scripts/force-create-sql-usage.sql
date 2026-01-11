-- Force create SQL usage record with 0 count
INSERT INTO usage_tracking (
  organization_id,
  metric_type,
  usage_count,
  billing_period,
  last_updated,
  created_at
) 
VALUES (
  'e657f06e-772c-4d5c-b3ee-2fcb94463212',
  'sql_queries',
  0,
  '2026-01',
  NOW(),
  NOW()
)
ON CONFLICT (organization_id, metric_type, billing_period) 
DO UPDATE SET
  usage_count = 0,
  last_updated = NOW();

-- Verify the record
SELECT 
  organization_id,
  metric_type,
  usage_count,
  billing_period,
  last_updated
FROM usage_tracking 
WHERE organization_id = 'e657f06e-772c-4d5c-b3ee-2fcb94463212'
AND metric_type = 'sql_queries';
