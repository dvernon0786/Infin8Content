-- Get detailed information about the user vijaydp1980@gmail.com
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.updated_at,
    au.email_confirmed_at,
    au.phone,
    au.last_sign_in_at,
    au.raw_user_meta_data,
    au.is_super_admin
FROM auth.users au 
WHERE au.email = 'vijaydp1980@gmail.com';

-- Check if this user has a corresponding record in public.users
SELECT 
    pu.id,
    pu.auth_user_id,
    pu.email,
    pu.first_name,
    pu.last_name,
    pu.created_at,
    pu.updated_at,
    pu.subscription_tier,
    pu.stripe_customer_id
FROM public.users pu 
WHERE pu.email = 'vijaydp1980@gmail.com' 
OR pu.auth_user_id = 'f94ac792-24d0-4e14-a7e5-7b1ec4d684c9';
