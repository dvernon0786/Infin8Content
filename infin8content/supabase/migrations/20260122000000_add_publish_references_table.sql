-- Add publish_references table for WordPress publishing
-- Story 5-1: Publish Article to WordPress (Minimal One-Click Export)

-- ============================================================================
-- Task 1: Create publish_references table
-- ============================================================================

CREATE TABLE IF NOT EXISTS publish_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    cms_type TEXT NOT NULL CHECK (cms_type IN ('wordpress')),
    published_url TEXT NOT NULL,
    external_id TEXT, -- WordPress post ID (optional, for reference)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE publish_references IS 'Stores published article references for external CMS platforms';

-- Create unique constraint for idempotency (one publish per article per CMS)
CREATE UNIQUE INDEX IF NOT EXISTS idx_publish_references_unique_article_cms 
ON publish_references(article_id, cms_type);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_publish_references_article_id ON publish_references(article_id);
CREATE INDEX IF NOT EXISTS idx_publish_references_cms_type ON publish_references(cms_type);
CREATE INDEX IF NOT EXISTS idx_publish_references_created_at ON publish_references(created_at DESC);

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_publish_references_updated_at ON publish_references;
CREATE TRIGGER update_publish_references_updated_at
    BEFORE UPDATE ON publish_references
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS Policies for publish_references table
-- ============================================================================

ALTER TABLE publish_references ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their org's publish references
DROP POLICY IF EXISTS "Users can view their org's publish references" ON publish_references;
CREATE POLICY "Users can view their org's publish references"
ON publish_references
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM articles 
        WHERE articles.id = publish_references.article_id 
        AND articles.org_id = public.get_auth_user_org_id()
    )
);

-- Policy: Users can create publish references for their org's articles
DROP POLICY IF EXISTS "Users can create publish references for their org's articles" ON publish_references;
CREATE POLICY "Users can create publish references for their org's articles"
ON publish_references
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM articles 
        WHERE articles.id = publish_references.article_id 
        AND articles.org_id = public.get_auth_user_org_id()
    )
);

-- Policy: Users can update their org's publish references
DROP POLICY IF EXISTS "Users can update their org's publish references" ON publish_references;
CREATE POLICY "Users can update their org's publish references"
ON publish_references
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM articles 
        WHERE articles.id = publish_references.article_id 
        AND articles.org_id = public.get_auth_user_org_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM articles 
        WHERE articles.id = publish_references.article_id 
        AND articles.org_id = public.get_auth_user_org_id()
    )
);
