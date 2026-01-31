-- Add admin role to users table
-- Story 33-4: Enable Intent Engine Feature Flag
-- This migration adds 'admin' as a valid role in the users table

-- Drop the existing check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the updated check constraint that includes admin role
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('owner', 'admin', 'editor', 'viewer'));

-- Add comment about the admin role
COMMENT ON COLUMN users.role IS 'User role: owner (full access), admin (feature flags), editor (content), viewer (read-only)';
