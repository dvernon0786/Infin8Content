# Database Schema Documentation

## Overview

Infin8Content uses PostgreSQL via Supabase with Row Level Security (RLS) for multi-tenant data isolation. The database is designed to support the complete content creation workflow with audit trails and performance optimization.

## Database Architecture

### Multi-Tenant Design
- **Organization Isolation**: All tables include `organization_id` for data separation
- **Row Level Security**: RLS policies enforce organization-based access
- **Audit Trail**: Comprehensive logging of all data changes
- **Performance**: Optimized indexes and query patterns

### Key Design Principles
- **Normalized Structure**: Minimized data duplication
- **JSONB Storage**: Flexible metadata storage
- **Vector Support**: Embedding storage for semantic analysis
- **Temporal Tracking**: Created/updated timestamps on all records

## Core Tables

### 1. Organizations
Multi-tenant organization management.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  
  -- Subscription and billing
  plan TEXT NOT NULL DEFAULT 'starter',
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'active',
  
  -- Onboarding state
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_version TEXT DEFAULT 'v1',
  website_url TEXT,
  business_description TEXT,
  target_audiences TEXT[],
  
  -- Configuration (JSONB)
  blog_config JSONB DEFAULT '{}',
  content_defaults JSONB DEFAULT '{}',
  keyword_settings JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_organizations_plan ON organizations(plan);
CREATE INDEX idx_organizations_subscription ON organizations(subscription_status);
CREATE UNIQUE INDEX idx_organizations_slug ON organizations(slug);
```

### 2. Users
User accounts with organization association.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  
  -- Profile
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  
  -- Organization association
  organization_id UUID NOT NULL REFERENCES organizations(id),
  role TEXT NOT NULL DEFAULT 'member',
  
  -- Authentication
  email_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

### 3. Intent Workflows
Core workflow state management.

```sql
CREATE TABLE intent_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Workflow metadata
  name TEXT NOT NULL,
  description TEXT,
  
  -- State management (single source of truth)
  state TEXT NOT NULL DEFAULT 'step_1_icp',
  
  -- Workflow data (JSONB)
  icp_data JSONB,
  competitor_urls TEXT[],
  settings JSONB DEFAULT '{}',
  
  -- Progress tracking
  keywords_count INTEGER DEFAULT 0,
  articles_count INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0.00,
  
  -- Cost tracking
  estimated_cost DECIMAL(10,4) DEFAULT 0.0000,
  actual_cost DECIMAL(10,4) DEFAULT 0.0000,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_workflow_state 
    CHECK (state IN (
      'step_1_icp', 'step_2_competitors', 'step_3_seeds', 
      'step_4_longtails', 'step_5_filtering', 'step_6_clustering',
      'step_7_validation', 'step_8_subtopics', 'step_9_articles',
      'completed', 'cancelled'
    ))
);

-- Indexes
CREATE INDEX idx_workflows_organization ON intent_workflows(organization_id);
CREATE INDEX idx_workflows_state ON intent_workflows(state);
CREATE INDEX idx_workflows_updated ON intent_workflows(updated_at DESC);
```

### 4. Keywords
SEO keyword hierarchy and metadata.

```sql
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  workflow_id UUID REFERENCES intent_workflows(id),
  
  -- Hierarchy
  competitor_url_id UUID REFERENCES organization_competitors(id),
  parent_seed_keyword_id UUID REFERENCES keywords(id),
  
  -- Keyword data
  keyword TEXT NOT NULL,
  seed_keyword TEXT,
  
  -- SEO metrics
  search_volume INTEGER DEFAULT 0,
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),
  competition_index INTEGER DEFAULT 0,
  keyword_difficulty INTEGER DEFAULT 0 CHECK (keyword_difficulty BETWEEN 0 AND 100),
  cpc DECIMAL(10,2),
  
  -- Status tracking
  longtail_status TEXT DEFAULT 'not_started',
  subtopics_status TEXT DEFAULT 'not_started',
  article_status TEXT DEFAULT 'not_started',
  filter_status TEXT DEFAULT 'not_approved',
  
  -- Content data
  subtopics JSONB,
  embedding VECTOR(1536),
  
  -- AI metadata
  detected_language TEXT,
  is_foreign_language BOOLEAN DEFAULT false,
  main_intent TEXT,
  is_navigational BOOLEAN DEFAULT false,
  foreign_intent TEXT,
  ai_suggested BOOLEAN DEFAULT false,
  user_selected BOOLEAN DEFAULT false,
  decision_confidence DECIMAL(3,2),
  selection_source TEXT,
  selection_timestamp TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_longtail_status 
    CHECK (longtail_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  CONSTRAINT valid_subtopics_status 
    CHECK (subtopics_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  CONSTRAINT valid_article_status 
    CHECK (article_status IN ('not_started', 'in_progress', 'completed', 'failed'))
);

-- Indexes
CREATE INDEX idx_keywords_organization ON keywords(organization_id);
CREATE INDEX idx_keywords_workflow ON keywords(workflow_id);
CREATE INDEX idx_keywords_parent ON keywords(parent_seed_keyword_id);
CREATE INDEX idx_keywords_status ON keywords(longtail_status, subtopics_status, article_status);
CREATE INDEX idx_keywords_search_volume ON keywords(search_volume DESC);
CREATE INDEX idx_keywords_embedding ON keywords USING ivfflat (embedding vector_cosine_ops);
```

### 5. Topic Clusters
Semantic clustering results.

```sql
CREATE TABLE topic_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id),
  
  -- Cluster structure
  hub_keyword_id UUID NOT NULL REFERENCES keywords(id),
  spoke_keyword_id UUID NOT NULL REFERENCES keywords(id),
  
  -- Similarity metrics
  similarity_score DECIMAL(5,4),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(workflow_id, spoke_keyword_id)
);

