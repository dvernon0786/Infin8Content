# Database Schema Documentation - Infin8Content

**Generated:** February 19, 2026  
**Version:** v2.1.0 (Zero-Legacy FSM)  
**Last Updated:** 2026-02-19  
**Database:** Supabase (PostgreSQL 15)  
**Architecture:** Multi-tenant with Row Level Security  
**Total Tables:** 13 core tables with zero-legacy schema

---

## 🎯 Overview

The Infin8Content database implements a multi-tenant architecture with comprehensive Row Level Security (RLS), audit logging, and a zero-legacy schema design optimized for the deterministic FSM workflow engine.

---

## 🏗️ Core Architecture

### Multi-Tenant Design
- **Organization Isolation**: All data scoped to `organization_id`
- **Row Level Security**: RLS policies enforce tenant isolation
- **User Context**: Authentication context provides `auth.org_id()`
- **Audit Trail**: Comprehensive activity tracking with user attribution

### Zero-Legacy Schema
- **No Deprecated Fields**: Eliminated `status`, `current_step`, `step_*_completed_at`
- **FSM Native**: Uses `state` enum for workflow management
- **Explicit Selection**: No `SELECT *` queries allowed
- **Type Safety**: Strong typing with TypeScript interfaces

---

## 📋 Core Tables

### 1. Organizations (`organizations`)

**Purpose**: Master tenant records with onboarding state

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Onboarding System (v2.1.0)
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_version TEXT DEFAULT 'v1',
  website_url TEXT,
  business_description TEXT,
  target_audiences TEXT[],
  blog_config JSONB DEFAULT '{}',
  content_defaults JSONB DEFAULT '{}',
  keyword_settings JSONB DEFAULT '{}'
);
```

**Key Features**:
- **Onboarding Gates**: `onboarding_completed` flag controls system access
- **Flexible Configuration**: JSONB fields for custom settings
- **Version Tracking**: `onboarding_version` for migration support

**RLS Policy**:
```sql
CREATE POLICY org_users_can_view_own_org ON organizations
  FOR ALL TO authenticated
  USING (id = auth.org_id());
```

---

### 2. Intent Workflows (`intent_workflows`)

**Purpose**: Master workflow records with FSM state management

```sql
CREATE TABLE intent_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  state workflow_state_enum NOT NULL DEFAULT 'step_1_icp',
  workflow_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FSM State Enum
CREATE TYPE workflow_state_enum AS ENUM (
  'step_1_icp',
  'step_2_competitors', 
  'step_3_seeds',
  'step_4_longtails',
  'step_5_filtering',
  'step_6_clustering',
  'step_7_validation',
  'step_8_subtopics',
  'step_9_articles',
  'completed'
);
```

**Key Features**:
- **FSM Native**: Uses `state` enum (no legacy fields)
- **Workflow Metadata**: `workflow_data` stores structured data
- **Organization Scoped**: Isolated per tenant

**Workflow Data Structure**:
```json
{
  "icp": {
    "target_audience": "...",
    "content_pillars": ["..."],
    "geographic_focus": "..."
  },
  "competitors": [
    {
      "url": "https://example.com",
      "name": "Example Corp",
      "seed_keywords": ["keyword1", "keyword2"]
    }
  ],
  "metrics": {
    "total_keywords": 150,
    "total_articles": 50,
    "completion_percentage": 85
  }
}
```

---

### 3. Keywords (`keywords`)

**Purpose**: Hierarchical keyword structure (seed → longtail → subtopics)

```sql
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id),
  parent_seed_keyword_id UUID REFERENCES keywords(id),
  
  -- Keyword Data
  keyword_text TEXT NOT NULL,
  keyword_type keyword_type_enum NOT NULL,
  search_volume INTEGER,
  competition_index DECIMAL,
  
  -- Status Tracking (FSM-aligned)
  longtail_status keyword_status_enum DEFAULT 'not_started',
  subtopics_status keyword_status_enum DEFAULT 'not_started',
  article_status article_status_enum DEFAULT 'not_started',
  
  -- AI Metadata
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
  
  -- Subtopics (JSONB array)
  subtopics JSONB DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, keyword_text)
);

