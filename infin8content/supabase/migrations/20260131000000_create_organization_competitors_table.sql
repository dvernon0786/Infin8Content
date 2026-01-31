-- Create organization_competitors table
-- Story 33.3: Configure Competitor URLs for Analysis

-- Create the table for storing competitor URLs per organization
CREATE TABLE IF NOT EXISTS organization_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  domain TEXT NOT NULL, -- Extracted and normalized domain
  name TEXT, -- Optional competitor name
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_url CHECK (url ~* '^https?://[^\s/$.?#].[^\s]*$'),
  CONSTRAINT org_domain_unique UNIQUE(organization_id, domain)
);

-- Enable Row Level Security
ALTER TABLE organization_competitors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization isolation
DROP POLICY IF EXISTS "org_isolation_select" ON organization_competitors;
CREATE POLICY org_isolation_select ON organization_competitors
  FOR SELECT USING (
    organization_id = public.get_auth_user_org_id()
  );

DROP POLICY IF EXISTS "org_isolation_insert" ON organization_competitors;
CREATE POLICY org_isolation_insert ON organization_competitors
  FOR INSERT WITH CHECK (
    organization_id = public.get_auth_user_org_id()
  );

DROP POLICY IF EXISTS "org_isolation_update" ON organization_competitors;
CREATE POLICY org_isolation_update ON organization_competitors
  FOR UPDATE USING (
    organization_id = public.get_auth_user_org_id()
  );

DROP POLICY IF EXISTS "org_isolation_delete" ON organization_competitors;
CREATE POLICY org_isolation_delete ON organization_competitors
  FOR DELETE USING (
    organization_id = public.get_auth_user_org_id()
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_competitors_org_id ON organization_competitors(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_competitors_domain ON organization_competitors(domain);
CREATE INDEX IF NOT EXISTS idx_org_competitors_active ON organization_competitors(is_active) WHERE is_active = true;

-- Trigger to update updated_at timestamp
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_organization_competitors_updated_at ON organization_competitors;
CREATE TRIGGER update_organization_competitors_updated_at 
    BEFORE UPDATE ON organization_competitors 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
