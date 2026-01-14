-- Search for email "vijaydp1980@gmail.com" in the database
-- This script will check all relevant tables for this email address

-- Check users table
SELECT 
    'users' as table_name,
    id,
    email,
    created_at,
    updated_at
FROM public.users 
WHERE email = 'vijaydp1980@gmail.com';

-- Check auth.users table (Supabase auth)
SELECT 
    'auth.users' as table_name,
    id,
    email,
    created_at,
    updated_at
FROM auth.users 
WHERE email = 'vijaydp1980@gmail.com';

-- Check profiles table if it exists
SELECT 
    'profiles' as table_name,
    id,
    email,
    created_at,
    updated_at
FROM public.profiles 
WHERE email = 'vijaydp1980@gmail.com';

-- Show count of users with similar email pattern
SELECT 
    'users_similar' as table_name,
    COUNT(*) as count,
    email
FROM public.users 
WHERE email LIKE '%vijaydp1980%'
GROUP BY email;

-- Show count of auth users with similar email pattern  
SELECT 
    'auth_users_similar' as table_name,
    COUNT(*) as count,
    email
FROM auth.users 
WHERE email LIKE '%vijaydp1980%'
GROUP BY email;
