# Infin8Content Database Schema Documentation

**Generated:** 2026-02-06  
**Version:** v2.0  
**Database:** PostgreSQL via Supabase

## Overview

The Infin8Content database uses a normalized schema design with strong emphasis on data integrity, security through Row Level Security (RLS), and performance optimization. The schema supports multi-tenancy, audit trails, and complex workflow orchestration.

## Core Tables

### 1. Organizations

Multi-tenant organization management with onboarding state.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  stripe_customer_id TEXT,
  subscription_plan TEXT NOT NULL DEFAULT 'starter',
  subscription_status TEXT NOT NULL DEFAULT 'trialing',
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_version TEXT DEFAULT 'v1',
  website_url TEXT,
  business_description TEXT,
  target_audiences TEXT[],
  blog_config JSONB DEFAULT '{}',
  content_defaults JSONB DEFAULT '{}',
  keyword_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**
- Multi-tenant foundation
- Stripe integration for billing
- Onboarding state tracking
- Flexible configuration via JSONB fields

### 2. Intent Workflows

Master workflow records for the Intent Engine system.

```sql
CREATE TABLE intent_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'step_1_icp_generation',
  icp_document_id UUID,
  current_step TEXT NOT NULL DEFAULT 'step_1_icp_generation',
  step_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, name)
);
```

**Status Flow:**
```
step_1_icp_generation → step_2_competitor_analysis → step_3_seed_keywords → 
step_4_longtails → step_5_filtering → step_6_clustering → step_7_validation → 
step_8_subtopics → step_9_articles → completed
```

### 3. Keywords

Hierarchical keyword structure supporting seed → longtail → subtopics workflow.

```sql
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  workflow_id UUID REFERENCES intent_workflows(id),
  competitor_url_id UUID REFERENCES organization_competitors(id),
  parent_seed_keyword_id UUID REFERENCES keywords(id),
  seed_keyword TEXT,
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),
  competition_index INTEGER DEFAULT 0,
  keyword_difficulty INTEGER DEFAULT 0,
  cpc DECIMAL(10, 2),
  longtail_status TEXT DEFAULT 'not_started',
  subtopics_status TEXT DEFAULT 'not_started',
  article_status TEXT DEFAULT 'not_started',
  subtopics JSONB DEFAULT '[]',
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Status Tracking:**
- `longtail_status`: not_started → in_progress → completed/failed
- `subtopics_status`: not_started → in_progress → completed/failed  
- `article_status`: not_started → in_progress → completed/failed

### 4. Topic Clusters

Hub-and-spoke topic clustering relationships.

```sql
CREATE TABLE topic_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id),
  hub_keyword_id UUID NOT NULL REFERENCES keywords(id),
  spoke_keyword_id UUID NOT NULL REFERENCES keywords(id),
  similarity_score DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workflow_id, spoke_keyword_id)
);
```

**Relationship Pattern:**
- One hub keyword per cluster
- Multiple spoke keywords related to hub
- Semantic similarity scoring for validation

### 5. Cluster Validation Results

Validation outcomes for topic clusters.

```sql
CREATE TABLE cluster_validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id),
  hub_keyword_id UUID NOT NULL REFERENCES keywords(id),
  validation_status TEXT NOT NULL CHECK (validation_status IN ('valid', 'invalid')),
  avg_similarity DECIMAL,
  spoke_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workflow_id, hub_keyword_id)
);
```

### 6. Articles

Generated content with workflow linkage and status tracking.

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  workflow_id UUID REFERENCES intent_workflows(id),
  keyword_id UUID REFERENCES keywords(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  content TEXT,
  html_content TEXT,
  status TEXT DEFAULT 'queued',
  metadata JSONB DEFAULT '{}',
  word_count INTEGER,
  reading_time INTEGER,
  quality_score DECIMAL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Status Flow:**
```
queued → researching → generating → assembling → completed/failed
```

### 7. Article Sections

Section-by-section content storage for granular processing.

```sql
CREATE TABLE article_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id),
  section_index INTEGER NOT NULL,
  section_type TEXT NOT NULL,
  title TEXT,
  content TEXT,
  html_content TEXT,
  research_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id, section_index)
);
```

### 8. Publish References

Idempotent publishing tracking to prevent duplicate publishes.

```sql
CREATE TABLE publish_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id),
  platform TEXT NOT NULL,
  platform_id TEXT,
  platform_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id, platform)
);
```

## System Tables

### 9. Audit Logs

WORM-compliant audit trail for compliance and debugging.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**WORM Compliance:**
- Immutable records (no updates/deletes)
- Complete action tracking
- IP and user agent logging

### 10. Usage Tracking

Plan enforcement and usage metrics.

```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  metric_type TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, metric_type, billing_period)
);
```

**Metric Types:**
- `article_generation`
- `keyword_research`
- `api_calls`
- `storage_usage`

### 11. Intent Approvals

Human approval workflow for governance.

```sql
CREATE TABLE intent_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  decision TEXT NOT NULL,
  decided_by UUID REFERENCES auth.users(id),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, entity_type, entity_id)
);
```

**Entity Types:**
- `keyword`
- `workflow`
- `cluster`

### 12. Organization Competitors

Competitor URL tracking for analysis.

```sql
CREATE TABLE organization_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  analysis_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, url)
);
```

## Security & Access Control

### Row Level Security (RLS)

All tables implement RLS with organization-based scoping:

```sql
-- Example RLS Policy
CREATE POLICY table_name_org_access ON table_name
  FOR ALL
  USING (
    organization_id = public.get_auth_user_org_id()
  )
  WITH CHECK (
    organization_id = public.get_auth_user_org_id()
  );
