# Data Models - Infin8Content

This document describes the database schema and data models for the Infin8Content platform, hosted on Supabase (PostgreSQL).

## Overview
The platform uses a relational schema with Row Level Security (RLS) to ensure multi-tenant data isolation at the organization level.

## Core Tables

### Organizations
Centralized entity for multi-tenancy.
- `id`: UUID (Primary Key)
- `name`: Text
- `slug`: Text (Unique)
- `stripe_customer_id`: Text (Optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Profiles (Users)
Extension of Supabase Auth users.
- `id`: UUID (FKey to `auth.users`)
- `email`: Text
- `first_name`: Text
- `last_name`: Text
- `role`: Text (Enum: owner, admin, member, viewer)
- `avatar_url`: Text
- `created_at`: Timestamp

### Organization Members
Join table for users and organizations.
- `organization_id`: UUID (FKey to `organizations`)
- `user_id`: UUID (FKey to `profiles`)
- `role`: Text
- `joined_at`: Timestamp

### Team Invitations
Tracks pending invitations.
- `id`: UUID
- `organization_id`: UUID
- `email`: Text
- `role`: Text
- `inviter_id`: UUID
- `token`: Text
- `expires_at`: Timestamp
- `status`: Text (pending, accepted, expired)

## Intent Workflow (FSM) Tables

### Intent Workflows
Tracks the high-level content strategy execution.
- `id`: UUID
- `organization_id`: UUID
- `status`: Text (Enum representing FSM states: `icp_generating`, `ready_for_review`, etc.)
- `current_step`: Integer
- `data`: JSONB (Stores step-specific metadata like keyword lists, ICP details)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Intent Audit Logs
Immutable record of workflow state transitions and decisions.
- `id`: UUID
- `workflow_id`: UUID
- `action`: Text
- `actor_id`: UUID
- `previous_state`: JSONB
- `new_state`: JSONB
- `metadata`: JSONB
- `created_at`: Timestamp

## Content & SEO Tables

### Articles
Stores generated content and its status.
- `id`: UUID
- `organization_id`: UUID
- `workflow_id`: UUID (Optional, link to origin)
- `title`: Text
- `content`: Text (Markdown)
- `outline`: JSONB
- `status`: Text (draft, generating, published, error)
- `seo_score`: Float
- `google_indexing_status`: Text
- `published_at`: Timestamp
- `created_at`: Timestamp

### Article Progress
Real-time tracking for the generation pipeline.
- `article_id`: UUID (Primary Key)
- `current_stage`: Text
- `percentage`: Integer
- `estimated_time_remaining`: Text
- `status_message`: Text
- `updated_at`: Timestamp

### Keyword Research Cache
Stores results from SEO APIs (Tavily, DataForSEO).
- `id`: UUID
- `query`: Text
- `results`: JSONB
- `expires_at`: Timestamp
- `created_at`: Timestamp

## Supporting Tables

### Usage Tracking
Monitors quota consumption based on subscription plans.
- `organization_id`: UUID
- `feature_key`: Text (e.g., `article_generation`)
- `usage_count`: Integer
- `limit`: Integer
- `period_start`: Timestamp
- `period_end`: Timestamp

### Performance Metrics
Tracks system efficiency and user engagement.
- `id`: UUID
- `metric_name`: Text
- `value`: Float
- `metadata`: JSONB
- `timestamp`: Timestamp

## Security Design
- **Row Level Security (RLS)**: Enabled on all tables. Policies ensure that users can only access data belonging to organizations they are members of.
- **Triggers**: Automated audit logging and progress synchronization.
- **Enums**: Strict type checks for workflow and article statuses.
