-- Verify complete user data storage for engagehubonline@gmail.com
-- Check all fields and related data integrity

-- Step 1: Check the user record
SELECT 
    id,
    email,
    org_id,
    role,
    created_at,
    auth_user_id,
    otp_verified,
    first_name,
    updated_at
FROM users 
WHERE email = 'engagehubonline@gmail.com';

-- Step 2: Check the auth.users record
SELECT 
    id,
    email,
    created_at,
    updated_at,
    email_confirmed_at,
    phone_confirmed_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'engagehubonline@gmail.com';

-- Step 3: Check the organization record
SELECT 
    id,
    name,
    plan,
    created_at,
    updated_at
FROM organizations 
WHERE id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- Step 4: Check onboarding status (using validator)
-- This should show the actual onboarding state based on data
SELECT 
    o.id as org_id,
    o.name as org_name,
    o.onboarding_completed,
    o.onboarding_version,
    o.website_url,
    o.business_description,
    o.target_audiences,
    o.keyword_settings,
    o.content_defaults,
    o.created_at,
    o.updated_at
FROM organizations o
WHERE o.id = 'c4506850-7afc-4929-963b-6da922ff36d0';

-- Step 5: Check if any activities were logged
SELECT 
    id,
    organization_id,
    user_id,
    activity_type,
    activity_data,
    created_at
FROM activities 
WHERE user_id = '6bfe4559-57fc-44fa-a211-72cc2e4ce393'
ORDER BY created_at DESC;
