-- MVP EXECUTION VERIFICATION SQL QUERIES
-- Run these queries to verify the MVP execution is working correctly

-- ==========================================
-- 1. FEATURE FLAG LIFECYCLE VERIFICATION
-- ==========================================

-- Check if feature flags table exists and has correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'feature_flags'
ORDER BY ordinal_position;

-- Verify Intent Engine feature flag is enabled for organizations
SELECT 
    ff.organization_id,
    ff.flag_key,
    ff.enabled,
    ff.created_at,
    o.name as org_name,
    o.onboarding_completed
FROM feature_flags ff
JOIN organizations o ON ff.organization_id = o.id
WHERE ff.flag_key = 'ENABLE_INTENT_ENGINE'
ORDER BY ff.created_at DESC;

-- Check organizations that completed onboarding but don't have feature flags
SELECT 
    o.id,
    o.name,
    o.onboarding_completed,
    o.onboarding_completed_at,
    'MISSING_FEATURE_FLAG' as issue
FROM organizations o
LEFT JOIN feature_flags ff ON o.id = ff.organization_id AND ff.flag_key = 'ENABLE_INTENT_ENGINE'
WHERE o.onboarding_completed = true 
AND ff.id IS NULL;

-- ==========================================
-- 2. WORKFLOW CREATION VERIFICATION
-- ==========================================

-- Check intent_workflows table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'intent_workflows'
ORDER BY ordinal_position;

-- Verify workflows are being created correctly
SELECT 
    iw.id,
    iw.name,
    iw.status,
    iw.organization_id,
    o.name as org_name,
    iw.created_at,
    iw.updated_at
FROM intent_workflows iw
JOIN organizations o ON iw.organization_id = o.id
ORDER BY iw.created_at DESC
LIMIT 10;

-- Check workflow status distribution
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM intent_workflows
GROUP BY status
ORDER BY count DESC;

-- ==========================================
-- 3. USER ORGANIZATION VERIFICATION
-- ==========================================

-- Check users table structure and recent signups
SELECT 
    u.id,
    u.auth_user_id,
    u.email,
    u.org_id,
    u.role,
    o.name as org_name,
    o.onboarding_completed,
    u.created_at
FROM users u
JOIN organizations o ON u.org_id = o.id
WHERE u.created_at >= NOW() - INTERVAL '7 days'
ORDER BY u.created_at DESC;

-- Verify organization isolation (no cross-org data leakage)
SELECT 
    'organizations' as table_name,
    COUNT(*) as total_count
FROM organizations
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as total_count
FROM users
UNION ALL
SELECT 
    'intent_workflows' as table_name,
    COUNT(*) as total_count
FROM intent_workflows
UNION ALL
SELECT 
    'feature_flags' as table_name,
    COUNT(*) as total_count
FROM feature_flags;

-- ==========================================
-- 4. END-TO-END NEW USER FLOW TEST
-- ==========================================

-- Find a recently onboarded organization to test
WITH recent_org AS (
    SELECT 
        o.id,
        o.name,
        o.onboarding_completed_at
    FROM organizations o
    WHERE o.onboarding_completed = true
    ORDER BY o.onboarding_completed_at DESC
    LIMIT 1
)
SELECT 
    ro.id as org_id,
    ro.name as org_name,
    ro.onboarding_completed_at,
    CASE 
        WHEN ff.id IS NOT NULL THEN '✅ Feature flag enabled'
        ELSE '❌ Feature flag missing'
    END as feature_flag_status,
    CASE 
        WHEN iw.id IS NOT NULL THEN '✅ Has workflows'
        ELSE '❌ No workflows'
    END as workflow_status
FROM recent_org ro
LEFT JOIN feature_flags ff ON ro.id = ff.organization_id AND ff.flag_key = 'ENABLE_INTENT_ENGINE'
LEFT JOIN intent_workflows iw ON ro.id = iw.organization_id;

-- ==========================================
-- 5. MVP HEALTH CHECK
-- ==========================================

-- Summary dashboard for MVP health
SELECT 
    'Total Organizations' as metric,
    COUNT(*)::text as value
FROM organizations
UNION ALL
SELECT 
    'Organizations with Onboarding Complete' as metric,
    COUNT(*)::text as value
FROM organizations 
WHERE onboarding_completed = true
UNION ALL
SELECT 
    'Intent Engine Feature Flags Enabled' as metric,
    COUNT(*)::text as value
FROM feature_flags 
WHERE flag_key = 'ENABLE_INTENT_ENGINE' AND enabled = true
UNION ALL
SELECT 
    'Total Workflows Created' as metric,
    COUNT(*)::text as value
FROM intent_workflows
UNION ALL
SELECT 
    'Workflows by Status' as metric,
    status || ': ' || COUNT(*)::text as value
FROM intent_workflows
GROUP BY status;

-- ==========================================
-- 6. TROUBLESHOOTING QUERIES
-- ==========================================

-- Find organizations with feature flags but no onboarding (shouldn't happen)
SELECT 
    ff.organization_id,
    o.name,
    o.onboarding_completed,
    'FLAG_WITHOUT_ONBOARDING' as issue
FROM feature_flags ff
JOIN organizations o ON ff.organization_id = o.id
WHERE ff.flag_key = 'ENABLE_INTENT_ENGINE' 
AND o.onboarding_completed = false;

-- Find workflows stuck in step_0_auth (might indicate ICP input needed)
SELECT 
    iw.id,
    iw.name,
    iw.status,
    iw.created_at,
    EXTRACT(DAYS FROM AGE(NOW(), iw.created_at)) as days_stuck
FROM intent_workflows iw
WHERE iw.status = 'step_0_auth'
AND iw.created_at < NOW() - INTERVAL '1 hour'
ORDER BY iw.created_at;

-- Diagnose failed workflows
SELECT 
    iw.id,
    iw.name,
    iw.status,
    iw.organization_id,
    o.name as org_name,
    iw.created_at,
    iw.updated_at,
    EXTRACT(EPOCH FROM (iw.updated_at - iw.created_at)) as duration_seconds
FROM intent_workflows iw
JOIN organizations o ON iw.organization_id = o.id
WHERE iw.status = 'failed'
ORDER BY iw.updated_at DESC;
