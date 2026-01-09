-- Check the current state of users table and related tables
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'otp_codes', 'organizations')
ORDER BY table_name;

-- Check users table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Check if there are any users in the table
SELECT COUNT(*) as user_count FROM public.users;

-- Check if there are any organizations (needed for users table)
SELECT COUNT(*) as org_count FROM public.organizations;
