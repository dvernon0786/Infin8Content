# Data Models - Infin8Content

## Overview
Infin8Content uses Supabase PostgreSQL as its primary database with Row Level Security (RLS) policies for multi-tenant data isolation. The database schema supports user management, organizations, article generation, and payment processing.

## Database Architecture

### Core Tables

#### users
User accounts and authentication data
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);
```

**Fields:**
- `id`: Unique user identifier
- `email`: User email address (unique)
- `password_hash`: Bcrypt hashed password
- `first_name`, `last_name`: User profile information
- `role`: User role ('admin', 'user', 'member')
- `last_login`: Timestamp of last login
- `is_active`: Account status

**Relationships:**
- One-to-many with `organization_members`
- One-to-many with `articles` (via created_by)

#### organizations
Multi-tenant organization data
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'starter',
  stripe_customer_id TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

**Fields:**
- `id`: Unique organization identifier
- `name`: Organization display name
- `slug`: URL-friendly organization identifier
- `plan`: Subscription plan ('starter', 'pro', 'agency')
- `stripe_customer_id`: Stripe customer reference
- `settings`: Organization-specific settings (JSON)
- `is_active`: Organization status

**Relationships:**
- One-to-many with `organization_members`
- One-to-many with `articles`
- One-to-many with `usage_tracking`

#### organization_members
Many-to-many relationship between users and organizations
```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

**Fields:**
- `organization_id`: Reference to organization
- `user_id`: Reference to user
- `role`: Member role ('admin', 'member', 'viewer')
- `invited_by`: User who sent the invitation
- `invited_at`: When invitation was sent
- `joined_at`: When user joined organization

**Relationships:**
- Many-to-one with `organizations`
- Many-to-one with `users`

#### articles
Article content and metadata
```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  title TEXT,
  content TEXT,
  target_word_count INTEGER,
  actual_word_count INTEGER,
  writing_style TEXT DEFAULT 'Professional',
  target_audience TEXT DEFAULT 'General',
  custom_instructions TEXT,
  status TEXT DEFAULT 'draft',
  generation_progress INTEGER DEFAULT 0,
  error_message TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);
```

**Fields:**
- `id`: Unique article identifier
- `organization_id`: Organization that owns the article
- `keyword`: Primary keyword for the article
- `title`: Generated article title
- `content`: Full article content (HTML)
- `target_word_count`: Desired article length
- `actual_word_count`: Generated article length
- `writing_style`: Writing style preference
- `target_audience`: Target audience
- `custom_instructions`: User-provided instructions
- `status`: Article status ('draft', 'generating', 'completed', 'published', 'failed')
- `generation_progress`: Generation progress percentage
- `error_message`: Error details if generation failed
- `created_by`: User who created the article
- `published_at`: When article was published
- `metadata`: Additional article data (JSON)

**Relationships:**
- Many-to-one with `organizations`
- Many-to-one with `users`
- One-to-many with `publish_references`

#### publish_references
External CMS publishing tracking
```sql
CREATE TABLE publish_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  cms_type TEXT NOT NULL,
  published_url TEXT,
  external_id TEXT,
  cms_credentials JSONB,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);
```

**Fields:**
- `article_id`: Reference to article
- `cms_type`: Type of CMS ('wordpress', 'medium', etc.)
- `published_url`: URL where article was published
- `external_id`: ID in external CMS
- `cms_credentials`: Encrypted CMS credentials (JSON)
- `published_at`: When article was published
- `status`: Publishing status ('pending', 'published', 'failed')

**Relationships:**
- Many-to-one with `articles`

#### usage_tracking
Usage metrics and billing data
```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, metric_type, billing_period)
);
```

**Fields:**
- `organization_id`: Organization being tracked
- `metric_type`: Type of metric ('article_generation', 'api_calls', etc.)
- `billing_period`: Billing period (YYYY-MM format)
- `usage_count`: Current usage count
- `last_updated`: When usage was last updated

**Relationships:**
- Many-to-one with `organizations`

#### audit_logs
Comprehensive audit trail
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `organization_id`: Organization context (optional)
- `user_id`: User who performed the action
- `action`: Action type ('article.generation.started', 'user.login', etc.)
- `details`: Action details (JSON)
- `ip_address`: Client IP address
- `user_agent`: Client user agent string
- `created_at`: When action occurred

**Relationships:**
- Many-to-one with `organizations` (optional)
- Many-to-one with `users` (optional)

### Supporting Tables

