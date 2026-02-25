# API Contracts - infin8content

Generated: 2026-02-26  
Scan Level: Deep  

## Core API Patterns

- **Framework**: Next.js 16 App Router (`app/api/`)
- **Validation**: Zod (schema-based request parsing)
- **Authentication**: Supabase Auth (via `getCurrentUser`)
- **Error Handling**: Standardized JSON responses with HTTP status codes
- **Feature Flags**: Environment-variable based toggles (e.g., `WORDPRESS_PUBLISH_ENABLED`)
- **Queueing**: Inngest integration for background tasks

## Endpoint Catalog

### Articles
- **POST /api/articles/generate**: Triggers AI article generation workflow. Enforces plan limits and status transitions.
- **POST /api/articles/publish**: Publishes article to WordPress. Supports custom credentials and handles idempotency.
- **GET /api/articles/status**: Retrieves generation status for a specific article.
- **GET /api/articles/usage**: Returns current month's generation quota usage.
- **POST /api/articles/fix-broken-citations**: Utility to repair citation links in generated content.

### Onboarding
- **POST /api/onboarding/business**: Persists business details during initial setup.
- **POST /api/onboarding/competitors**: Saves competitor list for SEO analysis.
- **GET /api/onboarding/status**: Checks current onboarding progress for the organization.

### Workflows
- **POST /api/workflows/[id]/approve-subtopics-bulk**: Approves multiple subtopics in a single request.
- **GET /api/workflows/[id]/subtopics-for-review**: Retrieves subtopics requiring manual approval.

### SEO & Research
- **POST /api/seo/score**: Calculates SEO score for given content.
- **GET /api/research/keywords**: Fetches keyword research data from external providers.

### Debug & Internal
- **GET /api/debug/auth-test**: Verifies authentication session status.
- **GET /api/debug/payment-status**: Checks Stripe subscription status for debugging.
