-- Initial schema migration for Infin8Content
-- Creates foundational tables: organizations and users
-- Multi-tenant architecture with org_id foreign keys

-- ============================================================================
-- Task 3: Create organizations table
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Organizations table: Multi-tenant organization table with plan-based feature gating
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'agency')),
    white_label_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE organizations IS 'Multi-tenant organization table with plan-based feature gating';

-- Create index on id (primary key already has index, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_organizations_id ON organizations(id);

-- Create trigger to automatically update updated_at on row updates
-- Drop trigger if exists to make migration idempotent
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Task 4: Create users table
-- ============================================================================

-- Users table: User table linked to organizations with RBAC roles
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE users IS 'User table linked to organizations with RBAC roles';

-- Create index on org_id for efficient multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);

-- Create unique index on email (already unique constraint, but explicit index for performance)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

