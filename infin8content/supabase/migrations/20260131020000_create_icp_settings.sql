-- Create icp_settings table for Story 33.2
-- Multi-tenant ICP configuration with organization isolation and encryption

-- ============================================================================
-- Enable pgcrypto extension for encryption
-- ============================================================================

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- Encryption/Decryption Functions
-- ============================================================================

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data_to_encrypt TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Use pgcrypto's pgp_sym_encrypt with the provided key
    -- Convert to base64 for safe storage in JSON
    RETURN encode(pgp_sym_encrypt(data_to_encrypt, encryption_key), 'base64');
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Encryption failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Decode from base64 and decrypt using pgcrypto's pgp_sym_decrypt
    RETURN pgp_sym_decrypt(decode(encrypted_data, 'base64'), encryption_key);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Decryption failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Task 2.1: Create icp_settings table with proper constraints
-- ============================================================================

-- ICP settings table: Stores organization ICP configuration with encryption
CREATE TABLE IF NOT EXISTS icp_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    target_industries TEXT[] NOT NULL CHECK (array_length(target_industries, 1) BETWEEN 1 AND 10),
    buyer_roles TEXT[] NOT NULL CHECK (array_length(buyer_roles, 1) BETWEEN 1 AND 10),
    pain_points TEXT[] NOT NULL CHECK (array_length(pain_points, 1) BETWEEN 1 AND 20),
    value_proposition TEXT NOT NULL CHECK (length(trim(value_proposition)) BETWEEN 10 AND 500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    encrypted_data JSONB DEFAULT '{}'::jsonb
);

-- Add table comment
COMMENT ON TABLE icp_settings IS 'Multi-tenant ICP configuration with organization isolation and encrypted sensitive data';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_icp_settings_organization_id ON icp_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_icp_settings_created_by ON icp_settings(created_by);
CREATE INDEX IF NOT EXISTS idx_icp_settings_created_at ON icp_settings(created_at);

-- Create unique constraint: One ICP configuration per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_icp_settings_organization_unique ON icp_settings(organization_id);

-- Create trigger to automatically update updated_at on row updates
-- Drop trigger if exists to make migration idempotent
DROP TRIGGER IF EXISTS update_icp_settings_updated_at ON icp_settings;
CREATE TRIGGER update_icp_settings_updated_at
    BEFORE UPDATE ON icp_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Task 2.2: Add RLS policies for organization isolation
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE icp_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view ICP settings from their own organization
DROP POLICY IF EXISTS "Users can view ICP settings from their organization" ON icp_settings;
CREATE POLICY "Users can view ICP settings from their organization" ON icp_settings
    FOR SELECT USING (
        organization_id = (
            SELECT org_id 
            FROM users 
            WHERE auth_user_id = auth.uid()
            LIMIT 1
        )
    );

-- RLS Policy: Users can only insert ICP settings for their own organization
DROP POLICY IF EXISTS "Users can insert ICP settings for their organization" ON icp_settings;
CREATE POLICY "Users can insert ICP settings for their organization" ON icp_settings
    FOR INSERT WITH CHECK (
        organization_id = (
            SELECT org_id 
            FROM users 
            WHERE auth_user_id = auth.uid()
            LIMIT 1
        )
    );

-- RLS Policy: Users can only update ICP settings from their own organization
DROP POLICY IF EXISTS "Users can update ICP settings from their organization" ON icp_settings;
CREATE POLICY "Users can update ICP settings from their organization" ON icp_settings
    FOR UPDATE USING (
        organization_id = (
            SELECT org_id 
            FROM users 
            WHERE auth_user_id = auth.uid()
            LIMIT 1
        )
    );

-- RLS Policy: Users can only delete ICP settings from their own organization
DROP POLICY IF EXISTS "Users can delete ICP settings from their organization" ON icp_settings;
CREATE POLICY "Users can delete ICP settings from their organization" ON icp_settings
    FOR DELETE USING (
        organization_id = (
            SELECT org_id 
            FROM users 
            WHERE auth_user_id = auth.uid()
            LIMIT 1
        )
    );

