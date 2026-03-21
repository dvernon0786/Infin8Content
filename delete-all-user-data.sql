-- Complete user data deletion for clean testing
-- This will remove all data for the test user and organization

-- 1. Delete audit logs for this org
DELETE FROM audit_logs 
WHERE org_id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- 2. Delete feature flags for this org
DELETE FROM feature_flags 
WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- 3. Delete usage tracking for this org
DELETE FROM usage_tracking 
WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- 4. Delete organization competitors
DELETE FROM organization_competitors 
WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- 5. Delete articles (if any)
DELETE FROM articles 
WHERE created_by = '6bfe4559-57fc-44fa-a211-72cc2e4ce393';

-- 6. Delete workflows (if any)
DELETE FROM intent_workflows 
WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- 7. Delete keywords (if any)
DELETE FROM keywords 
WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- 8. Delete the organization
DELETE FROM organizations 
WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- 9. Delete the user
DELETE FROM users 
WHERE id = '6bfe4559-57fc-44fa-a211-72cc2e4ce393';

-- 10. Delete auth user (this might cascade, but let's be explicit)
-- Note: This requires admin access to auth schema
-- DELETE FROM auth.users 
-- WHERE id = '0213cbe0-eae2-4dfd-9611-8a7701833321';

-- Verification queries
SELECT 'Organizations deleted' as status, COUNT(*) as count FROM organizations WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';
SELECT 'Users deleted' as status, COUNT(*) as count FROM users WHERE id = '6bfe4559-57fc-44fa-a211-72cc2e4ce393';
SELECT 'Competitors deleted' as status, COUNT(*) as count FROM organization_competitors WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0';
SELECT 'Articles deleted' as status, COUNT(*) as count FROM articles WHERE created_by = '6bfe4559-57fc-44fa-a211-72cc2e4ce393';
SELECT 'Workflows deleted' as status, COUNT(*) as count FROM intent_workflows WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0';
SELECT 'Keywords deleted' as status, COUNT(*) as count FROM keywords WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0';
SELECT 'Audit logs deleted' as status, COUNT(*) as count FROM audit_logs WHERE org_id = 'c4506850-7afc-4929-963b-6da922ff36d0';
SELECT 'Feature flags deleted' as status, COUNT(*) as count FROM feature_flags WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0';
SELECT 'Usage tracking deleted' as status, COUNT(*) as count FROM usage_tracking WHERE organization_id = 'c4506850-7afc-4929-963b-6da922ff36d0';
