-- COMPREHENSIVE LONGTAIL ERROR ANALYSIS
-- Check all recent longtail expansion errors and success metrics

-- 1. Check recent longtail errors
SELECT 
  created_at,
  action,
  details->>'seed_keyword' as seed_keyword,
  details->>'error_type' as error_type,
  details->>'error_message' as error_message,
  details->>'source' as source,
  details->>'endpoint' as endpoint
FROM intent_audit_logs 
WHERE action = 'workflow.longtail_keywords.error'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

-- 2. Check recent longtail success metrics
SELECT 
  created_at,
  action,
  details->>'seed_keyword' as seed_keyword,
  details->>'longtails_created' as longtails_created,
  details->>'longtails_skipped' as longtails_skipped,
  details->>'total_collected' as total_collected,
  details->>'after_deduplication' as after_deduplication,
  details->>'after_filtering' as after_filtering,
  details->>'self_duplicates_skipped' as self_duplicates_skipped,
  details->>'existing_keywords_skipped' as existing_keywords_skipped,
  details->>'successful_sources' as successful_sources,
  details->>'failed_sources' as failed_sources
FROM intent_audit_logs 
WHERE action = 'workflow.longtail_keywords.seed_completed'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

-- 3. Check workflow completion summaries
SELECT 
  created_at,
  details->>'seeds_processed' as seeds_processed,
  details->>'total_longtails_created' as total_longtails_created,
  details->>'average_longtails_per_seed' as average_longtails_per_seed,
  details->>'existing_keywords_filtered' as existing_keywords_filtered
FROM intent_audit_logs 
WHERE action = 'workflow.longtail_keywords.seed_completed'
  AND details->>'seed_keyword' = 'WORKFLOW_COMPLETE'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Error type summary
SELECT 
  details->>'error_type' as error_type,
  COUNT(*) as error_count,
  STRING_AGG(DISTINCT details->>'source', ', ') as affected_sources
FROM intent_audit_logs 
WHERE action = 'workflow.longtail_keywords.error'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY details->>'error_type'
ORDER BY error_count DESC;

-- 5. Source performance analysis
SELECT 
  details->>'source' as source,
  COUNT(*) as total_calls,
  COUNT(CASE WHEN details->>'error_type' IS NOT NULL THEN 1 END) as failed_calls,
  ROUND(AVG(CAST(details->>'keywords_returned' AS INTEGER)), 2) as avg_keywords_returned
FROM intent_audit_logs 
WHERE action IN ('workflow.longtail_keywords.seed_completed', 'workflow.longtail_keywords.error')
  AND details->>'source' IS NOT NULL
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY details->>'source'
ORDER BY total_calls DESC;
