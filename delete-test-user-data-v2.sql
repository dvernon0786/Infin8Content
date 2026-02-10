-- Complete user data deletion for clean testing
-- This will remove all data for the test user and organization

-- 1. Delete audit logs for this org
DELETE FROM audit_logs 
WHERE org_id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0';

-- 2. Delete feature flags for this org
DELETE FROM feature_flags 
WHERE organization_id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0';

-- 3. Delete usage tracking for this org
DELETE FROM usage_tracking 
WHERE organization_id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0';

-- 4. Delete organization competitors
DELETE FROM organization_competitors 
WHERE organization_id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0';

-- 5. Delete articles (if any)
DELETE FROM articles 
WHERE created_by IN (
  SELECT id FROM users WHERE org_id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0'
);

-- 6. Delete workflows (if any)
DELETE FROM intent_workflows 
WHERE organization_id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0';

-- 7. Delete keywords (if any)
DELETE FROM keywords 
WHERE organization_id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0';

-- 8. Delete the organization
DELETE FROM organizations 
WHERE id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0';

-- 9. Delete the user(s) for this org
DELETE FROM users 
WHERE org_id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0';

-- 10. Delete auth user (this might cascade, but let's be explicit)
-- Note: This requires admin access to auth schema
-- DELETE FROM auth.users 
-- WHERE id IN (SELECT auth_user_id FROM users WHERE org_id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0');

-- Verification queries
SELECT 'Organizations deleted' as status, COUNT(*) as count FROM organizations WHERE id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0';
SELECT 'Users deleted' as status, COUNT(*) as count FROM users WHERE org_id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0';
SELECT 'Competitors deleted' as status, COUNT(*) as count FROM organization_competitors WHERE organization_id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0';
SELECT 'Articles deleted' as status, COUNT(*) as count FROM articles WHERE created_by IN (SELECT id FROM users WHERE org_id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0');
SELECT 'Workflows deleted' as status, COUNT(*) as count FROM intent_workflows WHERE organization_id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0';
SELECT 'Keywords deleted' as status, COUNT(*) as count FROM keywords WHERE organization_id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0';
SELECT 'Audit logs deleted' as status, COUNT(*) as count FROM audit_logs WHERE org_id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0';
SELECT 'Feature flags deleted' as status, COUNT(*) as count FROM feature_flags WHERE organization_id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0';
SELECT 'Usage tracking deleted' as status, COUNT(*) as count FROM usage_tracking WHERE organization_id = 'fd6477e3-b8dd-4f51-a8be-65336db852d0';
