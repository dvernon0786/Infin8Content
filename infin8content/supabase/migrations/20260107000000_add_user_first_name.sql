-- Add first_name field to users table for Story 1.12
-- AC requires "Welcome back, {First Name}" message in dashboard

-- Add first_name column (nullable to support existing users)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name TEXT;

-- Add comment
COMMENT ON COLUMN users.first_name IS 'User first name for personalized greetings';

-- Note: This field is nullable to support existing users.
-- Registration flow can be updated in future stories to capture first_name during signup.

