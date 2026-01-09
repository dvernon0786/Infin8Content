-- Check if users table exists and show its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Check if table exists
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) as users_table_exists;

-- Show any records in users table
SELECT COUNT(*) as user_count FROM public.users;
