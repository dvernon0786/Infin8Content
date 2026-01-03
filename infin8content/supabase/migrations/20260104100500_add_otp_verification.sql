-- Add OTP verification support
-- Creates otp_codes table for storing OTP codes sent via Brevo
-- Adds otp_verified column to users table to track OTP verification status

-- Create otp_codes table for temporary OTP storage
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on user_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON otp_codes(user_id);

-- Add index on email for efficient lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);

-- Add index on code for verification lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_code ON otp_codes(code);

-- Add index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- Add otp_verified column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT FALSE;

-- Create index on otp_verified for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_otp_verified ON users(otp_verified);

-- Add comments
COMMENT ON TABLE otp_codes IS 'Temporary storage for OTP codes sent via Brevo email service';
COMMENT ON COLUMN users.otp_verified IS 'Tracks whether user has verified their email via OTP';

-- Function to clean up expired OTP codes (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM otp_codes
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