-- Enums
CREATE TYPE keyword_type_enum AS ENUM ('seed', 'longtail');
CREATE TYPE keyword_status_enum AS ENUM ('not_started', 'in_progress', 'complete');
CREATE TYPE article_status_enum AS ENUM ('not_started', 'ready', 'queued', 'generating', 'completed', 'failed');
```

**Key Features**:
- **Hierarchical Structure**: `parent_seed_keyword_id` for seed → longtail relationships
- **Status Tracking**: Separate status fields for each workflow stage
- **AI Metadata**: Comprehensive AI decision tracking
- **Subtopics Storage**: JSONB array for subtopic ideas

**Keyword Hierarchy Example**:
```sql
-- Seed Keyword
INSERT INTO keywords (organization_id, workflow_id, keyword_text, keyword_type)
VALUES ('org-123', 'workflow-456', 'content marketing', 'seed');

-- Long-tail Keywords (with parent relationship)
INSERT INTO keywords (organization_id, workflow_id, parent_seed_keyword_id, keyword_text, keyword_type)
VALUES ('org-123', 'workflow-456', 'seed-id', 'content marketing strategies', 'longtail');
```

---

### 4. Topic Clusters (`topic_clusters`)

**Purpose**: Hub-and-spoke topic clustering for content structure

```sql
CREATE TABLE topic_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id),
  hub_keyword_id UUID NOT NULL REFERENCES keywords(id),
  spoke_keyword_id UUID NOT NULL REFERENCES keywords(id),
  similarity_score DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(workflow_id, spoke_keyword_id)
);
```

**Key Features**:
- **Hub-and-Spoke Model**: One hub keyword with multiple related spokes
- **Semantic Similarity**: Cosine similarity scores for clustering
- **Workflow Scoped**: Clusters belong to specific workflows
- **Uniqueness Constraint**: Each spoke appears in only one cluster per workflow

**Clustering Example**:
```
Hub: "content marketing"
├── Spoke: "content marketing strategies" (similarity: 0.85)
├── Spoke: "content marketing examples" (similarity: 0.82)
└── Spoke: "content marketing tools" (similarity: 0.79)
```

---

### 5. Articles (`articles`)

**Purpose**: Generated content with publishing pipeline

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id),
  keyword_id UUID NOT NULL REFERENCES keywords(id),
  
  -- Content Data
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  word_count INTEGER,
  reading_time INTEGER, -- minutes
  
  -- Publishing Data
  status article_status_enum DEFAULT 'not_started',
  wordpress_post_id INTEGER,
  wordpress_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Generation Metadata
  generation_model TEXT,
  generation_cost DECIMAL,
  quality_score DECIMAL,
  
  -- Audit Fields
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, title)
);
```

**Key Features**:
- **Content Pipeline**: Tracks generation through publishing
- **WordPress Integration**: Stores published post IDs and URLs
- **Quality Metrics**: Generation cost and quality scoring
- **User Attribution**: `created_by` for audit trail

---

### 6. Audit Logs (`audit_logs`)

**Purpose**: Comprehensive activity tracking for compliance

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- **Comprehensive Tracking**: All user actions logged
- **Entity Context**: `entity_type` and `entity_id` for specific records
- **Security Metadata**: IP address and user agent tracking
- **Structured Details**: JSONB for flexible event data

**Audit Events**:
```json
{
  "action": "workflow.transition",
  "entity_type": "intent_workflows",
  "entity_id": "workflow-123",
  "details": {
    "from_state": "step_1_icp",
    "to_state": "step_2_competitors",
    "event": "ICP_COMPLETED"
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0..."
}
```

---

