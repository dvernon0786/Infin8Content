# Data Models Documentation

Generated: 2026-01-11  
Project: Infin8Content  
Database: Supabase (PostgreSQL)  
Total Tables: 12

---

## Database Overview

Infin8Content uses Supabase (PostgreSQL) with Row Level Security (RLS) enabled for multi-tenant architecture. All tables include organization isolation and comprehensive audit trails.

## Core Tables

### organizations

Multi-tenant organization management with subscription-based features.

**Columns:**
- `id` (uuid, primary_key) - Unique organization identifier
- `name` (text) - Organization display name
- `stripe_customer_id` (text) - Stripe customer reference
- `subscription_id` (text) - Active subscription ID
- `subscription_status` (text) - Subscription status (active/canceled/past_due/incomplete)
- `subscription_price_id` (text) - Current plan price ID
- `plan_type` (text) - Plan tier (starter/pro/agency)
- `subscription_current_period_end` (timestamptz) - Subscription renewal date
- `subscription_cancel_at_period_end` (boolean) - Cancellation flag
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Constraints:**
- Unique constraint on `stripe_customer_id`
- Not null constraints on `name`, `created_at`

**RLS Policies:**
- Users can read their own organization
- Organization admins can update organization details

### users

User accounts linked to organizations with role-based permissions.

**Columns:**
- `id` (uuid, primary_key) - User identifier (matches Supabase auth.users.id)
- `email` (text) - User email address
- `first_name` (text) - User first name
- `last_name` (text) - User last name
- `organization_id` (uuid, foreign_key → organizations.id) - Organization membership
- `role` (text) - User role (admin/member/viewer)
- `suspended` (boolean) - Account suspension status
- `suspension_reason` (text) - Reason for suspension
- `created_at` (timestamptz) - Account creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Constraints:**
- Foreign key constraint to organizations
- Not null constraints on `email`, `organization_id`, `role`
- Unique constraint on `email` within organization

**RLS Policies:**
- Users can read their own profile
- Organization members can read other members' profiles
- Organization admins can update member roles

### team_invitations

Team member invitation system with expiration and role management.

**Columns:**
- `id` (uuid, primary_key) - Invitation identifier
- `email` (text) - Invitee email address
- `organization_id` (uuid, foreign_key → organizations.id) - Target organization
- `invited_by` (uuid, foreign_key → users.id) - Inviter user ID
- `role` (text) - Role to assign upon acceptance (admin/member/viewer)
- `token` (text) - Invitation token for verification
- `accepted` (boolean) - Acceptance status
- `accepted_at` (timestamptz) - Acceptance timestamp
- `accepted_by` (uuid, foreign_key → users.id) - User who accepted
- `expires_at` (timestamptz) - Invitation expiration
- `created_at` (timestamptz) - Invitation creation timestamp

**Constraints:**
- Foreign key constraints to organizations and users
- Not null constraints on `email`, `organization_id`, `role`, `token`
- Unique constraint on `token`

**RLS Policies:**
- Organization members can read pending invitations
- Organization admins can manage invitations
- Invitees can access their own invitations via token

### audit_logs

Comprehensive activity tracking for compliance and security monitoring.

**Columns:**
- `id` (uuid, primary_key) - Log entry identifier
- `organization_id` (uuid, foreign_key → organizations.id) - Organization context
- `user_id` (uuid, foreign_key → users.id) - Acting user (nullable for system actions)
- `action` (text) - Action performed (create/update/delete/login/etc.)
- `resource_type` (text) - Resource type (user/article/organization/etc.)
- `resource_id` (uuid) - Resource identifier
- `old_values` (jsonb) - Previous state (for updates)
- `new_values` (jsonb) - New state (for creates/updates)
- `ip_address` (text) - Client IP address
- `user_agent` (text) - Client user agent
- `created_at` (timestamptz) - Log entry timestamp

**Constraints:**
- Foreign key constraints to organizations and users
- Not null constraints on `organization_id`, `action`, `created_at`

**RLS Policies:**
- Organization members can read audit logs for their organization
- System logs (user_id = null) only visible to admins

## Content Management Tables

### articles

AI-generated content with progress tracking and metadata.

**Columns:**
- `id` (uuid, primary_key) - Article identifier
- `organization_id` (uuid, foreign_key → organizations.id) - Owner organization
- `user_id` (uuid, foreign_key → users.id) - Creator user
- `title` (text) - Article title
- `topic` (text) - Article topic/theme
- `tone` (text) - Content tone (professional/casual/etc.)
- `length` (integer) - Target word count
- `status` (text) - Generation status (queued/generating/completed/failed/canceled)
- `content` (text) - Generated article content
- `outline` (jsonb) - Article structure/outline
- `keywords` (text[]) - SEO keywords array
- `progress` (integer) - Generation progress percentage (0-100)
- `error_message` (text) - Error details if failed
- `started_at` (timestamptz) - Generation start time
- `completed_at` (timestamptz) - Completion timestamp
- `created_at` (timestamptz) - Article creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Constraints:**
- Foreign key constraints to organizations and users
- Not null constraints on `organization_id`, `user_id`, `title`, `status`

**RLS Policies:**
- Users can read articles from their organization
- Article creators can update their own articles
- Organization admins can access all organization articles

### keyword_research

SEO keyword research data and analysis results.

