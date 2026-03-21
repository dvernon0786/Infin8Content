-- Add publish_references table for backend idempotency
-- This prevents duplicate publishing across all platforms

CREATE TABLE IF NOT EXISTS publish_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'wordpress', 'webflow', etc.
  platform_post_id TEXT, -- WordPress post ID, Webflow item ID, etc.
  platform_url TEXT, -- Full URL to published content
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Critical: Prevent duplicate publishing per article per platform
  UNIQUE (article_id, platform)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_publish_references_article_id ON publish_references(article_id);
CREATE INDEX IF NOT EXISTS idx_publish_references_platform ON publish_references(platform);
CREATE INDEX IF NOT EXISTS idx_publish_references_published_at ON publish_references(published_at);

-- Add RLS policies for multi-tenant security
ALTER TABLE publish_references ENABLE ROW LEVEL SECURITY;

-- Policy: Organizations can only see their own publish references
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'publish_references' 
        AND policyname = 'Organizations can view their own publish references'
    ) THEN
        CREATE POLICY "Organizations can view their own publish references" ON publish_references
          FOR SELECT USING (
            article_id IN (
              SELECT id FROM articles 
              WHERE org_id = auth.uid()
            )
          );
    END IF;
END $$;

-- Policy: Organizations can insert their own publish references
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'publish_references' 
        AND policyname = 'Organizations can insert their own publish references'
    ) THEN
        CREATE POLICY "Organizations can insert their own publish references" ON publish_references
          FOR INSERT WITH CHECK (
            article_id IN (
              SELECT id FROM articles 
              WHERE org_id = auth.uid()
            )
          );
    END IF;
END $$;

-- Policy: Organizations can update their own publish references
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'publish_references' 
        AND policyname = 'Organizations can update their own publish references'
    ) THEN
        CREATE POLICY "Organizations can update their own publish references" ON publish_references
          FOR UPDATE USING (
            article_id IN (
              SELECT id FROM articles 
              WHERE org_id = auth.uid()
            )
          );
    END IF;
END $$;

-- Policy: Organizations can delete their own publish references
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'publish_references' 
        AND policyname = 'Organizations can delete their own publish references'
    ) THEN
        CREATE POLICY "Organizations can delete their own publish references" ON publish_references
          FOR DELETE USING (
            article_id IN (
              SELECT id FROM articles 
              WHERE org_id = auth.uid()
            )
          );
    END IF;
END $$;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_publish_references_updated_at
  BEFORE UPDATE ON publish_references
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE publish_references IS 'Tracks publishing status per article per platform to ensure idempotency';
COMMENT ON COLUMN publish_references.platform IS 'Target platform (wordpress, webflow, etc.)';
COMMENT ON COLUMN publish_references.platform_post_id IS 'Post ID on the target platform';
COMMENT ON COLUMN publish_references.platform_url IS 'Full URL to published content';
