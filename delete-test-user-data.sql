-- Complete user data deletion for clean testing
-- This will remove all data for the test user and organization

-- 1. Delete audit logs for this org
DELETE FROM audit_logs 
WHERE org_id = '13d050a4-704c-4560-a1bf-df83cc065098';

-- 2. Delete feature flags for this org
DELETE FROM feature_flags 
WHERE organization_id = '13d050a4-704c-4560-a1bf-df83cc065098';

-- 3. Delete usage tracking for this org
DELETE FROM usage_tracking 
WHERE organization_id = '13d050a4-704c-4560-a1bf-df83cc065098';

-- 4. Delete organization competitors
DELETE FROM organization_competitors 
WHERE organization_id = '13d050a4-704c-4560-a1bf-df83cc065098';

-- 5. Delete articles (if any)
DELETE FROM articles 
WHERE created_by = '2f7f38ed-a45d-4bfc-8c7e-47b2c55bb47f';

-- 6. Delete workflows (if any)
DELETE FROM intent_workflows 
WHERE organization_id = '13d050a4-704c-4560-a1bf-df83cc065098';

-- 7. Delete keywords (if any)
DELETE FROM keywords 
WHERE organization_id = '13d050a4-704c-4560-a1bf-df83cc065098';

-- 8. Delete the organization
DELETE FROM organizations 
WHERE id = '13d050a4-704c-4560-a1bf-df83cc065098';

-- 9. Delete the user
DELETE FROM users 
WHERE id = '2f7f38ed-a45d-4bfc-8c7e-47b2c55bb47f';

-- 10. Delete auth user (this might cascade, but let's be explicit)
-- Note: This requires admin access to auth schema
-- DELETE FROM auth.users 
-- WHERE id = 'b6dc5a50-829d-4052-aded-ea05ac117cce';

-- Verification queries
SELECT 'Organizations deleted' as status, COUNT(*) as count FROM organizations WHERE id = '13d050a4-704c-4560-a1bf-df83cc065098';
SELECT 'Users deleted' as status, COUNT(*) as count FROM users WHERE id = '2f7f38ed-a45d-4bfc-8c7e-47b2c55bb47f';
SELECT 'Competitors deleted' as status, COUNT(*) as count FROM organization_competitors WHERE organization_id = '13d050a4-704c-4560-a1bf-df83cc065098';
SELECT 'Articles deleted' as status, COUNT(*) as count FROM articles WHERE created_by = '2f7f38ed-a45d-4bfc-8c7e-47b2c55bb47f';
SELECT 'Workflows deleted' as status, COUNT(*) as count FROM intent_workflows WHERE organization_id = '13d050a4-704c-4560-a1bf-df83cc065098';
SELECT 'Keywords deleted' as status, COUNT(*) as count FROM keywords WHERE organization_id = '13d050a4-704c-4560-a1bf-df83cc065098';
SELECT 'Audit logs deleted' as status, COUNT(*) as count FROM audit_logs WHERE org_id = '13d050a4-704c-4560-a1bf-df83cc065098';
SELECT 'Feature flags deleted' as status, COUNT(*) as count FROM feature_flags WHERE organization_id = '13d050a4-704c-4560-a1bf-df83cc065098';
SELECT 'Usage tracking deleted' as status, COUNT(*) as count FROM usage_tracking WHERE organization_id = '13d050a4-704c-4560-a1bf-df83cc065098';
