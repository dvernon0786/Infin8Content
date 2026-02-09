# Infin8Content Database Schema Documentation

## Overview

The Infin8Content database is built on PostgreSQL with Supabase, utilizing Row Level Security (RLS) for multi-tenant data isolation. The schema follows a normalized design optimized for the content generation workflow and SEO operations.

## Core Tables

### 1. Organizations
Multi-tenant container for all user data.

```sql
organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter',
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Purpose**: Organization-based multi-tenancy and subscription management.

### 2. Users
User accounts with organization memberships.

```sql
users (
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
