-- SQL query to find email "vijaydp1980@gmail.com"
-- Run this in Supabase Dashboard → SQL Editor

-- Search in auth.users table (Supabase Authentication)
SELECT 
    'auth.users' as table_name,
    id,
    email,
    created_at,
    updated_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'vijaydp1980@gmail.com';

-- Search in public.users table (Application users)
SELECT 
    'public.users' as table_name,
    id,
    auth_user_id,
    email,
    first_name,
    created_at,
    updated_at
FROM public.users 
WHERE email = 'vijaydp1980@gmail.com';

-- Search for similar email patterns (in case of typos)
SELECT 
    'auth.users_similar' as table_name,
    id,
    email,
    created_at
FROM auth.users 
WHERE email LIKE '%vijaydp1980%'
ORDER BY created_at DESC;
