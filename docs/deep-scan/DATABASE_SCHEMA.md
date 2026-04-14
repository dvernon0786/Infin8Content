---
description: Database schema summary
---

# Database Schema — Summary

**Generated:** 2026-04-10

Source of truth: `infin8content/supabase/migrations/` (timestamped SQL files)

Core tables (summary view)

- `intent_workflows`
  - id (UUID PK)
  - organization_id (UUID FK)
  - state (ENUM) — FSM state
  - workflow_data (JSONB)
  - created_at, updated_at

- `keywords`
  - id (UUID)
  - workflow_id (UUID)
  - parent_seed_keyword_id (UUID)
  - keyword_text (TEXT)
  - keyword_type (ENUM: seed|longtail|subtopic)
  - status flags (longtail_status, subtopics_status)

- `topic_clusters`
  - id (UUID)
  - workflow_id (UUID)
  - hub_keyword_id (UUID)
  - spoke_keyword_id (UUID)
  - similarity_score (DECIMAL)

- `articles`
  - id (UUID)
  - workflow_id (UUID)
  - keyword_id (UUID)
  - title (TEXT)
  - content (TEXT)
  - status (ENUM)

- `audit_logs` and `usage_tracking` (audit and billing/limits)

How to produce full schema docs
1. Parse all `CREATE TABLE` statements in `supabase/migrations/` and assemble a single `schema.sql`.
2. Convert `schema.sql` to an ERD with `dbdiagram.io` or `schemaspy`.
3. Publish the ERD and per-table column reference in `docs/models/`.
