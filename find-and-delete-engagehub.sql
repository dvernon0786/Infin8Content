-- Find all records for engagehubonline@gmail.com
-- Run this to see what will be deleted first

-- Find users with this email
SELECT 'users' as table_name, id, email, org_id, created_at 
FROM users 
WHERE email = 'engagehubonline@gmail.com';

-- If you find records, run these deletion commands in order:

-- Step 1: Get organization ID from users table
-- SELECT org_id FROM users WHERE email = 'engagehubonline@gmail.com';

-- Step 2: Replace ORG_ID_HERE with the actual org_id from above
-- Then run these deletions in order (child tables first):

-- Disable audit protection temporarily
DROP FUNCTION IF EXISTS prevent_intent_audit_modification() CASCADE;

-- Delete intent audit logs
DELETE FROM intent_audit_logs WHERE organization_id = 'ORG_ID_HERE';

-- Delete cluster validation results
DELETE FROM cluster_validation_results WHERE workflow_id IN (
  SELECT id FROM intent_workflows WHERE organization_id = 'ORG_ID_HERE'
);

-- Delete topic clusters
DELETE FROM topic_clusters WHERE workflow_id IN (
  SELECT id FROM intent_workflows WHERE organization_id = 'ORG_ID_HERE'
);

-- Delete keywords
DELETE FROM keywords WHERE organization_id = 'ORG_ID_HERE';

-- Delete intent workflows
DELETE FROM intent_workflows WHERE organization_id = 'ORG_ID_HERE';

-- Delete organization competitors
DELETE FROM organization_competitors WHERE organization_id = 'ORG_ID_HERE';

-- Delete users
DELETE FROM users WHERE email = 'engagehubonline@gmail.com';

-- Delete organization
DELETE FROM organizations WHERE id = 'ORG_ID_HERE';

-- Re-enable audit protection
CREATE OR REPLACE FUNCTION prevent_intent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Direct modification of intent audit logs is not allowed';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_intent_audit_modification
BEFORE INSERT OR UPDATE OR DELETE ON intent_audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_intent_audit_modification();

-- Verify deletion
SELECT COUNT(*) FROM users WHERE email = 'engagehubonline@gmail.com';

-- Delete topic clusters
DELETE FROM topic_clusters WHERE workflow_id IN (
  SELECT id FROM intent_workflows WHERE organization_id = 'ORG_ID_HERE'
);

-- Delete keywords
DELETE FROM keywords WHERE organization_id = 'ORG_ID_HERE';

-- Delete intent workflows
DELETE FROM intent_workflows WHERE organization_id = 'ORG_ID_HERE';

-- Delete organization competitors
DELETE FROM organization_competitors WHERE organization_id = 'ORG_ID_HERE';

-- Delete users
DELETE FROM users WHERE email = 'engagehubonline@gmail.com';

-- Delete organization
DELETE FROM organizations WHERE email = 'engagehubonline@gmail.com';

-- Verify deletion
SELECT COUNT(*) FROM organizations WHERE email = 'engagehubonline@gmail.com';
