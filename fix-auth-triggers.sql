-- Find and fix problematic auth.users triggers
-- This script identifies triggers that reference NEW.organization_id

-- Step 1: Find all triggers on auth.users
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgtype::text as trigger_type,
    tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass 
AND NOT tgisinternal;

-- Step 2: Find trigger functions that reference organization_id
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
WHERE EXISTS (
    SELECT 1 FROM pg_trigger tg
    WHERE tg.tgfoid = p.oid
    AND tg.tgrelid = 'auth.users'::regclass 
    AND NOT tg.tgisinternal
)
AND pg_get_functiondef(p.oid) ~ 'organization_id';

-- Step 3: If you find problematic triggers, drop them
-- Uncomment and run these commands if needed:

-- DROP TRIGGER IF EXISTS [trigger_name] ON auth.users;
-- DROP FUNCTION IF EXISTS [function_name]();

-- Step 4: Verify no more problematic triggers exist
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgtype::text as trigger_type,
    tgfoid::regproc as function_name
FROM pg_trigger tg
WHERE tg.tgrelid = 'auth.users'::regclass 
AND NOT tg.tgisinternal
AND EXISTS (
    SELECT 1 FROM pg_proc p 
    WHERE p.oid = tg.tgfoid 
    AND pg_get_functiondef(p.oid) ~ 'organization_id'
);