-- RLS Policy: Service role bypasses RLS for admin operations
DROP POLICY IF EXISTS "Service role full access" ON icp_settings;
CREATE POLICY "Service role full access" ON icp_settings
    FOR ALL USING (
        pg_has_role('service_role', 'member')
    );

-- ============================================================================
-- Additional constraints and validation
-- ============================================================================

-- Ensure array elements are not empty strings
DO $$ 
BEGIN
    ALTER TABLE icp_settings ADD CONSTRAINT check_icp_target_industries_not_empty 
        CHECK (cardinality(array_remove(target_industries, '')) = array_length(target_industries, 1));
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE icp_settings ADD CONSTRAINT check_icp_buyer_roles_not_empty 
        CHECK (cardinality(array_remove(buyer_roles, '')) = array_length(buyer_roles, 1));
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE icp_settings ADD CONSTRAINT check_icp_pain_points_not_empty 
        CHECK (cardinality(array_remove(pain_points, '')) = array_length(pain_points, 1));
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- Ensure value_proposition is not empty or just whitespace
DO $$ 
BEGIN
    ALTER TABLE icp_settings ADD CONSTRAINT check_icp_value_proposition_not_empty 
        CHECK (length(trim(value_proposition)) > 0);
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- ============================================================================
-- Task 2.3: Audit trigger for ICP settings operations
-- ============================================================================

-- Create function to log ICP settings creation events
CREATE OR REPLACE FUNCTION log_icp_settings_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Log ICP settings creation to audit trail
    INSERT INTO audit_logs (action, user_id, organization_id, details, ip_address, user_agent)
    SELECT 
        'icp.settings.created',
        NEW.created_by,
        NEW.organization_id,
        jsonb_build_object(
            'icp_settings_id', NEW.id,
            'target_industries_count', array_length(NEW.target_industries, 1),
            'buyer_roles_count', array_length(NEW.buyer_roles, 1),
            'pain_points_count', array_length(NEW.pain_points, 1),
            'has_value_proposition', length(trim(NEW.value_proposition)) > 0
        ),
        inet_client_addr(),
        current_setting('request.headers')::jsonb->>'user-agent'
    WHERE EXISTS (SELECT 1 FROM users WHERE id = NEW.created_by);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the insert if audit logging fails
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log ICP settings update events
CREATE OR REPLACE FUNCTION log_icp_settings_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Log ICP settings update to audit trail
    INSERT INTO audit_logs (action, user_id, organization_id, details, ip_address, user_agent)
    SELECT 
        'icp.settings.updated',
        COALESCE(NEW.created_by, OLD.created_by),
        NEW.organization_id,
        jsonb_build_object(
            'icp_settings_id', NEW.id,
            'fields_updated', 
            CASE
                WHEN NEW.target_industries IS DISTINCT FROM OLD.target_industries THEN 'target_industries'
                WHEN NEW.buyer_roles IS DISTINCT FROM OLD.buyer_roles THEN 'buyer_roles'
                WHEN NEW.pain_points IS DISTINCT FROM OLD.pain_points THEN 'pain_points'
                WHEN NEW.value_proposition IS DISTINCT FROM OLD.value_proposition THEN 'value_proposition'
                ELSE 'unknown'
            END
        ),
        inet_client_addr(),
        current_setting('request.headers')::jsonb->>'user-agent'
    WHERE EXISTS (SELECT 1 FROM users WHERE id = COALESCE(NEW.created_by, OLD.created_by));
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the update if audit logging fails
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for ICP settings audit
-- Drop triggers if exists to make migration idempotent
DROP TRIGGER IF EXISTS log_icp_settings_creation_trigger ON icp_settings;
CREATE TRIGGER log_icp_settings_creation_trigger
    AFTER INSERT ON icp_settings
    FOR EACH ROW
    EXECUTE FUNCTION log_icp_settings_creation();

DROP TRIGGER IF EXISTS log_icp_settings_update_trigger ON icp_settings;
CREATE TRIGGER log_icp_settings_update_trigger
    AFTER UPDATE ON icp_settings
    FOR EACH ROW
    EXECUTE FUNCTION log_icp_settings_update();
