# API Contracts - Infin8Content

This document provides a comprehensive catalog of the API endpoints available in the Infin8Content platform.

## Base URL
All API requests are relative to the application's root URL (e.g., `https://app.infin8content.com/api`).

## Authentication
Most endpoints require an active session via Supabase Auth. Authentication is typically handled via `cookie` or `authorization` headers.

## Endpoints Catalog

### Authentication
- `POST /auth/login` - User login initiation.
- `POST /auth/register` - New user registration.
- `POST /auth/verify-otp` - OTP code verification.
- `POST /auth/resend-otp` - Resend verification code.
- `POST /auth/logout` - Invalidate user session.

### Intent Workflows (FSM)
- `GET /intent/workflows` - List all intent workflows for the organization.
- `POST /intent/workflows` - Create a new intent workflow.
- `GET /intent/workflows/[id]` - Get detailed state and data for a specific workflow.
- `POST /intent/workflows/[id]/cancel` - Cancel an active workflow.
- `GET /intent/workflows/[id]/blocking-conditions` - Check for conditions preventing progression.

#### Workflow Steps
- `POST /intent/workflows/[id]/steps/icp-generate` - Generate Ideal Customer Profile.
- `POST /intent/workflows/[id]/steps/competitor-analyze` - Analyze competitor content.
- `POST /intent/workflows/[id]/steps/seed-extract` - Extract seed keywords.
- `POST /intent/workflows/[id]/steps/cluster-topics` - Cluster keywords into topics.
- `POST /intent/workflows/[id]/steps/filter-keywords` - User review of keyword filtering.
- `POST /intent/workflows/[id]/steps/validate-clusters` - Validate topic clusters.
- `POST /intent/workflows/[id]/steps/longtail-expand` - Expand into longtail keywords.
- `POST /intent/workflows/[id]/steps/human-approval` - Submit for final human review.
- `POST /intent/workflows/[id]/steps/queue-articles` - Queue approved topics for generation.
- `POST /intent/workflows/[id]/steps/link-articles` - Link generated articles back to the workflow.

### Article Generation
- `POST /articles/generate` - Initiate article generation pipeline.
- `GET /intent/workflows/[id]/articles/progress` - Monitor real-time generation progress.

### Organization & Team
- `GET /organizations` - List user's organizations (via `create` and `update` routes).
- `POST /organizations/create` - Create a new organization.
- `PUT /organizations/update` - Update organization settings.
- `GET /team/members` - List organization members.
- `POST /team/invite` - Invite a new team member.
- `POST /team/update-role` - Change member permissions.

### Analytics & Metrics
- `GET /admin/metrics/dashboard` - High-level system metrics.
- `GET /admin/metrics/efficiency-summary` - Project efficiency statistics.
- `GET /analytics/metrics` - Detailed analytics data.
- `GET /analytics/trends` - Historical performance trends.
- `POST /analytics/export/[format]` - Export data as CSV or PDF.

### Onboarding
- `GET /onboarding/status` - Current user onboarding progress.
- `POST /onboarding/persist` - Save onboarding step data.
- `GET /onboarding/content-defaults` - Get default settings for content.

### Payment
- `POST /payment/create-checkout-session` - Start Stripe Checkout flow.
- `POST /webhooks/stripe` - Handle Stripe asynchronous events.

### Developer & Debug
- `GET /inngest` - Inngest function management and debugging.
- `GET /debug/auth-test` - Verify authentication configuration.
- `GET /debug/payment-status` - Check Stripe integration health.

## Request/Response Format
Unless otherwise specified, all endpoints consume and produce `application/json`.

## Error Handling
The platform uses standard HTTP status codes:
- `200 OK` - Request succeeded.
- `201 Created` - Resource created successfully.
- `400 Bad Request` - Invalid input or validation error.
- `401 Unauthorized` - Authentication required.
- `403 Forbidden` - Insufficient permissions.
- `404 Not Found` - Resource not found.
- `500 Internal Server Error` - Unexpected server error.