-- Indexes
CREATE INDEX idx_topic_clusters_workflow ON topic_clusters(workflow_id);
CREATE INDEX idx_topic_clusters_hub ON topic_clusters(hub_keyword_id);
CREATE INDEX idx_topic_clusters_similarity ON topic_clusters(similarity_score DESC);
```

### 6. Cluster Validation Results
Cluster validation outcomes.

```sql
CREATE TABLE cluster_validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id),
  
  -- Validation target
  hub_keyword_id UUID NOT NULL REFERENCES keywords(id),
  
  -- Validation results
  validation_status TEXT NOT NULL CHECK (validation_status IN ('valid', 'invalid')),
  avg_similarity DECIMAL(5,4),
  spoke_count INTEGER,
  
  -- Validation details
  validation_errors JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(workflow_id, hub_keyword_id)
);

-- Indexes
CREATE INDEX idx_validation_workflow ON cluster_validation_results(workflow_id);
CREATE INDEX idx_validation_status ON cluster_validation_results(validation_status);
```

### 7. Articles
Generated content management.

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  workflow_id UUID REFERENCES intent_workflows(id),
  keyword_id UUID REFERENCES keywords(id),
  
  -- Article metadata
  title TEXT NOT NULL,
  slug TEXT,
  content TEXT,
  html_content TEXT,
  
  -- Generation tracking
  status TEXT NOT NULL DEFAULT 'queued',
  progress_percent INTEGER DEFAULT 0,
  sections_completed INTEGER DEFAULT 0,
  sections_total INTEGER DEFAULT 0,
  current_section TEXT,
  
  -- Quality metrics
  word_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0, -- minutes
  quality_score DECIMAL(3,2),
  plagiarism_score DECIMAL(3,2),
  
  -- SEO data
  meta_description TEXT,
  meta_keywords TEXT[],
  focus_keyword TEXT,
  
  -- Publishing
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  wordpress_post_id BIGINT,
  wordpress_url TEXT,
  
  -- Cost tracking
  generation_cost DECIMAL(10,6) DEFAULT 0.000000,
  
  -- User attribution
  created_by UUID REFERENCES users(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_article_status 
    CHECK (status IN ('queued', 'researching', 'generating', 'validating', 'completed', 'failed', 'published'))
);

-- Indexes
CREATE INDEX idx_articles_organization ON articles(organization_id);
CREATE INDEX idx_articles_workflow ON articles(workflow_id);
CREATE INDEX idx_articles_keyword ON articles(keyword_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published ON articles(published, published_at DESC);
```

### 8. Article Sections
Detailed section tracking for article generation.

```sql
CREATE TABLE article_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id),
  
  -- Section data
  section_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  html_content TEXT,
  
  -- Generation tracking
  status TEXT NOT NULL DEFAULT 'pending',
  word_count INTEGER DEFAULT 0,
  generation_time INTEGER DEFAULT 0, -- milliseconds
  
  -- Quality metrics
  quality_score DECIMAL(3,2),
  citations_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_section_status 
    CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  UNIQUE(article_id, section_number)
);

-- Indexes
CREATE INDEX idx_article_sections_article ON article_sections(article_id);
CREATE INDEX idx_article_sections_status ON article_sections(status);
```

### 9. Intent Approvals
Human approval records for workflow gates.

