-- Add tavily_research_cache table for caching Tavily API research results
-- Story 4a.3: Real-Time Research Per Section (Tavily Integration)

-- ============================================================================
-- Task 4: Create tavily_research_cache table
-- ============================================================================

CREATE TABLE IF NOT EXISTS tavily_research_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    research_query TEXT NOT NULL, -- Normalized query (lowercase, trimmed)
    research_results JSONB NOT NULL DEFAULT '{}'::jsonb, -- Full Tavily API response
    cached_until TIMESTAMP WITH TIME ZONE NOT NULL, -- TTL: 24 hours from created_at
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (organization_id, research_query) -- Unique constraint for upsert operations
);

-- Add table comment
COMMENT ON TABLE tavily_research_cache IS 'Stores Tavily research results with 24-hour cache TTL';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_tavily_cache_org_id ON tavily_research_cache(organization_id);
CREATE INDEX IF NOT EXISTS idx_tavily_cache_query ON tavily_research_cache(research_query);
CREATE INDEX IF NOT EXISTS idx_tavily_cache_cached_until ON tavily_research_cache(cached_until);

-- Create composite index for cache lookups (organization_id + normalized query + cached_until)
CREATE INDEX IF NOT EXISTS idx_tavily_cache_lookup 
ON tavily_research_cache(organization_id, LOWER(research_query), cached_until);

-- Create partial index for expired cache cleanup (more efficient than full index)
CREATE INDEX IF NOT EXISTS idx_tavily_cache_expiry 
ON tavily_research_cache(cached_until) 
WHERE cached_until < NOW();

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_tavily_research_cache_updated_at ON tavily_research_cache;
CREATE TRIGGER update_tavily_research_cache_updated_at
    BEFORE UPDATE ON tavily_research_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS Policies for tavily_research_cache table
-- ============================================================================

ALTER TABLE tavily_research_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their org's cache
DROP POLICY IF EXISTS "Users can view their org's tavily cache" ON tavily_research_cache;
CREATE POLICY "Users can view their org's tavily cache"
ON tavily_research_cache
FOR SELECT
USING (
    organization_id = public.get_auth_user_org_id()
);

-- Policy: Service role can insert/update/delete (for background jobs)
DROP POLICY IF EXISTS "Service role can manage tavily cache" ON tavily_research_cache;
CREATE POLICY "Service role can manage tavily cache"
ON tavily_research_cache
FOR ALL
USING (
    auth.role() = 'service_role'
)
WITH CHECK (
    auth.role() = 'service_role'
);

