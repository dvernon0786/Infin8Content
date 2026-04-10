---
description: Complete codebase analysis (deep-scan summary)
---

# Complete Codebase Analysis — Deep Scan

**Generated:** 2026-04-10

This document summarizes the repository structure, critical subsystems, testing posture, and operational considerations.

Highlights
- Architecture: Zero-legacy deterministic FSM implementing a 9-step content workflow.
- Frontend: Next.js 16.x, React 19.x, TypeScript 5.x, Storybook for UI components.
- Backend / API: Next.js App Router API routes (multiple categories: intent, workflows, publishing, auth, analytics).
- Workflow Engine: `infin8content/lib/fsm/` — atomic state transitions, audit logging.
- Background processing: Inngest workers for long-running steps and queuing.
- Database: Supabase (Postgres) migrations under `infin8content/supabase/migrations/`.
- Testing: Vitest (unit/contract/integration) and Playwright (E2E/visual).

Code quality & safety
- TypeScript strictness and extensive test suites are present in the repo (see existing reports).
- FSM patterns enforce concurrency safety via WHERE-clause updates.

Important paths
- App router / APIs: `infin8content/app/api/` (or `pages/api/` where present)
- FSM: `infin8content/lib/fsm/`
- Services: `infin8content/lib/services/`
- Migrations: `infin8content/supabase/migrations/`
- Components & UI: `infin8content/components/` and Storybook config
- CI workflows: `.github/workflows/`

Recommendations
1. Remove any local `.env.local` files from the repository and rotate exposed keys immediately. See [Security Findings](docs/deep-scan/SECURITY_FINDINGS.md).
2. Generate an OpenAPI spec from the API routes and include it in `docs/`.
3. Produce a canonical ERD from `supabase/migrations/` and publish it in `docs/`.
4. Keep FSM state machine and transitions documented alongside `lib/fsm/` code; add diagrams.

For more granular, per-area analysis see the related artifacts in this folder.
