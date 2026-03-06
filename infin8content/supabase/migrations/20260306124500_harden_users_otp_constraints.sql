-- Harden users table with required unique constraints for ON CONFLICT/upsert
-- Also add partial index for high-performance OTP verification

-- 1. Ensure auth_user_id is unique so upsert (ON CONFLICT) logic works in registration
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_auth_user_id_unique'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_auth_user_id_unique UNIQUE (auth_user_id);
    END IF;
END $$;

-- 2. Add high-performance partial index for OTP verification lookup
-- This makes verification constant time by only indexing unverified codes
CREATE INDEX IF NOT EXISTS idx_otp_verification
ON otp_codes (email, code)
WHERE verified_at IS NULL;

-- 3. Add index on expires_at for efficient cleanup jobs
CREATE INDEX IF NOT EXISTS idx_otp_expiry
ON otp_codes (expires_at);

-- 4. Named FK for better error reporting and schema clarity (if not already named)
-- Note: auth_user_id was already REFERENCES auth.users(id) from 20260104095303
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_auth_fk'
    ) THEN
        -- We just add it explicitly if needed, but it may already be there as an anonymous constraint.
        -- Explicitly adding it ensures it matches our strict naming convention.
        -- ALTER TABLE users ADD CONSTRAINT users_auth_fk FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        NULL; -- Skip for now to avoid duplicate FK errors if already present anonymously
    END IF;
END $$;