### 7. Usage Tracking (`usage_tracking`)

**Purpose**: Plan limits and billing metrics

```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  metric_type TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, metric_type, billing_period)
);
```

**Key Features**:
- **Plan Enforcement**: Tracks usage against plan limits
- **Billing Periods**: Monthly billing cycles
- **Metric Types**: Different usage categories (articles, AI calls, etc.)
- **Atomic Updates**: Upsert operations for accurate counting

**Usage Metrics**:
- `article_generation` - Articles generated per month
- `ai_api_calls` - AI API usage
- `keyword_research` - Keyword research operations
- `competitor_analysis` - Competitor analysis requests

---

## 🔐 Security Architecture

### Row Level Security (RLS)

All multi-tenant tables implement RLS policies:

```sql
-- Standard RLS Policy Pattern
CREATE POLICY organization_isolation ON table_name
  FOR ALL TO authenticated
  USING (organization_id = auth.org_id())
  WITH CHECK (organization_id = auth.org_id());

-- Enable RLS on table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Security Features

1. **Organization Isolation**: Users can only access their own data
2. **User Attribution**: All actions tracked with user ID
3. **IP Tracking**: Network-level security monitoring
4. **Audit Trail**: Complete activity logging
5. **Data Privacy**: GDPR-compliant data handling

---

## 📊 Performance Optimization

### Strategic Indexing

```sql
-- Workflow queries
CREATE INDEX idx_workflows_org_state ON intent_workflows(organization_id, state);
CREATE INDEX idx_workflows_updated ON intent_workflows(updated_at DESC);

-- Keyword hierarchy
CREATE INDEX idx_keywords_workflow_parent ON keywords(workflow_id, parent_seed_keyword_id);
CREATE INDEX idx_keywords_org_type ON keywords(organization_id, keyword_type);

-- Article queries
CREATE INDEX idx_articles_workflow_status ON articles(workflow_id, status);
CREATE INDEX idx_articles_keyword ON articles(keyword_id);