```

### Security Functions

```sql
-- Get authenticated user's organization ID
CREATE OR REPLACE FUNCTION get_auth_user_org_id()
RETURNS UUID
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT org_id FROM auth.users WHERE id = auth.uid()
$$;
```

## Performance Optimization

### Strategic Indexing

#### Organization-Based Indexes
```sql
CREATE INDEX idx_table_organization_id ON table_name(organization_id);
```

#### Status-Based Indexes
```sql
CREATE INDEX idx_keywords_status ON keywords(status) WHERE status != 'completed';
```

#### Composite Indexes
```sql
CREATE INDEX idx_keywords_org_workflow ON keywords(organization_id, workflow_id);
```

#### Full-Text Search
```sql
CREATE INDEX idx_articles_search ON articles USING gin(to_tsvector('english', title || ' ' || content));
```

### Vector Similarity

For embedding-based semantic search:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Vector similarity index
CREATE INDEX idx_keywords_embedding ON keywords USING ivfflat (embedding vector_cosine_ops);
```

## Migration Strategy

### Migration Naming Convention

```
YYYYMMDD_HHMMSS_descriptive_name.sql
```

### Migration Patterns

#### Idempotent Migrations
```sql
CREATE TABLE IF NOT EXISTS table_name (...);
DROP POLICY IF EXISTS policy_name ON table_name;
```

#### Backward Compatibility
- Add new columns as nullable
- Provide default values
- Update application before adding constraints

#### Rollback Scripts
Each migration includes corresponding rollback capability.

## Data Flow Patterns

### Intent Engine Flow

```
organizations → intent_workflows → keywords → topic_clusters → articles
```

### Multi-Tenancy Flow

```
auth.users → organizations → [all other tables via organization_id]
```

### Audit Flow

```
[all actions] → audit_logs (immutable)
```

## Monitoring & Maintenance

### Health Checks

```sql
-- Table row counts
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables;

-- Index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans
FROM pg_stat_user_indexes;
```

### Performance Monitoring

```sql
-- Slow queries
SELECT 
  query,
  mean_time,
  calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Backup & Recovery

### Backup Strategy
- Daily automated backups via Supabase
- Point-in-time recovery enabled
- Cross-region replication for disaster recovery

### Data Retention
- Audit logs: 7 years (compliance)
- Usage metrics: 2 years
- Content: Retained indefinitely

## Integration Points

### External Service References

- **Stripe:** `organizations.stripe_customer_id`
- **WordPress:** `publish_references.platform_id`
- **DataForSEO:** `keywords.*` (research data)
- **OpenRouter:** `article_sections.research_data`

### Application Layer Integration

- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime subscriptions
- **File Storage:** Supabase Storage
- **Edge Functions:** Supabase Edge Runtime

This database schema provides the foundation for Infin8Content's content generation platform, supporting complex workflows, multi-tenancy, and enterprise-grade security and compliance requirements.