**Columns:**
- `id` (uuid, primary_key) - Research identifier
- `organization_id` (uuid, foreign_key → organizations.id) - Owner organization
- `user_id` (uuid, foreign_key → users.id) - Research creator
- `keyword` (text) - Primary keyword
- `search_volume` (integer) - Monthly search volume
- `difficulty` (decimal) - SEO difficulty score
- `competition` (decimal) - Competition level
- `cpc` (decimal) - Cost per click
- `related_keywords` (jsonb) - Related keywords data
- `search_intent` (text) - Search intent category
- `tavily_data` (jsonb) - Raw Tavily API response
- `dataforseo_data` (jsonb) - DataForSEO analysis results
- `created_at` (timestamptz) - Research timestamp

**Constraints:**
- Foreign key constraints to organizations and users
- Not null constraints on `organization_id`, `user_id`, `keyword`

**RLS Policies:**
- Users can read research from their organization
- Research creators can update their own research
- Organization admins can access all organization research

### tavily_research_cache

Cached research results to optimize API costs and improve performance.

**Columns:**
- `id` (uuid, primary_key) - Cache entry identifier
- `query_hash` (text) - Hash of research query for lookup
- `query` (text) - Original research query
- `response_data` (jsonb) - Cached Tavily API response
- `expires_at` (timestamptz) - Cache expiration time
- `hit_count` (integer) - Number of times cache accessed
- `created_at` (timestamptz) - Cache creation timestamp

**Constraints:**
- Unique constraint on `query_hash`
- Not null constraints on `query_hash`, `query`, `response_data`

**RLS Policies:**
- Cache is globally accessible (read-only for optimization)
- System-only write access

## Payment Tables

### stripe_customers

Stripe customer management and synchronization.

**Columns:**
- `id` (uuid, primary_key) - Local record identifier
- `organization_id` (uuid, foreign_key → organizations.id) - Associated organization
- `stripe_customer_id` (text) - Stripe customer identifier
- `email` (text) - Customer email
- `name` (text) - Customer display name
- `metadata` (jsonb) - Additional Stripe metadata
- `created_at` (timestamptz) - Record creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Constraints:**
- Foreign key constraint to organizations
- Unique constraint on `stripe_customer_id`

**RLS Policies:**
- Organization admins can read their customer data
- System-only write access (Stripe webhook sync)

### subscriptions

Subscription tracking and plan management.

**Columns:**
- `id` (uuid, primary_key) - Subscription identifier
- `organization_id` (uuid, foreign_key → organizations.id) - Subscribed organization
- `stripe_subscription_id` (text) - Stripe subscription identifier
- `status` (text) - Subscription status
- `price_id` (text) - Current price identifier
- `quantity` (integer) - Subscription quantity
- `current_period_start` (timestamptz) - Current period start
- `current_period_end` (timestamptz) - Current period end
- `cancel_at_period_end` (boolean) - Cancellation flag
- `canceled_at` (timestamptz) - Cancellation timestamp
- `trial_start` (timestamptz) - Trial period start
- `trial_end` (timestamptz) - Trial period end
- `metadata` (jsonb) - Additional subscription metadata
- `created_at` (timestamptz) - Subscription creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Constraints:**
- Foreign key constraint to organizations
- Unique constraint on `stripe_subscription_id`

**RLS Policies:**
- Organization admins can read subscription status
- System-only write access (Stripe webhook sync)

### payment_grace_periods

7-day grace period management for failed payments.

**Columns:**
- `id` (uuid, primary_key) - Grace period identifier
- `organization_id` (uuid, foreign_key → organizations.id) - Affected organization
- `subscription_id` (uuid, foreign_key → subscriptions.id) - Related subscription
- `starts_at` (timestamptz) - Grace period start
- `ends_at` (timestamptz) - Grace period end
- `status` (text) - Grace period status (active/expired/resolved)
- `notifications_sent` (integer) - Count of notifications sent
- `last_notification_at` (timestamptz) - Last notification timestamp
- `resolved_at` (timestamptz) - Resolution timestamp
- `created_at` (timestamptz) - Grace period creation timestamp

**Constraints:**
- Foreign key constraints to organizations and subscriptions
- Not null constraints on `organization_id`, `subscription_id`, `starts_at`, `ends_at`

**RLS Policies:**
- Organization admins can read grace period status
- System-only write access (automated management)

## Database Features

### Row Level Security (RLS)
- All tables have RLS enabled for multi-tenant isolation
- Organization-based data segregation
- Role-based access control within organizations

### Indexes
- Primary key indexes on all tables
- Foreign key indexes for join performance
- Composite indexes on frequently queried columns
- Unique constraints on business-critical fields

### Triggers and Functions
- Automatic timestamp updates (created_at/updated_at)
- Audit log generation for data changes
- Article progress synchronization triggers
- Cache cleanup automation

### Data Integrity
- Foreign key constraints with proper cascading
- Check constraints for business rules
- Not null constraints on required fields
- Unique constraints to prevent duplicates

## Migration Strategy

- **Version Control**: All migrations timestamped and ordered
- **Rollback Support**: Migration files include rollback procedures
- **Data Safety**: Migrations include data preservation steps
- **Testing**: All migrations tested on staging before production

---

*This documentation was generated as part of the BMad Method document-project workflow on 2026-01-11.*
