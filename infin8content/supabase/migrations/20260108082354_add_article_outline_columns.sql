-- Add outline and section storage columns to articles table
-- Story 4a.2: Section-by-Section Architecture and Outline Generation

-- ============================================================================
-- Task 1: Extend articles table schema for outline and section storage
-- ============================================================================

-- Add outline JSONB column (stores article outline structure)
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS outline JSONB;

-- Add sections JSONB column (stores generated sections with metadata)
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb;

-- Add current_section_index INTEGER column (tracks generation progress)
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS current_section_index INTEGER DEFAULT 0;

-- Add generation timestamps
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS generation_started_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS generation_completed_at TIMESTAMP WITH TIME ZONE;

-- Add error_details JSONB column (for failure tracking)
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS error_details JSONB;

-- Add outline_generation_duration_ms INTEGER column (for performance monitoring)
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS outline_generation_duration_ms INTEGER;

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_articles_outline ON articles USING GIN(outline);
CREATE INDEX IF NOT EXISTS idx_articles_sections ON articles USING GIN(sections);
CREATE INDEX IF NOT EXISTS idx_articles_current_section ON articles(current_section_index);

-- ============================================================================
-- Task 7: Create serp_analyses table for SERP analysis caching
-- ============================================================================

CREATE TABLE IF NOT EXISTS serp_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    analysis_data JSONB NOT NULL,
    cached_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE serp_analyses IS 'Stores SERP analysis results with 7-day cache TTL';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_serp_analyses_org_id ON serp_analyses(organization_id);
CREATE INDEX IF NOT EXISTS idx_serp_analyses_keyword ON serp_analyses(keyword);
CREATE INDEX IF NOT EXISTS idx_serp_analyses_cached_until ON serp_analyses(cached_until);

-- Create composite index for cache lookups (organization_id + keyword + cached_until)
CREATE INDEX IF NOT EXISTS idx_serp_analyses_cache_lookup 
ON serp_analyses(organization_id, LOWER(keyword), cached_until);

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_serp_analyses_updated_at ON serp_analyses;
CREATE TRIGGER update_serp_analyses_updated_at
    BEFORE UPDATE ON serp_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS Policies for serp_analyses table
-- ============================================================================

ALTER TABLE serp_analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their org's SERP analyses
DROP POLICY IF EXISTS "Users can view their org's SERP analyses" ON serp_analyses;
CREATE POLICY "Users can view their org's SERP analyses"
ON serp_analyses
FOR SELECT
USING (
    organization_id = public.get_auth_user_org_id()
);

-- Policy: Users can insert SERP analyses in their organization
DROP POLICY IF EXISTS "Users can insert SERP analyses in their organization" ON serp_analyses;
CREATE POLICY "Users can insert SERP analyses in their organization"
ON serp_analyses
FOR INSERT
WITH CHECK (
    organization_id = public.get_auth_user_org_id()
);

-- Policy: Users can update their org's SERP analyses (for cache hits)
DROP POLICY IF EXISTS "Users can update their org's SERP analyses" ON serp_analyses;
CREATE POLICY "Users can update their org's SERP analyses"
ON serp_analyses
FOR UPDATE
USING (
    organization_id = public.get_auth_user_org_id()
)
WITH CHECK (
    organization_id = public.get_auth_user_org_id()
);

