# Infin8Content API Reference

**Generated:** 2026-02-13  
**Version:** v2.2 - AI Copilot Architecture Complete  
**Base URL:** `https://your-domain.com/api`

## 🎯 AI Copilot APIs

The platform now includes **AI Copilot decision APIs** that enable human-AI collaboration:

### **Keyword Review API**
- `GET /api/intent/workflows/[workflow_id]/steps/seed-extract` - Load keywords for review with AI suggestions
- `POST /api/intent/workflows/[workflow_id]/steps/seed-extract` - Update user selections and advance workflow

### **Enhanced Clustering API**  
- `POST /api/intent/workflows/[workflow_id]/steps/cluster-topics` - Cluster user-selected keywords only

## Authentication

All API endpoints require authentication via JWT tokens from Supabase Auth:

```typescript
// Authorization header
Authorization: 'Bearer <jwt_token>'
```

## API Endpoint Categories

### 1. Intent Engine APIs

#### Workflow Management
- `GET /api/intent/workflows` - List user workflows
- `POST /api/intent/workflows` - Create new workflow
- `GET /api/intent/workflows/[workflow_id]` - Get workflow details
- `GET /api/intent/workflows/[workflow_id]/blocking-conditions` - Check workflow blockers
- `GET /api/intent/workflows/[workflow_id]/articles/progress` - Track article generation progress

#### Workflow Steps (AI Copilot Enhanced)
- `POST /api/intent/workflows/[workflow_id]/steps/generate-icp` - Generate ICP document
- `POST /api/intent/workflows/[workflow_id]/steps/competitor-analyze` - **AI Copilot:** Extract 25 keywords/competitor with AI metadata
- `GET /api/intent/workflows/[workflow_id]/steps/seed-extract` - **AI Copilot:** Load keywords for review with AI suggestions
- `POST /api/intent/workflows/[workflow_id]/steps/seed-extract` - **AI Copilot:** Update user selections and advance workflow
- `POST /api/intent/workflows/[workflow_id]/steps/longtail-expand` - Expand keywords
- `POST /api/intent/workflows/[workflow_id]/steps/filter-keywords` - Filter keywords
- `POST /api/intent/workflows/[workflow_id]/steps/cluster-topics` - **AI Copilot:** Cluster user-selected keywords only
- `POST /api/intent/workflows/[workflow_id]/steps/validate-clusters` - Validate clusters
- `POST /api/intent/workflows/[workflow_id]/steps/approve-seeds` - Approve seed keywords

#### Audit & Logging
- `GET /api/intent/audit/logs` - Retrieve audit logs with filtering

### 2. Keyword Management APIs

#### Keyword Operations
- `GET /api/keywords` - List keywords with filtering
- `GET /api/keywords/[keyword_id]` - Get keyword details
- `POST /api/keywords/[keyword_id]/subtopics` - Generate subtopics for keyword
- `POST /api/keywords/[keyword_id]/approve-subtopics` - Approve/reject subtopics

### 3. Article Generation APIs

#### Article Management
- `POST /api/articles/generate` - Initiate article generation
- `GET /api/articles/[id]` - Get article details
- `GET /api/articles/[id]/status` - Get article generation status
- `GET /api/articles/[id]/diagnostics` - Get article diagnostics
- `DELETE /api/articles/[id]/cancel` - Cancel article generation

#### Article Operations
- `POST /api/articles/publish` - Publish article to WordPress
- `POST /api/articles/queue` - Queue multiple articles
- `POST /api/articles/bulk` - Bulk article operations
- `GET /api/articles/usage` - Get article usage statistics

#### Section Processing
- `POST /api/articles/[article_id]/sections/[section_id]/write` - Generate section content
- `GET /api/articles/[article_id]/progress` - Track article progress

#### Article Fixes
- `POST /api/articles/fix-stuck` - Fix stuck article generation
- `POST /api/articles/fix-title` - Fix article title issues
- `POST /api/articles/diagnose-broken-citations` - Diagnose citation issues
- `POST /api/articles/fix-broken-citations` - Fix broken citations

### 4. Authentication APIs

#### User Management
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/resend-otp` - Resend OTP code

### 5. Organization Management APIs

#### Organization Operations
- `GET /api/organizations` - List user organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/[org_id]` - Get organization details
- `PUT /api/organizations/[org_id]` - Update organization
- `DELETE /api/organizations/[org_id]` - Delete organization

#### Team Management
- `GET /api/team/members` - List team members
- `POST /api/team/invite` - Invite team member
- `PUT /api/team/members/[member_id]` - Update member role
- `DELETE /api/team/members/[member_id]` - Remove team member

### 6. Analytics APIs

#### Metrics & Analytics
- `GET /api/analytics/metrics` - Get analytics metrics
- `GET /api/analytics/trends` - Get trend data
- `GET /api/analytics/recommendations` - Get recommendations
- `GET /api/analytics/weekly-report` - Get weekly report

