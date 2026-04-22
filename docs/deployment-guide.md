# Deployment Guide - Infin8Content

Generated: 2026-03-17  

## Infrastructure Overview

- **Frontend Hosting**: Vercel (preferred for Next.js 16)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Workflow Orchestration**: Inngest Cloud
- **Email**: Brevo

## CI/CD Pipeline

The project uses GitHub Actions for automated validation:

- **ci.yml**: Runs unit tests and type checks on every PR.
- **visual-regression.yml**: Executes Playwright visual tests to detect UI drift.
- **performance.yml**: Monitors bundle size and Lighthouse performance metrics.
- **design-system.yml**: Enforces compliance with the custom design system rules.

## Deployment Steps

### Git Workflow: Direct Production Deployment

**Key Rule:** Any push to `test-main-all` = Production deployment on Vercel. Any other branch = Preview deployment. No PRs needed for production — merge locally and push directly.

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
```

### Infrastructure Steps

1. **Database Migrations**:
   Ensure all migrations from `supabase/migrations/` are applied to the production project via the Supabase CLI.

2. **Environment Configuration**:
   Verify all production environment variables are set in the Vercel/Supabase dashboards.

3. **Build & Deploy**:
   Push to the `test-main-all` branch to trigger the Vercel production build.

4. **Monitoring**:
   Monitor Sentry for runtime errors and Inngest Cloud for workflow health.

## Rollback Strategy

- **Feature Flags**: Critical features (like WordPress publishing) can be toggled via environment variables without a re-deploy.
- **Vercel Rollback**: Use the Vercel dashboard to revert to a previous successful deployment if needed.
