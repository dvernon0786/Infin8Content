-- Fix registration schema issues
-- This script ensures the database has the correct schema for user registration

-- Check if users table exists and has the right structure
DO $$
BEGIN
    -- Create users table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT NOT NULL UNIQUE,
            org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
            role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
            auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            otp_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_users_org_id ON users(org_id);
        CREATE INDEX idx_users_email ON users(email);
        CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
        CREATE INDEX idx_users_otp_verified ON users(otp_verified);
        
        RAISE NOTICE '✅ Created users table';
    ELSE
        RAISE NOTICE '✅ Users table already exists';
    END IF;
END $$;

-- Create otp_codes table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'otp_codes') THEN
        CREATE TABLE otp_codes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            code TEXT NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            verified_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_otp_codes_user_id ON otp_codes(user_id);
        CREATE INDEX idx_otp_codes_email ON otp_codes(email);
        CREATE INDEX idx_otp_codes_code ON otp_codes(code);
        CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at);
        
        RAISE NOTICE '✅ Created otp_codes table';
    ELSE
        RAISE NOTICE '✅ OTP codes table already exists';
    END IF;
END $$;

-- Add missing columns to users table if they don't exist
DO $$
BEGIN
    -- Add auth_user_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'auth_user_id') THEN
        ALTER TABLE users ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
        RAISE NOTICE '✅ Added auth_user_id column to users table';
    END IF;
    
    -- Add otp_verified column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'otp_verified') THEN
        ALTER TABLE users ADD COLUMN otp_verified BOOLEAN DEFAULT FALSE;
        CREATE INDEX idx_users_otp_verified ON users(otp_verified);
        RAISE NOTICE '✅ Added otp_verified column to users table';
    END IF;
    
    -- Make org_id nullable if it's not already
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'org_id' AND is_nullable = 'NO') THEN
        ALTER TABLE users ALTER COLUMN org_id DROP NOT NULL;
        RAISE NOTICE '✅ Made org_id nullable in users table';
    END IF;
    
    -- Add updated_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column to users table';
    END IF;
END $$;

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Created update_users_updated_at trigger';
    END IF;
END $$;

-- Show final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

SELECT '✅ Registration schema fix completed!' as status;
