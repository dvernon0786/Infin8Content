---
description: Architecture overview (summary)
---

# Architecture Overview — Deep Scan (summary)

**Derived from:** `docs/project-documentation/ARCHITECTURE_OVERVIEW.md`
**Generated:** 2026-04-10

Short summary
- Infin8Content is built around a zero-legacy deterministic FSM orchestrating a 9-step content generation workflow.
- Frontend: Next.js (App Router), React, TypeScript; UI built with shadcn/ui and Tailwind.
- Backend: Next.js API routes, Supabase Postgres, Inngest for background jobs.
- AI Integrations: OpenRouter (multi-model), Tavily, DataForSEO; publishing via WordPress adapters.

Core principles
- Atomic state transitions (DB-level WHERE clause guards).
- Multi-tenant data isolation via Row Level Security (RLS).
- Deterministic FSM (no legacy fields; single forward path per workflow).

Where to find code
- FSM: `infin8content/lib/fsm/`
- Services: `infin8content/lib/services/`
- API routes: `infin8content/app/api/`
- DB migrations: `infin8content/supabase/migrations/`