#### keyword_research
Keyword research data
```sql
CREATE TABLE keyword_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  competition_score DECIMAL(3,2),
  difficulty_score DECIMAL(3,2),
  suggestions JSONB DEFAULT '[]',
  research_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### seo_metrics
SEO performance tracking
```sql
CREATE TABLE seo_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_rank INTEGER,
  organic_traffic INTEGER,
  click_through_rate DECIMAL(5,4),
  backlinks_count INTEGER,
  domain_authority DECIMAL(3,1),
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### team_invites
Team member invitations
```sql
CREATE TABLE team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES users(id),
  invite_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Data Relationships

### Entity Relationship Diagram

```
users ──< organization_members >─── organizations
 │                                      │
 │                                      │
 │                                      │
 └─── articles (created_by)            │
        │                               │
        │                               │
        └── publish_references          │
                                        │
                                        └── usage_tracking
                                        │
                                        └── audit_logs
                                        │
                                        └── keyword_research
                                        │
                                        └── team_invites

articles ──< seo_metrics
```

### Key Relationships

1. **Multi-tenancy**: All data is scoped to `organization_id`
2. **User Management**: Users can belong to multiple organizations
3. **Article Ownership**: Articles belong to organizations, created by users
4. **Audit Trail**: All actions logged with user and organization context
5. **Usage Tracking**: Per-organization usage metrics for billing

## Security Model

### Row Level Security (RLS)

All tables implement RLS policies:

1. **Organization Isolation**: Users can only access data from their organizations
2. **Role-based Access**: Different access levels for admin, member, viewer roles
3. **User Context**: All queries include user context for security

### Example RLS Policy

```sql
-- Users can only see articles from their organizations
CREATE POLICY "Users can view own organization articles" ON articles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );
```

## Data Validation

### Constraints

1. **Unique Constraints**: Email addresses, organization slugs
2. **Foreign Key Constraints**: Referential integrity
3. **Check Constraints**: Valid enum values, positive numbers
4. **NOT NULL**: Required fields

### Triggers

1. **Updated Timestamp**: Automatic timestamp updates
2. **Audit Logging**: Automatic audit trail creation
3. **Usage Tracking**: Automatic usage metric updates

## Migration Strategy

### Migration Files

Migrations are stored in `/migrations/` directory:
- `001_initial_schema.sql` - Core tables
- `002_add_analytics_recommendations.sql` - SEO and analytics
- Additional migrations for feature additions

### Migration Process

```bash
# Apply migrations
supabase db push

# Reset database (development)
supabase db reset

# Generate types
npx tsx scripts/generate-types.ts
```

## Performance Optimization

### Indexes

1. **Primary Keys**: UUID indexes on all tables
2. **Foreign Keys**: Indexes on all foreign key columns
3. **Query Optimization**: Composite indexes for common queries
4. **Time Series**: Indexes on timestamp columns

### Query Patterns

1. **Organization Scoping**: All queries filtered by organization_id
2. **Pagination**: LIMIT/OFFSET for large result sets
3. **Caching**: Frequently accessed data cached
4. **Connection Pooling**: Supabase connection management

## Backup and Recovery

### Automated Backups

1. **Daily Backups**: Full database backups
2. **Point-in-Time Recovery**: 7-day retention
3. **Cross-region Replication**: High availability
4. **Export Capability**: Data export on demand

### Disaster Recovery

1. **RTO**: 4 hour recovery time objective
2. **RPO**: 1 hour recovery point objective
3. **Testing**: Monthly recovery testing
4. **Documentation**: Recovery procedures documented

## Compliance and Privacy

### Data Protection

1. **GDPR Compliance**: Right to deletion, data portability
2. **Data Encryption**: At rest and in transit
3. **Access Logs**: Comprehensive audit trail
4. **Data Minimization**: Only collect necessary data

### Privacy Features

1. **Anonymization**: Option to anonymize user data
2. **Consent Management**: Explicit consent tracking
3. **Data Retention**: Automatic data cleanup
4. **Export Tools**: User data export capabilities

## Monitoring and Maintenance

### Health Checks

1. **Database Performance**: Query performance monitoring
2. **Storage Usage**: Disk space monitoring
3. **Connection Limits**: Connection pool monitoring
4. **Error Rates**: Error tracking and alerting

### Maintenance Tasks

1. **Vacuum**: Regular table maintenance
2. **Statistics**: Update table statistics
3. **Index Rebuild**: Periodic index optimization
4. **Archive**: Old data archival

## Integration Points

### External Services

1. **Stripe**: Payment processing (webhook integration)
2. **Brevo**: Email service (delivery tracking)
3. **Inngest**: Background job processing
4. **OpenRouter**: AI service integration

### Data Synchronization

1. **Real-time Updates**: Supabase real-time subscriptions
2. **Webhook Processing**: External service webhooks
3. **Batch Processing**: Scheduled data processing
4. **API Integration**: Third-party service APIs
