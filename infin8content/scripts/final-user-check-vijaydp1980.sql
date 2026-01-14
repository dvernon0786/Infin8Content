-- Get complete user information for vijaydp1980@gmail.com
SELECT 
    pu.id,
    pu.auth_user_id,
    pu.email,
    pu.first_name,
    pu.org_id,
    pu.role,
    pu.otp_verified,
    pu.created_at,
    pu.updated_at
FROM public.users pu 
WHERE pu.email = 'vijaydp1980@gmail.com' 
OR pu.auth_user_id = 'f94ac792-24d0-4e14-a7e5-7b1ec4d684c9';

-- Also check if there are any articles or activities associated with this user
SELECT 
    'articles' as table_name,
    COUNT(*) as count
FROM public.articles 
WHERE user_id = 'f94ac792-24d0-4e14-a7e5-7b1ec4d684c9'

UNION ALL

SELECT 
    'activities' as table_name,
    COUNT(*) as count  
FROM public.activities 
WHERE user_id = 'f94ac792-24d0-4e14-a7e5-7b1ec4d684c9';
