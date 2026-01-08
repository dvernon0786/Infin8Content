-- Add updated_at column to users table if missing
-- Fixes missing updated_at column that should exist based on initial schema

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON COLUMN public.users.updated_at IS 'Last update timestamp (auto-updated on row updates)';

