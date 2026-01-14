-- Test the registration fix
-- Verify the user was deleted and test the new RLS policies

-- Verify user is deleted from auth.users
SELECT 
    'auth_users_after_delete' as status,
    COUNT(*) as count,
    email
FROM auth.users 
WHERE email = 'vijaydp1980@gmail.com'
GROUP BY email;

-- Verify user is deleted from public.users (should be 0 anyway)
SELECT 
    'public_users_after_delete' as status,
    COUNT(*) as count,
    email
FROM public.users 
WHERE email = 'vijaydp1980@gmail.com'
GROUP BY email;

-- Show the new RLS policies for user creation
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND cmd = 'INSERT'
ORDER BY policyname;
