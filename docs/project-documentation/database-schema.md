# Infin8Content Database Schema Documentation

*Last Updated: 2026-02-20*  
*System Version: v2.1.0 - Zero-Legacy FSM Architecture*

## Overview

The Infin8Content database is built on PostgreSQL with Supabase, utilizing Row Level Security (RLS) for multi-tenant data isolation. The schema follows a zero-legacy normalized design optimized for the 9-step content generation workflow and SEO operations.

**Key Features:**
- **Zero-Legacy Design**: No `status`, `current_step`, or `step_*_completed_at` columns
- **FSM State Machine**: Single `state` enum for workflow management
- **Organization Isolation**: RLS policies enforce multi-tenant security
- **Audit Trail**: WORM-compliant logging for all operations
- **Performance Optimized**: Comprehensive indexing strategy

## Core Tables

### 1. Organizations
Multi-tenant container with onboarding configuration.

```sql
organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter',
  stripe_customer_id TEXT,
  
  -- Onboarding System (Epic A)
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
)
```

**Purpose**: Organization-based multi-tenancy, subscription management, and onboarding state.

**Key Fields:**
- `keyword_settings`: Geo-targeting and language configuration for DataForSEO
- `onboarding_completed`: Primary gate for system access
- `blog_config`: Content generation preferences

### 2. Users
User accounts with organization memberships.

