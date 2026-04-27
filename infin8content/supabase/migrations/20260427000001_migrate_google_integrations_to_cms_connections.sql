-- Migration: Move Google integrations from blog_config to cms_connections
-- Date: 2026-04-27
-- Purpose: Consolidate all integration credentials in cms_connections table
--          Allows multiple Google properties per org, better RLS policies

-- Step 1: Add 'google_analytics' and 'google_search_console' to platform enum
ALTER TABLE cms_connections
DROP CONSTRAINT check_cms_platform;

ALTER TABLE cms_connections
ADD CONSTRAINT check_cms_platform CHECK (
  platform IN (
    'wordpress', 'webflow', 'shopify', 'ghost', 'notion', 'custom',
    'google_analytics', 'google_search_console'
  )
);

-- Step 2: Create indices for Google integrations
CREATE INDEX IF NOT EXISTS idx_cms_connections_google_analytics
ON cms_connections(org_id) WHERE platform = 'google_analytics';

CREATE INDEX IF NOT EXISTS idx_cms_connections_google_search_console
ON cms_connections(org_id) WHERE platform = 'google_search_console';

-- Step 3: Add comment explaining the new platforms
COMMENT ON TABLE cms_connections IS
'Stores encrypted integration credentials per organization.
Supports: WordPress, Webflow, Shopify, Ghost, Notion, Custom, Google Analytics, Google Search Console.
Credentials stored as encrypted JSONB: non-sensitive fields plaintext, secrets (passwords/tokens/access_tokens) AES-256-GCM encrypted.';

-- Note: Data migration is handled separately in application code (see migrate-google-tokens.ts)
-- This allows for safe schema changes with rollback capability
