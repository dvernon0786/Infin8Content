-- Reset usage tracking to production baseline
-- Remove all test data and reset counters for production deployment

-- Reset specific test user that was used during development
UPDATE usage_tracking 
SET usage_count = 0 
WHERE organization_id = 'e657f06e-772c-4d5c-b3ee-2fcb94463212'
AND metric_type = 'sql_queries';

-- Verify production limits are properly configured
SELECT 
  organization_id,
  metric_type,
  usage_count,
  billing_period,
  last_updated
FROM usage_tracking 
WHERE usage_count != 0
ORDER BY metric_type, organization_id;

-- Check for any other test data that needs cleanup
SELECT COUNT(*) as total_usage_records
FROM usage_tracking;

SELECT COUNT(*) as zero_usage_records
FROM usage_tracking 
WHERE usage_count = 0;
