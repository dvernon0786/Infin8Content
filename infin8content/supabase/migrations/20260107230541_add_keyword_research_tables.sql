-- Add keyword research tables and supporting tables for usage tracking
-- Story 3.1: Keyword Research Interface and DataForSEO Integration
-- Also creates usage_tracking and api_costs tables (Epic 10.1, 10.7)

-- ============================================================================
-- Task 2: Create keyword_researches table
-- ============================================================================

CREATE TABLE IF NOT EXISTS keyword_researches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    results JSONB NOT NULL DEFAULT '{}'::jsonb,
    api_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    cached_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE keyword_researches IS 'Stores keyword research results with 7-day cache TTL';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_keyword_researches_org_id ON keyword_researches(organization_id);
CREATE INDEX IF NOT EXISTS idx_keyword_researches_keyword ON keyword_researches(keyword);
CREATE INDEX IF NOT EXISTS idx_keyword_researches_cached_until ON keyword_researches(cached_until);

-- Create composite index for cache lookups (organization_id + keyword + cached_until)
CREATE INDEX IF NOT EXISTS idx_keyword_researches_cache_lookup 
ON keyword_researches(organization_id, LOWER(keyword), cached_until);

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_keyword_researches_updated_at ON keyword_researches;
CREATE TRIGGER update_keyword_researches_updated_at
    BEFORE UPDATE ON keyword_researches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Task 2: Create usage_tracking table (Epic 10.1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 0,
    billing_period TEXT NOT NULL, -- Format: YYYY-MM
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, metric_type, billing_period)
);

-- Add table comment
COMMENT ON TABLE usage_tracking IS 'Tracks usage metrics per organization per billing period (Epic 10.1)';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_usage_tracking_org_id ON usage_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_metric_type ON usage_tracking(metric_type);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_billing_period ON usage_tracking(billing_period);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_lookup 
ON usage_tracking(organization_id, metric_type, billing_period);

-- ============================================================================
-- Task 2: Create api_costs table (Epic 10.7)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    service TEXT NOT NULL, -- 'dataforseo', 'tavily', 'openrouter'
    operation TEXT NOT NULL, -- 'keyword_research', 'article_generation', etc.
    cost DECIMAL(10, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE api_costs IS 'Tracks API costs per organization for cost monitoring (Epic 10.7)';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_api_costs_org_id ON api_costs(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_costs_service ON api_costs(service);
CREATE INDEX IF NOT EXISTS idx_api_costs_created_at ON api_costs(created_at);

-- ============================================================================
-- RLS Policies for keyword_researches table
-- ============================================================================

ALTER TABLE keyword_researches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their org's research
DROP POLICY IF EXISTS "Users can view their org's research" ON keyword_researches;
CREATE POLICY "Users can view their org's research"
ON keyword_researches
FOR SELECT
USING (
    organization_id = public.get_auth_user_org_id()
);

-- Policy: Users can insert research
DROP POLICY IF EXISTS "Users can insert research" ON keyword_researches;
CREATE POLICY "Users can insert research"
ON keyword_researches
FOR INSERT
WITH CHECK (
    organization_id = public.get_auth_user_org_id()
);

-- Policy: Users can update their org's research (for cache hits)
DROP POLICY IF EXISTS "Users can update their org's research" ON keyword_researches;
CREATE POLICY "Users can update their org's research"
ON keyword_researches
FOR UPDATE
USING (
    organization_id = public.get_auth_user_org_id()
)
WITH CHECK (
    organization_id = public.get_auth_user_org_id()
);

-- ============================================================================
-- RLS Policies for usage_tracking table
-- ============================================================================

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their org's usage tracking
DROP POLICY IF EXISTS "Users can view their org's usage tracking" ON usage_tracking;
CREATE POLICY "Users can view their org's usage tracking"
ON usage_tracking
FOR SELECT
USING (
    organization_id = public.get_auth_user_org_id()
);

-- Policy: Service role can insert/update usage tracking (via API routes)
-- Note: API routes use service role client, so no INSERT/UPDATE policies needed for users
-- But we add SELECT policy so users can view their usage

-- ============================================================================
-- RLS Policies for api_costs table
-- ============================================================================

ALTER TABLE api_costs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their org's API costs
DROP POLICY IF EXISTS "Users can view their org's API costs" ON api_costs;
CREATE POLICY "Users can view their org's API costs"
ON api_costs
FOR SELECT
USING (
    organization_id = public.get_auth_user_org_id()
);

-- Policy: Service role can insert API costs (via API routes)
-- Note: API routes use service role client, so no INSERT policy needed for users

