# Development Guide

Generated: 2026-02-28
Standards: **Zero Drift Protocol**

## Local Setup

1.  **Clone & Install**:
    ```bash
    npm install
    ```
2.  **Supabase**:
    - Link project: `npx supabase link`
    - Start local DB: `npx supabase start`
3.  **Inngest**:
    - Start dev server: `npx inngest-cli@latest dev`
4.  **Environment**:
    - Copy `.env.example` -> `.env.local`
    - Configure `OPENROUTER_API_KEY`, `TAVILY_API_KEY`, `STRIPE_SECRET_KEY`.

## Development Principles

### 1. Lifecycle Integrity
- **DO NOT** add local state to DASHBOARD components that duplicates article status.
- **DO NOT** call Supabase directly for writes from the UI; use the specific API routes.
- **RESTRICTION**: All article state changes must originate from an API Route or Inngest Function.

### 2. Testing
- **E2E**: `npm run test:e2e` (Playwright) - Focus on generation workflows.
- **Unit**: `npm run test` (Vitest) - Focus on lib-layer logic and FSM transitions.

### 3. Database Changes
- All schema changes must be migrations in `supabase/migrations/`.
- No manual schema editing via UI.

## Deployment

Deployments are managed via GitHub Actions.
- **Main Branch**: Deploys to Production.
- **Develop Branch**: Deploys to Staging.

---
*Compliance: All commits must pass the ESLint Design System check.*
