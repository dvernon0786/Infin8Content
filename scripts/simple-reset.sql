-- Simple direct reset - no conflicts, no checks
DELETE FROM usage_tracking 
WHERE organization_id = 'e657f06e-772c-4d5c-b3ee-2fcb94463212'
AND metric_type = 'sql_queries';

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
);

-- Show result
SELECT * FROM usage_tracking 
WHERE organization_id = 'e657f06e-772c-4d5c-b3ee-2fcb94463212'
AND metric_type = 'sql_queries';
