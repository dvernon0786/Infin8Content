-- Create cms_connections table for multi-CMS credential management
-- Replaces single WordPress config stored in organizations.blog_config

CREATE TABLE IF NOT EXISTS cms_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  name TEXT,
  credentials JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT check_cms_platform CHECK (
    platform IN ('wordpress', 'webflow', 'shopify', 'ghost', 'notion', 'custom')
  ),
  CONSTRAINT check_cms_status CHECK (status IN ('active', 'inactive'))
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_cms_connections_org_id ON cms_connections(org_id);
CREATE INDEX IF NOT EXISTS idx_cms_connections_org_platform ON cms_connections(org_id, platform);
CREATE INDEX IF NOT EXISTS idx_cms_connections_status ON cms_connections(status);

-- Enable RLS
ALTER TABLE cms_connections ENABLE ROW LEVEL SECURITY;

-- Orgs can only see and modify their own connections
DROP POLICY IF EXISTS "org_access_cms_connections" ON cms_connections;
CREATE POLICY "org_access_cms_connections"
ON cms_connections
FOR ALL
USING (
  org_id = (current_setting('request.jwt.claims', true)::jsonb->>'org_id')::uuid
)
WITH CHECK (
  org_id = (current_setting('request.jwt.claims', true)::jsonb->>'org_id')::uuid
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_cms_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cms_connections_updated_at ON cms_connections;
CREATE TRIGGER cms_connections_updated_at
  BEFORE UPDATE ON cms_connections
  FOR EACH ROW EXECUTE FUNCTION update_cms_connections_updated_at();

COMMENT ON TABLE cms_connections IS 'Stores encrypted CMS credentials per organization. Supports WordPress, Webflow, Shopify, Ghost, Notion, and Custom API.';
COMMENT ON COLUMN cms_connections.credentials IS 'Mixed JSONB: non-sensitive fields plaintext, secrets (passwords/tokens) AES-256-GCM encrypted.';
