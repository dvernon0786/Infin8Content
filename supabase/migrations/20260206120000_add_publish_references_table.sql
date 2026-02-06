-- Create publish_references table for idempotent publishing
-- Story C-2: Publish References Table

-- Rollback: DROP TABLE IF EXISTS publish_references;

-- Handle migration from old schema (cms_type) to new schema (platform)
DO $$
BEGIN
    -- Check if table exists with old schema (cms_type column)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'publish_references' 
        AND column_name = 'cms_type'
    ) THEN
        -- Migrate old schema to new schema
        ALTER TABLE publish_references RENAME COLUMN cms_type TO platform;
        ALTER TABLE publish_references RENAME COLUMN published_url TO platform_url;
        
        -- Add platform_post_id column (handle existing data)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'publish_references' 
            AND column_name = 'platform_post_id'
        ) THEN
            ALTER TABLE publish_references ADD COLUMN platform_post_id TEXT;
            UPDATE publish_references SET platform_post_id = '' WHERE platform_post_id IS NULL;
            ALTER TABLE publish_references ALTER COLUMN platform_post_id SET NOT NULL;
        END IF;
        
        -- Add published_at column (handle existing data)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'publish_references' 
            AND column_name = 'published_at'
        ) THEN
            ALTER TABLE publish_references ADD COLUMN published_at TIMESTAMPTZ;
            UPDATE publish_references SET published_at = created_at WHERE published_at IS NULL;
            ALTER TABLE publish_references ALTER COLUMN published_at SET NOT NULL;
        END IF;
        
        -- Drop old columns if they exist in wrong format
        ALTER TABLE publish_references DROP COLUMN IF EXISTS external_id;
        ALTER TABLE publish_references DROP COLUMN IF EXISTS updated_at;
        
        -- Add constraints if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.check_constraints 
            WHERE constraint_name = 'check_platform'
        ) THEN
            ALTER TABLE publish_references ADD CONSTRAINT check_platform 
                CHECK (platform IN ('wordpress'));
        END IF;
    ELSE
        -- Create fresh table with correct schema
        CREATE TABLE IF NOT EXISTS publish_references (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
            platform TEXT NOT NULL CHECK (platform IN ('wordpress')),
            platform_post_id TEXT NOT NULL,
            platform_url TEXT NOT NULL,
            published_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now(),
            UNIQUE (article_id, platform),
            UNIQUE (platform, platform_post_id)
        );
    END IF;
END $$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_publish_references_article_id ON publish_references(article_id);
CREATE INDEX IF NOT EXISTS idx_publish_references_platform ON publish_references(platform);

-- RLS: Enable row level security (only if table was just created)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'publish_references') THEN
        ALTER TABLE publish_references ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- RLS: Organizations can only view their own publish references
-- This inherits isolation from the articles table
DROP POLICY IF EXISTS "Organizations can view their own publish references" ON publish_references;
CREATE POLICY "Organizations can view their own publish references" ON publish_references
  FOR SELECT USING (
    article_id IN (
      SELECT id FROM articles 
      WHERE org_id = (current_setting('request.jwt.claims', true)::jsonb->>'org_id')::uuid
    )
  );

DROP POLICY IF EXISTS "Organizations can insert their own publish references" ON publish_references;
CREATE POLICY "Organizations can insert their own publish references" ON publish_references
  FOR INSERT WITH CHECK (
    article_id IN (
      SELECT id FROM articles 
      WHERE org_id = (current_setting('request.jwt.claims', true)::jsonb->>'org_id')::uuid
    )
  );

-- Comments for documentation
COMMENT ON TABLE publish_references IS 'Tracks which articles have been published to which platforms for idempotent publishing';
COMMENT ON COLUMN publish_references.platform IS 'Platform name (e.g., wordpress)';
COMMENT ON COLUMN publish_references.platform_post_id IS 'External post ID from the platform';
COMMENT ON COLUMN publish_references.platform_url IS 'Published URL of the article';
COMMENT ON COLUMN publish_references.published_at IS 'When the article was published to the platform';
