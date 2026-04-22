# Development Guide

Generated: 2026-03-17
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

## Git Workflow: Direct Production Deployment

**Key Rule:** Any push to `test-main-all` = Production deployment on Vercel. Any other branch = Preview deployment. No PRs needed for production — merge locally and push directly.

### Complete Workflow:

```bash
# 1. Start from clean test-main-all
git checkout test-main-all
git pull origin test-main-all

# 2. Create topic branch
git checkout -b fix/your-feature-name

# 3. Make changes, then commit
git add .
git commit -m "fix: description of change"

# 4. Push topic branch
git push -u origin fix/your-feature-name

# 5. Merge directly to test-main-all (triggers Production on Vercel)
git checkout test-main-all
git merge fix/your-feature-name
git push origin test-main-all

# Configure git identity (if needed)
git config user.name "Damien"
git config user.email "engagehubonline@gmail.com"
```

### Important Notes:
- `test-main-all` is the production branch
- All merges to `test-main-all` trigger immediate Vercel production deployment
- Use topic branches for development, then merge directly
- No PR review required for production merges

---
*Compliance: All commits must pass the ESLint Design System check.*
