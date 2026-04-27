-- ============================================================
-- Migration: add_llm_visibility
-- LLM Brand Visibility Tracker — full schema
-- ============================================================

-- ----------------------------------------------------------
-- 1. llm_visibility_projects
--    One per brand being tracked per org
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS llm_visibility_projects (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  brand_name          TEXT NOT NULL,
  website_url         TEXT NOT NULL,
  brand_aliases       TEXT[] DEFAULT '{}',           -- alternate names / spellings
  business_description TEXT,
  website_crawl_data  JSONB,                          -- scraped content from Tavily
  competitors         JSONB DEFAULT '[]',             -- [{ name, domain }]
  models              TEXT[] DEFAULT ARRAY['openai/gpt-4o-mini','perplexity/sonar','anthropic/claude-3-5-haiku'],
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE llm_visibility_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "llm_vp_select" ON llm_visibility_projects FOR SELECT USING (organization_id::text = auth.jwt() ->> 'org_id');
CREATE POLICY "llm_vp_insert" ON llm_visibility_projects FOR INSERT WITH CHECK (organization_id::text = auth.jwt() ->> 'org_id');
CREATE POLICY "llm_vp_update" ON llm_visibility_projects FOR UPDATE USING (organization_id::text = auth.jwt() ->> 'org_id');
CREATE POLICY "llm_vp_delete" ON llm_visibility_projects FOR DELETE USING (organization_id::text = auth.jwt() ->> 'org_id');

-- ----------------------------------------------------------
-- 2. llm_visibility_prompts
--    Tracking queries per project
-- ----------------------------------------------------------
CREATE TYPE llm_prompt_category AS ENUM ('informational', 'commercial', 'competitor');

CREATE TABLE IF NOT EXISTS llm_visibility_prompts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES llm_visibility_projects(id) ON DELETE CASCADE,
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prompt_text         TEXT NOT NULL,
  category            llm_prompt_category NOT NULL DEFAULT 'informational',
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE llm_visibility_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "llm_pp_select" ON llm_visibility_prompts FOR SELECT USING (organization_id::text = auth.jwt() ->> 'org_id');
CREATE POLICY "llm_pp_insert" ON llm_visibility_prompts FOR INSERT WITH CHECK (organization_id::text = auth.jwt() ->> 'org_id');
CREATE POLICY "llm_pp_update" ON llm_visibility_prompts FOR UPDATE USING (organization_id::text = auth.jwt() ->> 'org_id');
CREATE POLICY "llm_pp_delete" ON llm_visibility_prompts FOR DELETE USING (organization_id::text = auth.jwt() ->> 'org_id');

-- ----------------------------------------------------------
-- 3. llm_visibility_runs
--    One row per prompt × model × date
-- ----------------------------------------------------------
CREATE TYPE llm_mention_position AS ENUM ('list', 'paragraph', 'recommendation', 'table', 'not_found');
CREATE TYPE llm_sentiment AS ENUM ('positive', 'neutral', 'negative');

CREATE TABLE IF NOT EXISTS llm_visibility_runs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES llm_visibility_projects(id) ON DELETE CASCADE,
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prompt_id           UUID NOT NULL REFERENCES llm_visibility_prompts(id) ON DELETE CASCADE,
  article_id          UUID REFERENCES articles(id) ON DELETE SET NULL, -- feedback loop
  model               TEXT NOT NULL,
  run_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  raw_response        TEXT,
  mentioned           BOOLEAN NOT NULL DEFAULT FALSE,
  position            llm_mention_position DEFAULT 'not_found',
  sentiment           llm_sentiment,
  cited_urls          TEXT[] DEFAULT '{}',
  competitor_mentions JSONB DEFAULT '{}',             -- { "CompetitorName": true/false }
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (prompt_id, model, run_date)               -- idempotency
);

CREATE INDEX idx_llm_runs_project_date ON llm_visibility_runs(project_id, run_date DESC);
CREATE INDEX idx_llm_runs_prompt ON llm_visibility_runs(prompt_id);

ALTER TABLE llm_visibility_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "llm_pr_select" ON llm_visibility_runs FOR SELECT USING (organization_id::text = auth.jwt() ->> 'org_id');

-- ----------------------------------------------------------
-- 4. llm_visibility_snapshots
--    Daily aggregated rollup per project — what the dashboard reads
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS llm_visibility_snapshots (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              UUID NOT NULL REFERENCES llm_visibility_projects(id) ON DELETE CASCADE,
  organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  visibility_score        NUMERIC(5,2) DEFAULT 0,     -- % of runs where brand appeared
  total_mentions          INTEGER DEFAULT 0,
  total_runs              INTEGER DEFAULT 0,
  sentiment_positive      INTEGER DEFAULT 0,
  sentiment_neutral       INTEGER DEFAULT 0,
  sentiment_negative      INTEGER DEFAULT 0,
  kpi_ai_search           NUMERIC(5,2) DEFAULT 0,     -- % commercial prompts with mention
  frequency_label         TEXT DEFAULT 'RARE',         -- RARE / MODERATE / FREQUENT
  per_model_stats         JSONB DEFAULT '{}',          -- { "gpt-4o": { visibility, mentions } }
  competitor_sov          JSONB DEFAULT '{}',          -- { "CompName": { score, delta } }
  total_volume            NUMERIC DEFAULT 0,           -- weighted volume proxy
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (project_id, snapshot_date)
);

CREATE INDEX idx_llm_snapshots_project_date ON llm_visibility_snapshots(project_id, snapshot_date DESC);

ALTER TABLE llm_visibility_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "llm_ps_select" ON llm_visibility_snapshots FOR SELECT USING (organization_id::text = auth.jwt() ->> 'org_id');

-- ----------------------------------------------------------
-- 5. Updated_at trigger for projects
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION update_llm_vp_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_llm_vp_updated_at
  BEFORE UPDATE ON llm_visibility_projects
  FOR EACH ROW EXECUTE FUNCTION update_llm_vp_updated_at();