#### Export & Sharing
- `GET /api/analytics/export/csv` - Export analytics as CSV
- `GET /api/analytics/export/pdf` - Export analytics as PDF
- `POST /api/analytics/share` - Share analytics report

### 7. Admin APIs

#### System Administration
- `GET /api/admin/debug/analytics` - Debug analytics data
- `POST /api/admin/feature-flags` - Manage feature flags
- `GET /api/admin/metrics/dashboard` - Get dashboard metrics
- `GET /api/admin/metrics/efficiency-summary` - Get efficiency metrics
- `POST /api/admin/reset-sql-usage` - Reset SQL usage tracking

#### Performance Monitoring
- `GET /api/admin/performance/metrics` - Get performance metrics
- `POST /api/admin/metrics/collect` - Collect custom metrics
- `GET /api/admin/ux-metrics/rollups` - Get UX metric rollups

### 8. Onboarding APIs

#### Onboarding Process
- `POST /api/onboarding/initialize` - Initialize onboarding
- `PUT /api/onboarding/step` - Update onboarding step
- `GET /api/onboarding/status` - Get onboarding status
- `POST /api/onboarding/complete` - Complete onboarding

### 9. Payment APIs

#### Billing & Subscriptions
- `GET /api/payment/status` - Get payment status
- `POST /api/payment/webhook` - Handle payment webhooks

### 10. AI & Research APIs

#### AI Services
- `POST /api/ai/autocomplete` - AI-powered autocomplete

#### Research Services
- `POST /api/article-generation/research-agent` - Research agent service

### 11. Feature Flag APIs

#### Feature Management
- `GET /api/feature-flags` - Get feature flags
- `POST /api/feature-flags` - Update feature flags

### 12. Debug APIs

#### Development Tools
- `GET /api/debug/auth-test` - Test authentication
- `GET /api/debug/inngest-env` - Check Inngest environment
- `GET /api/debug/payment-status` - Debug payment status

### 13. Webhook APIs

#### External Integrations
- `POST /api/webhooks/stripe` - Stripe webhook handler
- `POST /api/webhooks/inngest` - Inngest webhook handler

### 14. Inngest APIs

#### Workflow Orchestration
- `POST /api/inngest` - Inngest webhook handler

## Request/Response Patterns

### Standard Response Format

```typescript
// Success Response
{
  "success": true,
  "data": any,
  "message?: string
}

// Error Response
{
  "success": false,
  "error": string,
  "details?: any
}
```

### Pagination

```typescript
// Paginated Response
{
  "success": true,
  "data": any[],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "hasNext": boolean
  }
}
```

### Error Handling

Standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## Rate Limiting

### Per-Organization Limits
- **Starter Plan:** 100 requests/hour
- **Pro Plan:** 1000 requests/hour
- **Agency Plan:** 5000 requests/hour

### Endpoint-Specific Limits
- **Article Generation:** 10 per hour (Starter), 50 per hour (Pro), unlimited (Agency)
- **Keyword Research:** 100 per hour across all plans
- **Analytics:** 1000 requests per hour across all plans

## Authentication Patterns

### JWT Token Structure
```typescript
interface JWTPayload {
  sub: string;        // User ID
  org_id: string;     // Organization ID
  email: string;      // User email
  role: string;       // User role
  exp: number;        // Expiration timestamp
}
```

### Organization Scoping
All API endpoints automatically scope data by the user's organization via RLS policies. The `org_id` is extracted from the JWT token and used for database queries.

## Webhook Integration

### Stripe Webhooks
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `invoice.payment_succeeded`
- `customer.subscription.created`
- `customer.subscription.deleted`

### Inngest Webhooks
- Workflow step completions
- Article generation progress
- System event notifications

## SDK Integration

### TypeScript Client (Planned)
```typescript
import { Infin8ContentClient } from '@infin8content/client'

const client = new Infin8ContentClient({
  apiKey: 'your-api-key',
  organizationId: 'org-id'
})

// Generate article
const article = await client.articles.generate({
  title: 'Article Title',
  keywordId: 'keyword-id'
})
```

## API Versioning

- **Current Version:** v1 (implicit)
- **Version Strategy:** URL path versioning for breaking changes
- **Backward Compatibility:** Maintained for minor versions
- **Depreciation:** 90-day notice period for breaking changes

## Testing & Development

### Test Environment
- **Base URL:** `https://dev-api.infin8content.com`
- **Authentication:** Test JWT tokens
- **Rate Limiting:** Relaxed limits for testing

### Debug Headers
```typescript
// Enable debug mode
X-Debug: true

// Request tracing
X-Request-ID: uuid
```

## Monitoring & Analytics

### API Metrics
- Request volume by endpoint
- Response time distributions
- Error rates by endpoint
- User activity patterns

### Health Checks
- `GET /api/health` - System health check
- `GET /api/health/database` - Database connectivity
- `GET /api/health/external-services` - External service status

This API reference provides comprehensive documentation for all Infin8Content platform endpoints, enabling developers to integrate and extend the platform functionality.
