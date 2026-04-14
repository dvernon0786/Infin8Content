---
description: Development guide (deep-scan)
---

# Development Guide — Infin8Content

**Generated:** 2026-04-10

Local setup (short)
1. Install dependencies (from repository root):

```bash
cd infin8content
npm install
```

2. Copy environment variables (do NOT commit `.env.local`):

```bash
cp .env.example .env.local
# Edit .env.local with local credentials (use secret manager for CI)
```

Common developer commands

- Start dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Type checks: `npm run typecheck`
- Run tests: `npm run test`, `npm run test:integration`, `npm run test:e2e`
- Storybook: `npm run storybook`

Testing & quality gates
- Unit/integration: Vitest
- E2E & visual: Playwright
- CI: GitHub Actions triggers tests and visual-regression workflows

Feature workflow
1. Create branch `story/<id>-short-description`.
2. Implement feature with tests.
3. Run `npm run typecheck` and `npm run lint` locally.
4. Open PR with testing instructions and link the issue/story.

Notes for contributors
- Avoid committing secrets. Add `.env*` to `.gitignore`.
- Follow FSM guard patterns when changing workflow logic.
- Update `docs/` when adding APIs or DB migrations.