```sql
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  organization_id UUID REFERENCES organizations(id),
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Purpose**: Authentication and user management within organizations.

### 3. Intent Workflows
Core workflow engine with FSM state management.

```sql
intent_workflows (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  
  -- FSM State (Zero-Legacy Design)
  state TEXT NOT NULL DEFAULT 'step_1_icp',
  CONSTRAINT valid_workflow_state CHECK (state IN (
    'step_1_icp', 'step_2_competitors', 'step_3_seeds', 'step_4_longtails',
    'step_5_filtering', 'step_6_clustering', 'step_7_validation',
    'step_8_subtopics', 'step_9_articles', 'completed', 'cancelled'
  )),
  
  -- Workflow metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Purpose**: 9-step deterministic content creation workflow.

**FSM States:**
```
step_1_icp → step_2_competitors → step_3_seeds → step_4_longtails 
→ step_5_filtering → step_6_clustering → step_7_validation 
→ step_8_subtopics → step_9_articles → completed
```

### 4. Keywords
Hub-and-spoke keyword hierarchy with AI metadata.

```sql
keywords (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  workflow_id UUID REFERENCES intent_workflows(id),
  
  -- Keyword Hierarchy
  parent_seed_keyword_id UUID REFERENCES keywords(id),
  keyword TEXT NOT NULL,
  seed_keyword TEXT,
  
  -- SEO Metrics (DataForSEO)
  search_volume INTEGER DEFAULT 0,
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),
  competition_index INTEGER DEFAULT 0,
  keyword_difficulty INTEGER DEFAULT 0,
  cpc DECIMAL(10, 2),
  
  -- Processing Status
  longtail_status TEXT DEFAULT 'not_started' CHECK (longtail_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  subtopics_status TEXT DEFAULT 'not_started' CHECK (subtopics_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  article_status TEXT DEFAULT 'not_started' CHECK (article_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  
  -- AI Decision Metadata
  detected_language TEXT,
  is_foreign_language BOOLEAN DEFAULT false,
  main_intent TEXT,
  is_navigational BOOLEAN DEFAULT false,
  foreign_intent TEXT,
  ai_suggested BOOLEAN DEFAULT false,
  user_selected BOOLEAN DEFAULT false,
  decision_confidence DECIMAL,
  selection_source TEXT,
  selection_timestamp TIMESTAMP WITH TIME ZONE,
  
  -- Subtopics (JSONB Array)
  subtopics JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, keyword)
)
```

**Purpose**: Hub-and-spoke keyword model with comprehensive AI metadata.

**Key Features:**
- Self-referencing hierarchy for seed → longtail relationships
- AI-powered decision tracking and confidence scoring
- Multi-language support with foreign language detection
- Subtopic storage as JSONB arrays

### 5. Articles
Generated content with section-by-section tracking.

```sql
articles (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  workflow_id UUID REFERENCES intent_workflows(id),
  keyword_id UUID REFERENCES keywords(id),
  
  -- Article Metadata
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  content TEXT,
  html_content TEXT,
  word_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 0,
  
  -- Generation Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'ready', 'published', 'failed')),
  quality_score DECIMAL,
  outline JSONB DEFAULT '[]',
  
  -- Publishing
  published_at TIMESTAMP WITH TIME ZONE,
  wordpress_post_id INTEGER,
  wordpress_url TEXT,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Purpose**: Article generation, quality tracking, and publishing management.

### 6. Article Sections
Fine-grained section tracking for generation progress.

```sql
article_sections (
  id UUID PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  
  -- Section Structure
  section_type TEXT NOT NULL, -- 'h2', 'h3', 'content'
  title TEXT,
  order_index INTEGER NOT NULL,
  content TEXT,
  html_content TEXT,
  
  -- Generation Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  word_count INTEGER DEFAULT 0,
  quality_score DECIMAL,
  
  -- Research Data
  research_data JSONB DEFAULT '{}',
  citations JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Purpose**: Section-by-section generation tracking and research data storage.

### 7. Topic Clusters
Hub-and-spoke topic clustering relationships.

```sql
topic_clusters (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id),
  hub_keyword_id UUID NOT NULL REFERENCES keywords(id),
  spoke_keyword_id UUID NOT NULL REFERENCES keywords(id),
  similarity_score DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workflow_id, spoke_keyword_id)
)
```

**Purpose**: Semantic clustering of keywords into hub-and-spoke structures.

### 8. Organization Competitors
Competitor URL management with normalization.

```sql
organization_competitors (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  name TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, normalized_url)
)
```

**Purpose**: Competitor tracking with URL normalization to prevent duplicates.

### 9. Intent Approvals
Human approval workflow for governance.

```sql
intent_approvals (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  workflow_id UUID REFERENCES intent_workflows(id),
  
  -- Approval Target
  entity_type TEXT NOT NULL, -- 'workflow', 'keyword'
  entity_id UUID NOT NULL,
  approval_type TEXT NOT NULL, -- 'seeds', 'subtopics'
  
  -- Approval Decision
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  feedback TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, entity_type, entity_id, approval_type)
)
```

**Purpose**: Human-in-the-loop approval tracking for governance.

### 10. Intent Audit Logs
WORM-compliant audit trail for compliance.

```sql
intent_audit_logs (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  
  -- Audit Action
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  
  -- Request Metadata
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Purpose**: Immutable audit logging for compliance and debugging.

### 11. Usage Tracking
Per-organization usage metrics for billing.

```sql
usage_tracking (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  metric_type TEXT NOT NULL, -- 'article_generation', 'api_calls', etc.
  billing_period TEXT NOT NULL, -- '2026-02'
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, metric_type, billing_period)
)
```

**Purpose**: Usage-based billing and analytics.

### 12. Publish References
Idempotent publishing tracking.

```sql
publish_references (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  article_id UUID NOT NULL REFERENCES articles(id),
  platform TEXT NOT NULL, -- 'wordpress'
  platform_id TEXT, -- WordPress post ID
  platform_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, article_id, platform)
)
```

**Purpose**: Idempotent publishing to prevent duplicate posts.

## Indexing Strategy

### Performance Indexes
```sql
-- Workflow state queries
CREATE INDEX idx_workflows_state ON intent_workflows(state);
CREATE INDEX idx_workflows_organization_state ON intent_workflows(organization_id, state);

-- Keyword lookups
CREATE INDEX idx_keywords_organization_id ON keywords(organization_id);
CREATE INDEX idx_keywords_workflow_id ON keywords(workflow_id);
CREATE INDEX idx_keywords_parent_seed ON keywords(parent_seed_keyword_id);
CREATE INDEX idx_keywords_search_volume ON keywords(search_volume DESC);

-- Status tracking
CREATE INDEX idx_keywords_longtail_status ON keywords(longtail_status) WHERE longtail_status != 'completed';
CREATE INDEX idx_keywords_subtopics_status ON keywords(subtopics_status) WHERE subtopics_status != 'completed';
CREATE INDEX idx_keywords_article_status ON keywords(article_status) WHERE article_status != 'completed';

-- Article queries
CREATE INDEX idx_articles_organization_id ON articles(organization_id);
CREATE INDEX idx_articles_workflow_id ON articles(workflow_id);
CREATE INDEX idx_articles_keyword_id ON articles(keyword_id);
CREATE INDEX idx_articles_status ON articles(status);

