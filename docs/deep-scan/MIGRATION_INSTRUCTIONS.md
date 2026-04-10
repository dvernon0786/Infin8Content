---
description: Migration instructions and how to apply DB migrations
---

# Migration Instructions — Infin8Content

**Generated:** 2026-04-10

Location of migrations
- `infin8content/supabase/migrations/` — timestamped SQL migration files (source of truth)

Common workflows

Apply migrations locally using Supabase CLI (recommended):

```bash
# install supabase CLI if needed
supabase login
cd infin8content
supabase db push --preview  # review SQL first
supabase db push            # apply changes to local project DB
```

Apply a single SQL file via psql (example):

```bash
psql "$DATABASE_URL" -f infin8content/supabase/migrations/20260108_add_articles_table.sql
```

Best practices
- Keep migrations small and idempotent when possible.
- Always run migrations against staging before production.
- Record migration application runs in CI logs.

Rolling back
- Supabase migrations are forward-only SQL files. To roll back, create compensating migrations or use a point-in-time restore if available.

Automation
- Add a CI job that runs migrations against a test DB and validates schema (e.g., `pg_dump --schema-only` comparison).
