-- Add unique constraint to prevent duplicate competitors per organization
-- This ensures idempotent competitor ingestion at the database level

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organization_competitors_unique_org_url'
  ) THEN
    ALTER TABLE organization_competitors
    ADD CONSTRAINT organization_competitors_unique_org_url
    UNIQUE (organization_id, url);
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON CONSTRAINT organization_competitors_unique_org_url ON organization_competitors IS 'Prevents duplicate competitor URLs within the same organization';
