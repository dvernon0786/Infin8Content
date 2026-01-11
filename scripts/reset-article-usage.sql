-- Reset article generation usage to 0
UPDATE usage_tracking 
SET 
  usage_count = 0,
  last_updated = NOW()
WHERE organization_id = 'e657f06e-772c-4d5c-b3ee-2fcb94463212'
AND metric_type = 'article_generation';

-- Verify the reset
SELECT 
  organization_id,
  metric_type,
  usage_count,
  billing_period,
  last_updated
FROM usage_tracking 
WHERE organization_id = 'e657f06e-772c-4d5c-b3ee-2fcb94463212'
AND metric_type = 'article_generation';
