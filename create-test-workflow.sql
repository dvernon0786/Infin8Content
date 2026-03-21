-- Find and disable only the specific problematic trigger
DO $$
DECLARE
    trigger_name text;
BEGIN
    -- Get the name of the problematic trigger
    SELECT tgname INTO trigger_name
    FROM pg_trigger
    WHERE tgrelid = 'intent_workflows'::regclass
      AND tgfoid = (SELECT oid FROM pg_proc WHERE proname = 'log_intent_workflow_creation')
      AND NOT tgisinternal;
    
    -- Disable only this specific trigger if found
    IF trigger_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE intent_workflows DISABLE TRIGGER %I', trigger_name);
        RAISE NOTICE 'Disabled trigger: %', trigger_name;
    END IF;
END $$;

-- Find an existing user for the workflow
SELECT id as user_id INTO TEMP existing_user 
FROM users 
LIMIT 1;

-- Test workflow creation for dashboard verification
INSERT INTO intent_workflows (
  id,
  name,
  organization_id,
  status,
  created_by,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Test Intent Workflow',
  '345a53c9-6ba0-4b22-aa34-33b6c5da4aef', -- Use the org ID from onboarding logs
  'step_1_icp',
  (SELECT user_id FROM existing_user), -- Use existing user UUID
  NOW(),
  NOW()
);

-- Verify the workflow was created
SELECT id, name, status, created_at 
FROM intent_workflows 
ORDER BY created_at DESC 
LIMIT 1;

-- Clean up temp table
DROP TABLE IF EXISTS existing_user;
