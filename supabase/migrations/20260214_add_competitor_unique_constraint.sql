-- Add unique constraint to prevent duplicate competitors per organization
-- This ensures idempotent competitor ingestion at the database level

ALTER TABLE organization_competitors
ADD CONSTRAINT IF NOT EXISTS organization_competitors_unique_org_url
UNIQUE (organization_id, url);

-- Add comment for documentation
COMMENT ON CONSTRAINT organization_competitors_unique_org_url ON organization_competitors IS 'Prevents duplicate competitor URLs within the same organization';
