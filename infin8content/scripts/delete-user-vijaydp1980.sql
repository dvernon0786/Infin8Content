-- Delete user vijaydp1980@gmail.com from auth.users table
-- WARNING: This action cannot be undone!

-- First, let's verify this is the correct user
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE id = 'f94ac792-24d0-4e14-a7e5-7b1ec4d684c9';

-- Delete the user from auth.users table
DELETE FROM auth.users 
WHERE id = 'f94ac792-24d0-4e14-a7e5-7b1ec4d684c9';

-- Verify deletion
SELECT 
    'User deleted successfully' as status,
    COUNT(*) as remaining_users
FROM auth.users 
WHERE email = 'vijaydp1980@gmail.com';
