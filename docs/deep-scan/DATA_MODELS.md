---
description: Data models (summary & references)
---

# Data Models — Infin8Content

**Generated:** 2026-04-10

Source of truth
- `infin8content/supabase/migrations/` — SQL migrations are the canonical source for table definitions.

Core tables (summary)

- `intent_workflows` — Master workflow records (id, organization_id, state, workflow_data JSONB, created_at, updated_at)
- `keywords` — Keyword hierarchy (seed → longtail → subtopics) with type/status fields
- `topic_clusters` — Hub-and-spoke clusters and similarity scores
- `articles` — Generated content records (title, content, status)
- `audit_logs` — Governance and action audit trail
- `usage_tracking` — Billing and plan metrics

How to build a canonical ERD
1. Parse the latest migration files (the most recent migrations/ folder snapshot).
2. Extract `CREATE TABLE` statements and foreign key relationships.
3. Use a tool (dbdiagram.io, quickdatabasediagram) to render ERD from SQL.

Recommended artifacts to add to docs
- `docs/models/ERD.png` or `docs/models/erd.md` with a rendered diagram
- `docs/models/table-reference.md` — per-table column types and constraints
