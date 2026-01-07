-- Add articles table for article generation
-- Story 4a.1: Article Generation Initiation and Queue Setup

-- ============================================================================
-- Task 1: Create articles table
-- ============================================================================

CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT,
    keyword TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('queued', 'generating', 'completed', 'failed', 'cancelled')),
    target_word_count INTEGER NOT NULL,
    writing_style TEXT,
    target_audience TEXT,
    custom_instructions TEXT,
    inngest_event_id TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE articles IS 'Stores article generation requests and status';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_articles_org_id ON articles(org_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_org_status ON articles(org_id, status);

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS Policies for articles table
-- ============================================================================

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their org's articles
DROP POLICY IF EXISTS "Users can view their org's articles" ON articles;
CREATE POLICY "Users can view their org's articles"
ON articles
FOR SELECT
USING (
    org_id = public.get_auth_user_org_id()
);

-- Policy: Users can create articles in their organization
DROP POLICY IF EXISTS "Users can create articles in their organization" ON articles;
CREATE POLICY "Users can create articles in their organization"
ON articles
FOR INSERT
WITH CHECK (
    org_id = public.get_auth_user_org_id()
);

-- Policy: Users can update articles they created (or based on role)
DROP POLICY IF EXISTS "Users can update their org's articles" ON articles;
CREATE POLICY "Users can update their org's articles"
ON articles
FOR UPDATE
USING (
    org_id = public.get_auth_user_org_id()
)
WITH CHECK (
    org_id = public.get_auth_user_org_id()
);

