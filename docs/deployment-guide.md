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

1. **Database Migrations**:
   Ensure all migrations from `supabase/migrations/` are applied to the production project via the Supabase CLI.

2. **Environment Configuration**:
   Verify all production environment variables are set in the Vercel/Supabase dashboards.

3. **Build & Deploy**:
   Push to the `main` branch to trigger the Vercel production build.

4. **Monitoring**:
   Monitor Sentry for runtime errors and Inngest Cloud for workflow health.

## Rollback Strategy

- **Feature Flags**: Critical features (like WordPress publishing) can be toggled via environment variables without a re-deploy.
- **Vercel Rollback**: Use the Vercel dashboard to revert to a previous successful deployment if needed.