-- Audit log queries
CREATE INDEX idx_audit_logs_organization_id ON intent_audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON intent_audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON intent_audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON intent_audit_logs(created_at DESC);
```

## Row Level Security (RLS)

### Security Policies
All tables enforce organization-based isolation:

```sql
-- Example RLS Policy for keywords
CREATE POLICY keywords_org_access ON keywords
  FOR ALL
  USING (organization_id = public.get_auth_user_org_id())
  WITH CHECK (organization_id = public.get_auth_user_org_id());
```

### Security Functions
```sql
-- Get current user's organization ID
CREATE OR REPLACE FUNCTION get_auth_user_org_id()
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id 
  FROM auth.users 
  WHERE id = auth.uid();
$$;
```

## Migration History

### Key Migrations
1. **20260131_create_keywords_table.sql** - Keywords table foundation
2. **20260213_workflow_state_enum.sql** - FSM state implementation
3. **20260215000000_unified_workflow_state_migration.sql** - Zero-legacy conversion
4. **20260215000005_final_fsm_convergence.sql** - Complete FSM convergence

### Zero-Legacy Conversion
The migration from legacy step/status to FSM state enum involved:
- Adding `state` column with enum constraints
- Backfilling existing workflows based on `current_step` and `status`
- Removing legacy columns (`current_step`, `status`, `step_*_completed_at`)
- Updating all application code to use FSM states

## Data Flow Patterns

### Workflow Creation
```
organizations → intent_workflows → keywords → topic_clusters → articles → article_sections
```

### Approval Workflow
```
keywords → intent_approvals (human gate) → workflow progression
```

### Audit Trail
```
All operations → intent_audit_logs (WORM compliant)
```

## Performance Considerations

### Query Optimization
- **Selective Indexing**: Only index columns used in WHERE clauses
- **Partial Indexes**: Status indexes exclude completed items
- **Composite Indexes**: Organization + state for multi-tenant queries

### Scaling Strategies
- **Connection Pooling**: Supabase manages connection pooling
- **Read Replicas**: Consider for analytics-heavy workloads
- **Partitioning**: Consider for large audit_log tables

## Backup and Recovery

### Backup Strategy
- **Daily Backups**: Automated via Supabase
- **Point-in-Time Recovery**: 7-day retention
- **Cross-Region Replication**: For disaster recovery

### Critical Data
- **Organizations**: Core multi-tenant structure
- **Intent Workflows**: FSM state machine
- **Keywords**: SEO data and AI metadata
- **Audit Logs**: Compliance requirements

## Security Features

### Multi-Tenant Isolation
- **RLS Policies**: Enforce organization boundaries
- **JWT Authentication**: User identity verification
- **Organization Context**: Automatic data scoping

### Data Protection
- **Encryption**: At rest and in transit
- **Audit Trail**: Complete operation logging
- **Access Controls**: Role-based permissions

This database schema represents a production-ready, zero-legacy design optimized for the Infin8Content platform's deterministic FSM workflow engine and comprehensive content generation capabilities.
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  organization_id UUID REFERENCES organizations(id),
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Purpose**: User authentication and role-based access control.

### 3. Organization Competitors
Competitor URLs for analysis.

```sql
organization_competitors (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, url)
)
```

**Purpose**: Store competitor URLs for seed keyword extraction.

### 4. Keywords
Central keyword management table supporting the hub-and-spoke SEO model.

```sql
keywords (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  competitor_url_id UUID REFERENCES organization_competitors(id),
  parent_seed_keyword_id UUID REFERENCES keywords(id),
  seed_keyword TEXT,
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),
  competition_index INTEGER DEFAULT 0,
  keyword_difficulty INTEGER DEFAULT 0,
  cpc DECIMAL(10, 2),
  longtail_status TEXT DEFAULT 'not_started' CHECK (longtail_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  subtopics_status TEXT DEFAULT 'not_started' CHECK (subtopics_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  article_status TEXT DEFAULT 'not_started' CHECK (article_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  subtopics JSONB,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Purpose**: Core keyword data with workflow status tracking.

**Key Features**:
- Self-referencing for parent-child relationships (seed → longtail)
- Status tracking for each workflow stage
- JSONB storage for subtopics
- Vector embedding support for semantic clustering

### 5. Intent Workflows
Orchestration container for content creation workflows.

```sql
intent_workflows (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'step_1_icp' CHECK (status IN (
    'step_1_icp', 'step_2_competitors', 'step_3_seeds', 'step_4_longtails',
    'step_5_filtering', 'step_6_clustering', 'step_7_validation', 'step_8_subtopics',
    'step_9_articles', 'completed', 'failed'
  )),
  icp_analysis JSONB,
  competitor_analysis JSONB,
  seed_extraction JSONB,
  longtail_expansion JSONB,
  keyword_filtering JSONB,
  topic_clustering JSONB,
  cluster_validation JSONB,
  subtopic_generation JSONB,
  article_generation JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Purpose**: Workflow state management and progress tracking.

**Key Features**:
- Step-by-step status tracking
- JSONB storage for workflow metadata
- Organization isolation via RLS

### 6. Topic Clusters
Semantic clustering results for hub-and-spoke content structure.

```sql
topic_clusters (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id),
  hub_keyword_id UUID NOT NULL REFERENCES keywords(id),
  spoke_keyword_id UUID NOT NULL REFERENCES keywords(id),
  similarity_score DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workflow_id, spoke_keyword_id)
)
```

**Purpose**: Store semantic relationships between keywords.

### 7. Cluster Validation Results
Validation outcomes for topic clusters.

```sql
cluster_validation_results (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id),
  hub_keyword_id UUID NOT NULL REFERENCES keywords(id),
  validation_status TEXT NOT NULL CHECK (validation_status IN ('valid', 'invalid')),
  avg_similarity DECIMAL,
  spoke_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workflow_id, hub_keyword_id)
)
```

**Purpose**: Quality control for topic clusters.

### 8. Intent Approvals
Human approval records for governance.

```sql
intent_approvals (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES intent_workflows(id),
  keyword_id UUID REFERENCES keywords(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('workflow', 'keyword')),
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  feedback TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Purpose**: Audit trail for human decisions.

### 9. Articles
Generated content with workflow linkage.

```sql
articles (
  id UUID PRIMARY KEY,
  keyword_id UUID REFERENCES keywords(id),
  workflow_id UUID REFERENCES intent_workflows(id),
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'generating', 'completed', 'failed', 'published')),
  word_count INTEGER,
  quality_score DECIMAL,
  citations JSONB,
  metadata JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Purpose**: Store generated articles with quality metrics.

### 10. Intent Audit Logs
Comprehensive audit trail for compliance.

```sql
intent_audit_logs (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES intent_workflows(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Purpose**: Security audit and compliance tracking.

### 11. Usage Tracking
Subscription-based usage limits.

```sql
usage_tracking (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  metric_type TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, metric_type, billing_period)
)
```

**Purpose**: Plan limit enforcement and billing.

### 12. Rate Limits
API rate limiting for external services.

```sql
rate_limits (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  service TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  requests_made INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, service, endpoint)
)
```

**Purpose**: External API rate limit management.

## Key Relationships

### Workflow Hierarchy
```
Organizations → Intent Workflows → Keywords → Articles
```

### Keyword Relationships
```
Seed Keywords ← parent_seed_keyword_id → Long-tail Keywords
Keywords → Topic Clusters → Cluster Validation
```

### Approval Flow
```
Workflows/Keywords → Intent Approvals → Audit Logs
```

## Security Features

### Row Level Security (RLS)
All tables implement RLS policies using `get_auth_user_org_id()` function for organization isolation.

### Audit Trail
Comprehensive logging via `intent_audit_logs` table with IP tracking and user agent recording.

### Data Validation
Check constraints ensure data integrity for status fields and enumerated values.

## Performance Optimizations

### Indexes
- Organization-based indexes for multi-tenant queries
- Status-based partial indexes for workflow filtering
- Search volume indexes for keyword sorting
- Unique constraints for data integrity

### JSONB Storage
Workflow metadata stored as JSONB for flexible schema evolution while maintaining queryability.

### Vector Support
Embedding vectors enable semantic similarity calculations for clustering.

## Migration Strategy

### Version Control
All migrations are timestamped and include rollback considerations.

### Idempotency
Migrations use `IF NOT EXISTS` and drop/recreate patterns for safe re-runs.

### Backward Compatibility
Schema changes maintain compatibility with existing application code.

## Data Retention

### Audit Logs
Long-term storage with archival tables for compliance requirements.

### Usage Data
Monthly aggregation with historical retention for billing analytics.

### Temporary Data
Background jobs and intermediate results are cleaned up automatically.

## Future Schema Considerations

### Scalability
- Partitioning for large tables (articles, audit_logs)
- Read replicas for analytics queries
- Time-series data for metrics

### Features
- Content versioning and history
- A/B testing framework
- Advanced analytics and reporting
- Content performance tracking
