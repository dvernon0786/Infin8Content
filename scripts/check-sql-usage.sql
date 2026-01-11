-- Check if SQL usage was reset
SELECT 
  organization_id,
  metric_type,
  usage_count,
  billing_period,
  last_updated,
  created_at
FROM usage_tracking 
WHERE organization_id = 'e657f06e-772c-4d5c-b3ee-2fcb94463212'
ORDER BY metric_type;
