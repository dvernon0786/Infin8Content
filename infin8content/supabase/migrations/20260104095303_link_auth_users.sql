-- Link Supabase Auth users to users table and make org_id nullable
-- CRITICAL: This migration fixes the schema conflict where org_id was NOT NULL
-- but registration happens BEFORE organization creation (Story 1.6)

-- Make org_id nullable to allow registration before organization creation (Story 1.6)
-- This is REQUIRED - registration will fail if org_id is NOT NULL
ALTER TABLE users
ALTER COLUMN org_id DROP NOT NULL;

-- Add auth_user_id column if not exists
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index on auth_user_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Add comments
COMMENT ON COLUMN users.auth_user_id IS 'Links users table to Supabase Auth auth.users table';
COMMENT ON COLUMN users.org_id IS 'Nullable until organization is created in Story 1.6';

