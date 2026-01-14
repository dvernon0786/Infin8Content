-- Get detailed information about the user vijaydp1980@gmail.com
-- Check public.users table structure first
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Get user details with correct column names
SELECT 
    pu.id,
    pu.auth_user_id,
    pu.email,
    pu.first_name,
    pu.created_at,
    pu.updated_at,
    pu.subscription_tier,
    pu.stripe_customer_id
FROM public.users pu 
WHERE pu.email = 'vijaydp1980@gmail.com' 
OR pu.auth_user_id = 'f94ac792-24d0-4e14-a7e5-7b1ec4d684c9';
