# Data Models - infin8content

Generated: 2026-02-26  
Scan Level: Deep  

## Database Schema Overview

- **Provider**: Supabase (PostgreSQL)
- **Management**: SQL Migrations (`supabase/migrations/`)
- **Security**: Row Level Security (RLS) enabled on all tables

## Core Tables

### Content & Workflows
- **articles**: Central table for generated content. Tracks status, metadata, and Inngest event IDs.
- **article_sections**: Individual sections of a generated article.
- **keywords**: Keyword research data, intent classification, and workflow associations.
- **topic_clusters**: Groupings of related keywords for content planning.

### Usage & Billing
- **usage_tracking**: Cumulative usage metrics for organizations (e.g., article generation counts).
- **ai_usage_ledger**: Detailed log of AI credits and costs per operation.
- **rate_limits**: Organization-specific throttling limits.

### Security & Audit
- **audit_log**: Complete activity trail for compliance.
- **workflow_transition_audit**: Specific tracking of state changes in content workflows.

### Integrations
- **publish_references**: Mapping of articles to external platform IDs (e.g., WordPress Post IDs).
- **intent_approvals**: Tracking of user approvals for AI-generated intents and subtopics.