```sql
CREATE TABLE intent_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  workflow_id UUID REFERENCES intent_workflows(id),
  
  -- Approval target
  entity_type TEXT NOT NULL, -- 'keyword', 'workflow', 'cluster'
  entity_id UUID NOT NULL,
  
  -- Approval decision
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  feedback TEXT,
  
  -- User attribution
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, entity_type, entity_id)
);

-- Indexes
CREATE INDEX idx_approvals_organization ON intent_approvals(organization_id);
CREATE INDEX idx_approvals_entity ON intent_approvals(entity_type, entity_id);
CREATE INDEX idx_approvals_user ON intent_approvals(user_id);
```

### 10. Intent Audit Logs
Comprehensive audit trail for compliance.

```sql
CREATE TABLE intent_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Audit data
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  
  -- State changes
  from_state TEXT,
  to_state TEXT,
  
  -- User attribution
  user_id UUID REFERENCES users(id),
  
  -- Request context
  ip_address TEXT,
  user_agent TEXT,
  
  -- Additional data
  details JSONB,
  metadata JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_organization ON intent_audit_logs(organization_id);
CREATE INDEX idx_audit_action ON intent_audit_logs(action);
CREATE INDEX idx_audit_created ON intent_audit_logs(created_at DESC);
CREATE INDEX idx_audit_user ON intent_audit_logs(user_id);
```

### 11. Usage Tracking
Resource usage and billing metrics.

```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Usage metrics
  metric_type TEXT NOT NULL, -- 'article_generation', 'icp_generation', etc.
  billing_period TEXT NOT NULL, -- '2026-02'
  
  -- Usage data
  usage_count INTEGER NOT NULL DEFAULT 0,
  cost_amount DECIMAL(10,4) DEFAULT 0.0000,
  
  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, metric_type, billing_period)
);

-- Indexes
CREATE INDEX idx_usage_organization ON usage_tracking(organization_id);
CREATE INDEX idx_usage_period ON usage_tracking(billing_period);
CREATE INDEX idx_usage_metric ON usage_tracking(metric_type);
```

### 12. Organization Competitors
Competitor URL tracking.

```sql
CREATE TABLE organization_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Competitor data
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  domain TEXT NOT NULL,
  
  -- Analysis data
  last_analyzed TIMESTAMP WITH TIME ZONE,
  analysis_status TEXT DEFAULT 'not_analyzed',
  keywords_found INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, normalized_url)
);

-- Indexes
CREATE INDEX idx_competitors_organization ON organization_competitors(organization_id);
CREATE INDEX idx_competitors_domain ON organization_competitors(domain);
CREATE INDEX idx_competitors_normalized ON organization_competitors(normalized_url);
```

## Row Level Security (RLS)

### Organization Isolation
All tables implement RLS policies to ensure organizations can only access their own data:

```sql
-- Example RLS policy for intent_workflows
CREATE POLICY "Users can view own organization workflows" ON intent_workflows
  FOR SELECT USING (organization_id = public.get_auth_user_org_id());

CREATE POLICY "Users can insert own organization workflows" ON intent_workflows
  FOR INSERT WITH CHECK (organization_id = public.get_auth_user_org_id());

CREATE POLICY "Users can update own organization workflows" ON intent_workflows
  FOR UPDATE USING (organization_id = public.get_auth_user_org_id());

CREATE POLICY "Users can delete own organization workflows" ON intent_workflows
  FOR DELETE USING (organization_id = public.get_auth_user_org_id());
```

### User Context Function
```sql
CREATE OR REPLACE FUNCTION public.get_auth_user_org_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Get current user from JWT
  RETURN (
    SELECT organization_id 
    FROM auth.users 
    WHERE id = auth.uid()
  );
END;
$$;
```

## Database Functions

### Workflow State Management
```sql
-- Atomic workflow state transition
CREATE OR REPLACE FUNCTION public.transition_workflow_state(
  p_workflow_id UUID,
  p_from_state TEXT,
  p_to_state TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  transition_count INTEGER;
BEGIN
  -- Atomic update with WHERE clause prevents race conditions
  UPDATE intent_workflows 
  SET 
    state = p_to_state,
    updated_at = NOW()
  WHERE 
    id = p_workflow_id 
    AND state = p_from_state;
    
  GET DIAGNOSTICS transition_count = ROW_COUNT;
  
  -- Log successful transition
  IF transition_count > 0 THEN
    INSERT INTO intent_audit_logs (
      organization_id,
      action,
      from_state,
      to_state,
      user_id,
      ip_address,
      user_agent
    )
    SELECT 
      w.organization_id,
      'workflow.state_transition',
      p_from_state,
      p_to_state,
      p_user_id,
      current_setting('request.headers')::json->>'x-forwarded-for',
      current_setting('request.headers')::json->>'user-agent'
    FROM intent_workflows w
    WHERE w.id = p_workflow_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;
```

