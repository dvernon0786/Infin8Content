---
description: Source tree analysis (deep-scan)
---

# Source Tree Analysis — Deep Scan

**Generated:** 2026-04-10

Top-level layout (summary)

- `infin8content/` — primary application (Next.js App Router)
  - `app/` — Next.js App Router routes and pages
  - `components/` — UI components used across the app
  - `lib/` — business logic, FSM, services, adapters
  - `supabase/migrations/` — SQL migrations (authoritative DB changes)
  - `scripts/` — small runner/test scripts
  - `__tests__/` — unit and integration tests

- `docs/` — project and analysis documentation (many existing artifacts)
- `.github/workflows/` — CI and test automation
- `tools/` — monorepo and design-system tooling

Important notes
- Migrations are timestamped and numerous — use them as the canonical data model source.
- FSM code is centralized under `lib/fsm/` — this is the single source of truth for workflow states.
- External service adapters live under `lib/services/` and `lib/services/*/` (OpenRouter, Tavily, DataForSEO, publishing adapters).

How to reproduce an inventory
1. File list: `rg --files --hidden --glob '!node_modules' | sed -n '1,200p'`
2. Component inventory: `rg "export default" components | sed -e 's/:.*//' | sort -u`
3. API routes: list `app/api` and `pages/api` directories for route definitions.
