# Data Models - Infin8Content

Generated: 2026-01-23 (Deep Scan Update)  
Database: Supabase (PostgreSQL)  
Migration Strategy: Versioned SQL migrations

## Overview

Infin8Content uses a multi-tenant PostgreSQL database with Row Level Security (RLS) policies to ensure data isolation between organizations. The schema supports user management, content generation, payment processing, and analytics.

## Core Tables

### organizations

Multi-tenant organization table with plan-based feature gating.

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'agency')),
    white_label_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique organization identifier
- `name`: Organization display name
- `plan`: Subscription plan (starter/pro/agency)
- `white_label_settings`: JSON configuration for white-label features
- `created_at`, `updated_at`: Timestamps with auto-update trigger

**Relationships:**
- One-to-many with users table
- One-to-many with articles table
- One-to-many with subscriptions table

### users

User table linked to organizations with RBAC roles.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique user identifier
- `email`: User email (unique across system)
- `org_id`: Organization foreign key
- `role`: User role within organization (owner/admin/member)
- `full_name`: Display name
- `avatar_url`: Profile image URL

**Relationships:**
- Many-to-one with organizations
- One-to-many with articles (author)

### subscriptions

Stripe subscription management for organizations.

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    plan TEXT NOT NULL,
    status TEXT NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    grace_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `stripe_subscription_id`: Stripe subscription identifier
- `stripe_customer_id`: Stripe customer identifier
- `plan`: Subscription plan
- `status`: Subscription status (active/canceled/trialing/etc.)
- `current_period_start/end`: Current billing period
- `trial_end`: Trial period end
- `grace_period_end`: Grace period for failed payments

### team_invitations

Team invitation system for adding users to organizations.

```sql
CREATE TABLE team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    invited_by_user_id UUID REFERENCES users(id),
    token TEXT UNIQUE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `email`: Invitee email address
- `role`: Role to assign when accepted
- `invited_by_user_id`: User who sent invitation
- `token`: Unique invitation token
- `accepted_at`: When invitation was accepted
- `expires_at`: Invitation expiration

## Content Management Tables

### articles

AI-generated content with metadata and publishing status.

```sql
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    word_count INTEGER,
    generation_metadata JSONB,
    wordpress_post_id TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `title`: Article title
- `content`: Generated article content
- `status`: Draft/published/archived
- `word_count`: Article length
- `generation_metadata`: AI generation parameters and metrics
- `wordpress_post_id`: WordPress post ID for published articles
- `published_at`: Publication timestamp

### publish_references

Idempotency tracking for WordPress publishing (Story 5-1).

```sql
CREATE TABLE publish_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    wordpress_post_id TEXT,
    wordpress_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(article_id)
);
```

**Purpose:** Ensures idempotent publishing by tracking article-to-WordPress mappings.

## Analytics and Performance Tables

### performance_metrics

Content generation performance tracking.

```sql
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id),
    metric_type TEXT NOT NULL,
    value NUMERIC,
    unit TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Metric Types:**
- Generation time (seconds)
- Token usage
- API costs
- Quality scores

### analytics_recommendations

AI-generated content optimization recommendations.

```sql
CREATE TABLE analytics_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id),
    recommendation_type TEXT NOT NULL,
    content TEXT,
    priority INTEGER DEFAULT 1,
    implemented_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security and Audit Tables

### otp_codes

OTP verification for user registration.

```sql
CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### activity_logs

Comprehensive audit logging for compliance.

```sql
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Database Features

### Row Level Security (RLS)

All tables implement RLS policies to ensure:
- Users can only access their organization's data
- Role-based permissions within organizations
- Audit trail for all data access

### Indexes

Performance-optimized indexes on:
- Foreign key relationships
- Frequently queried fields (email, status, dates)
- Unique constraints for data integrity

### Triggers

- `update_updated_at_column()`: Auto-updates timestamp fields
- Data validation triggers
- Audit logging triggers

### Constraints

- CHECK constraints for enum values
- Foreign key constraints with CASCADE deletes
- UNIQUE constraints for business rules

## Migration Strategy

Database schema is managed through versioned migrations in `/supabase/migrations/`:
- `20260101124156_initial_schema.sql`: Core tables
- `20260104095303_link_auth_users.sql`: Auth integration
- `20260104100500_add_otp_verification.sql`: OTP system
- `20260105003507_add_stripe_payment_fields.sql`: Payment integration
- Additional migrations for features and fixes

## Data Privacy

- GDPR-compliant data handling
- Right to deletion implemented
- Data retention policies
- Secure data encryption at rest

## Performance Considerations

- Connection pooling via Supabase
- Query optimization for multi-tenant patterns
- Efficient pagination for large datasets
- Caching strategies for frequently accessed data
