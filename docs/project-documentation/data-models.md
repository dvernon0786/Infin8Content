# Data Models & Database Schema: Infin8Content

Infin8Content uses a multitenant PostgreSQL database managed via Supabase. The schema is optimized for workflow state tracking, content versioning, and research caching.

## 1. Core Entities

### `organizations`
The root tenant entity. All data is scoped to an organization.
- `id`: UUID (Primary Key)
- `name`: Text
- `stripe_customer_id`: Text
- `subscription_status`: Enum (active, trialing, past_due, canceled)

### `users`
Extensions to the `auth.users` system table.
- `id`: UUID (References auth.users)
- `organization_id`: UUID (References organizations)
- `role`: Enum (owner, admin, editor)
- `first_name`, `last_name`: Text

### `articles`
The central content record.
- `id`: UUID
- `organization_id`: UUID
- `title`: Text
- `status`: Enum (draft, queued, processing, completed, failed)
- `workflow_state`: JSONB (Stores intermediate planning data)
- `article_type`: Enum (general, listicle, news)
- `seo_score`: Integer

### `article_sections`
Granular pieces of a generated article.
- `id`: UUID
- `article_id`: UUID
- `title`: Text
- `content`: Markdown Text
- `section_index`: Integer
- `research_context`: JSONB

## 2. Research & Intent

### `keyword_research`
Stores the results of keyword analysis.
- `id`: UUID
- `keyword`: Text
- `search_volume`: Integer
- `difficulty`: Float
- `intent_classification`: Text

### `intent_workflows`
The state tracking for the multi-step creation flow.
- `id`: UUID
- `organization_id`: UUID
- `current_step`: Integer (1-9)
- `data`: JSONB (Accumulated onboarding data)

### `tavily_research_cache`
Performance optimization layer.
- `query_hash`: Text (Primary Key)
- `raw_results`: JSONB
- `expires_at`: Timestamp

## 3. Infrastructure & Metadata

### `activities`
Audit log for system and user events.
- `id`: UUID
- `organization_id`: UUID
- `user_id`: UUID
- `event_type`: Text (e.g., article_completed)
- `metadata`: JSONB

### `usage_tracking`
Cost and token monitoring per article.
- `article_id`: UUID
- `model_name`: Text
- `input_tokens`: Integer
- `output_tokens`: Integer
- `estimated_cost`: Decimal

## 🔐 Security (RLS)
Every table implements Row-Level Security:
- **Select**: `WHERE organization_id = auth.jwt() ->> 'org_id'`
- **Insert/Update**: Handled via triggers or strict check constraints on `organization_id`.

---
_Database Engine: PostgreSQL 15+ (Supabase Managed)_