### Cost Tracking
```sql
-- Record usage and increment cost
CREATE OR REPLACE FUNCTION public.record_usage_and_increment(
  p_organization_id UUID,
  p_workflow_id UUID,
  p_metric_type TEXT,
  p_cost_amount DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  current_period TEXT;
BEGIN
  -- Get current billing period (YYYY-MM)
  current_period := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Upsert usage tracking
  INSERT INTO usage_tracking (
    organization_id,
    metric_type,
    billing_period,
    usage_count,
    cost_amount,
    last_updated
  )
  VALUES (
    p_organization_id,
    p_metric_type,
    current_period,
    1,
    p_cost_amount,
    NOW()
  )
  ON CONFLICT (organization_id, metric_type, billing_period)
  DO UPDATE SET
    usage_count = usage_tracking.usage_count + 1,
    cost_amount = usage_tracking.cost_amount + p_cost_amount,
    last_updated = NOW();
    
  -- Update workflow cost
  UPDATE intent_workflows
  SET actual_cost = actual_cost + p_cost_amount
  WHERE id = p_workflow_id;
END;
$$;
```

## Performance Optimization

### Indexes
- **Primary Keys**: UUID primary keys for all tables
- **Foreign Keys**: Indexed foreign key relationships
- **Query Optimization**: Composite indexes for common query patterns
- **Vector Search**: ivfflat indexes for embedding similarity

### Query Patterns
- **Organization Filtering**: All queries include organization_id filter
- **Pagination**: LIMIT/OFFSET for large result sets
- **Batch Operations**: Bulk inserts/updates for efficiency
- **Connection Pooling**: Supabase connection pooling

### Caching Strategy
- **Application Level**: In-memory caching for frequently accessed data
- **Database Level**: PostgreSQL query result caching
- **CDN**: Static assets cached at edge

## Migration Strategy

### Migration Files
Migrations are stored in `supabase/migrations/` with timestamp prefixes:

```
20260101124156_initial_schema.sql
20260114000000_add_activities_table.sql
20260114010000_fix_activity_trigger_null_user.sql
20260131232142_add_parent_seed_keyword_to_keywords.sql
20260201120000_add_topic_clusters_table.sql
...
```

### Migration Process
1. Create migration file with timestamp prefix
2. Write SQL schema changes
3. Test migration on staging
4. Apply to production via Supabase CLI
5. Verify schema changes

### Rollback Strategy
- All migrations are designed to be reversible
- Rollback scripts included in migration files
- Database backups before major migrations
- Testing rollback procedures

## Data Retention

### Retention Policies
- **Audit Logs**: 7 years (compliance requirement)
- **Usage Data**: 3 years (billing requirement)
- **Workflow Data**: 1 year (performance)
- **Temporary Data**: 30 days (cleanup)

### Cleanup Procedures
```sql
-- Archive old audit logs
CREATE OR REPLACE FUNCTION public.archive_old_audit_logs()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Move logs older than 1 year to archive table
  INSERT INTO intent_audit_logs_archive
  SELECT * FROM intent_audit_logs
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Delete archived logs from main table
  DELETE FROM intent_audit_logs
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$;
```

## Monitoring & Maintenance

### Performance Monitoring
- Query performance tracking
- Index usage analysis
- Connection pool monitoring
- Storage utilization tracking

### Health Checks
- Database connectivity
- RLS policy validation
- Migration status verification
- Backup integrity checks

### Maintenance Tasks
- Regular vacuum and analyze
- Index rebuilds as needed
- Statistics updates
- Log rotation

## Security Considerations

### Data Encryption
- **At Rest**: Supabase encryption
- **In Transit**: SSL/TLS required
- **Backups**: Encrypted backups

### Access Control
- **Database Users**: Minimal privileges
- **Service Roles**: Role-based access
- **API Keys**: Rotated regularly

### Compliance
- **GDPR**: Data deletion capabilities
- **SOC 2**: Audit trail maintenance
- **HIPAA**: Healthcare data protection (if applicable)

## Backup & Recovery

### Backup Strategy
- **Daily Backups**: Full database backups
- **Point-in-Time Recovery**: 7-day retention
- **Cross-Region**: Geographic redundancy
- **Testing**: Regular restore testing

### Recovery Procedures
1. Assess impact and scope
2. Determine recovery point
3. Initiate restore process
4. Verify data integrity
5. Update application state
6. Monitor post-recovery

## Future Enhancements

### Planned Schema Changes
- **Workflow Templates**: Reusable workflow configurations
- **Advanced Analytics**: Enhanced metrics storage
- **Real-time Features**: Streaming data structures
- **Performance**: Additional optimization indexes

### Scalability Improvements
- **Partitioning**: Table partitioning for large datasets
- **Read Replicas**: Read scaling for analytics
- **Sharding**: Horizontal scaling strategy
- **Caching**: Advanced caching layers