-- Audit queries
CREATE INDEX idx_audit_org_action ON audit_logs(organization_id, action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

### Query Optimization

1. **Explicit Field Selection**: Never use `SELECT *`
2. **Organization Filtering**: Always include `organization_id` in WHERE clauses
3. **State-Based Queries**: Use FSM state for efficient workflow queries
4. **Pagination**: Implement cursor-based pagination for large datasets

---

## 🔄 Migration Strategy

### Zero-Legacy Migration

The database has been migrated from legacy schema to zero-legacy FSM design:

#### Legacy Fields Removed
- `intent_workflows.status` → replaced with `state` enum
- `intent_workflows.current_step` → replaced with `state` enum
- `intent_workflows.step_*_completed_at` → replaced with audit logging
- `keywords.status` → replaced with specific status fields

#### Migration Scripts
```sql
-- Example: Legacy to FSM migration
BEGIN;

-- Add new state column
ALTER TABLE intent_workflows ADD COLUMN state workflow_state_enum;

-- Migrate data based on legacy fields
UPDATE intent_workflows 
SET state = CASE 
  WHEN current_step = 1 AND status = 'step_1_icp' THEN 'step_1_icp'
  WHEN current_step = 2 AND status = 'step_2_competitors' THEN 'step_2_competitors'
  -- ... mapping for all steps
  ELSE 'step_1_icp' -- default fallback
END;

-- Drop legacy columns
ALTER TABLE intent_workflows 
  DROP COLUMN status,
  DROP COLUMN current_step,
  DROP COLUMN step_1_icp_completed_at,
  -- ... drop all legacy timestamp columns

COMMIT;
```

---

## 📈 Monitoring & Analytics

### System Metrics

```sql
-- Workflow completion rates
SELECT 
  state,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM intent_workflows 
WHERE organization_id = $1
GROUP BY state;

-- Keyword generation metrics
SELECT 
  keyword_type,
  COUNT(*) as count,
  AVG(search_volume) as avg_volume
FROM keywords 
WHERE organization_id = $1
GROUP BY keyword_type;

-- Article generation performance
SELECT 
  status,
  COUNT(*) as count,
  AVG(word_count) as avg_word_count,
  AVG(quality_score) as avg_quality
FROM articles 
WHERE organization_id = $1
GROUP BY status;
```

### Health Checks

```sql
-- Stuck workflows (in same state > 1 hour)
SELECT id, name, state, updated_at
FROM intent_workflows 
WHERE state != 'completed' 
  AND updated_at < NOW() - INTERVAL '1 hour';

-- Orphaned keywords (no workflow)
SELECT COUNT(*) 
FROM keywords k
LEFT JOIN intent_workflows w ON k.workflow_id = w.id
WHERE w.id IS NULL;

-- Failed article generations
SELECT COUNT(*)
FROM articles 
WHERE status = 'failed' 
  AND created_at > NOW() - INTERVAL '24 hours';
```

---

## 🔧 Development Guidelines

### Query Patterns

#### ✅ Correct Patterns
```sql
-- Explicit field selection
SELECT id, state, organization_id, workflow_data
FROM intent_workflows
WHERE organization_id = $1 AND state = 'step_3_seeds';

-- Organization-scoped queries
SELECT id, keyword_text, keyword_type
FROM keywords
WHERE organization_id = $1 AND parent_seed_keyword_id IS NULL;

-- FSM state queries
SELECT COUNT(*) as count
FROM intent_workflows
WHERE organization_id = $1 AND state = 'completed';
```

#### ❌ Forbidden Patterns
```sql
-- Never use wildcard selection
SELECT * FROM intent_workflows;

-- Never query without organization filter
SELECT * FROM keywords;

-- Never reference legacy fields
SELECT status, current_step FROM intent_workflows; -- These don't exist
```

### Transaction Patterns

```typescript
// Atomic workflow transition
const transitionWorkflow = async (workflowId: string, newState: string) => {
  const supabase = createServiceRoleClient()
  
  const { data, error } = await supabase
    .from('intent_workflows')
    .update({ 
      state: newState,
      updated_at: new Date().toISOString()
    })
    .eq('id', workflowId)
    .eq('organization_id', organizationId) // RLS protection
    .eq('state', currentState) // Race condition protection
    .single()
    
  if (error) throw error
  return data
}
```

---

## 📚 API Integration

### Database Views for API

```sql
-- Workflow progress view
CREATE VIEW workflow_progress AS
SELECT 
  w.id,
  w.name,
  w.state,
  w.created_at,
  w.updated_at,
  COUNT(DISTINCT k.id) FILTER (WHERE k.keyword_type = 'seed') as seed_count,
  COUNT(DISTINCT k.id) FILTER (WHERE k.keyword_type = 'longtail') as longtail_count,
  COUNT(DISTINCT a.id) as article_count,
  CASE w.state
    WHEN 'step_1_icp' THEN 15
    WHEN 'step_2_competitors' THEN 25
    WHEN 'step_3_seeds' THEN 35
    WHEN 'step_4_longtails' THEN 45
    WHEN 'step_5_filtering' THEN 55
    WHEN 'step_6_clustering' THEN 65
    WHEN 'step_7_validation' THEN 75
    WHEN 'step_8_subtopics' THEN 85
    WHEN 'step_9_articles' THEN 95
    WHEN 'completed' THEN 100
    ELSE 0
  END as completion_percentage
FROM intent_workflows w
LEFT JOIN keywords k ON w.id = k.workflow_id
LEFT JOIN articles a ON w.id = a.workflow_id
GROUP BY w.id, w.name, w.state, w.created_at, w.updated_at;
```

---

This database schema documentation provides comprehensive coverage of the Infin8Content zero-legacy FSM database architecture, including security, performance, and development guidelines.
