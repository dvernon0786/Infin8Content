# Infin8Content API Reference

**Generated:** 2026-02-22  
**Version:** Production-Ready  
**Total Endpoints:** 91 across 13 categories

## API Architecture

### Authentication & Authorization
- **Method:** Supabase Auth with session tokens
- **Authorization:** Bearer token in Authorization header
- **Organization Isolation:** RLS policies enforce tenant separation
- **Rate Limiting:** Per-organization usage tracking

### Response Format
```json
{
  "data": {}, // Success response data
  "error": "string", // Error message (if applicable)
  "status": "success|error"
}
```

### Error Handling
- **400:** Bad Request (validation errors)
- **401:** Unauthorized (authentication required)
- **403:** Forbidden (insufficient permissions)
- **404:** Not Found (resource doesn't exist)
- **409:** Conflict (state/validation conflicts)
- **500:** Internal Server Error

## API Categories

### 1. Authentication APIs (`/api/auth/`)
User authentication and session management endpoints.

#### POST `/api/auth/login`
Authenticate user with email and password.
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

#### POST `/api/auth/register`
Register new user account.
```json
{
  "email": "user@example.com",
  "password": "password",
  "organization_name": "Company Name"
}
```

#### POST `/api/auth/verify-otp`
Verify email OTP for registration.
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### POST `/api/auth/resend-otp`
Resend verification OTP.
```json
{
  "email": "user@example.com"
}
```

#### POST `/api/auth/logout`
Terminate user session.

### 2. Intent Workflow APIs (`/api/intent/workflows/`)
Core workflow management and progression endpoints.

#### GET `/api/intent/workflows`
List all workflows for user's organization.
- **Query Params:** `page`, `limit`, `status`

#### POST `/api/intent/workflows`
Create new workflow.
```json
{
  "name": "Workflow Name",
  "description": "Workflow description",
  "icp_data": {}
}
```

#### GET `/api/intent/workflows/[workflow_id]`
Get specific workflow details.

#### DELETE `/api/intent/workflows/[workflow_id]`
Cancel and delete workflow.

#### GET `/api/intent/workflows/dashboard`
Dashboard summary with workflow statistics.

#### GET `/api/intent/workflows/[workflow_id]/blocking-conditions`
Check workflow blocking conditions.

### 3. Workflow Step APIs (`/api/intent/workflows/[workflow_id]/steps/`)
Step-specific workflow progression endpoints.

#### POST `/api/intent/workflows/[workflow_id]/steps/icp-generate`
Generate Ideal Customer Profile (Step 1).
```json
{
  "business_description": "Business description",
  "target_audience": "Target audience"
}
```

#### POST `/api/intent/workflows/[workflow_id]/steps/competitor-analyze`
Analyze competitors and extract seed keywords (Step 2).
```json
{
  "competitors": ["competitor1.com", "competitor2.com"]
}
```

#### POST `/api/intent/workflows/[workflow_id]/steps/seed-extract`
Extract seed keywords from competitor analysis (Step 3).

#### POST `/api/intent/workflows/[workflow_id]/steps/longtail-expand`
Expand seed keywords into long-tail keywords (Step 4).

#### POST `/api/intent/workflows/[workflow_id]/steps/filter-keywords`
Filter keywords based on business criteria (Step 5).

#### POST `/api/intent/workflows/[workflow_id]/steps/cluster-topics`
Cluster keywords into hub-and-spoke topics (Step 6).

#### POST `/api/intent/workflows/[workflow_id]/steps/validate-clusters`
Validate cluster coherence and structure (Step 7).

#### POST `/api/intent/workflows/[workflow_id]/steps/human-approval`
Process human approval for workflow steps.
```json
{
  "decision": "approved|rejected",
  "feedback": "Optional feedback"
}
```

#### POST `/api/intent/workflows/[workflow_id]/steps/queue-articles`
Queue articles for generation (Step 9).

### 4. Article Management APIs (`/api/articles/`)
Article creation, management, and publishing endpoints.

#### POST `/api/articles/generate`
Generate new article content.
```json
{
  "keyword_id": "uuid",
  "outline": {},
  "research_data": {}
}
```

#### GET `/api/articles/[article_id]`
Get specific article details.

#### GET `/api/articles/status/[article_id]`
Get article generation progress.

#### POST `/api/articles/publish`
Publish article to WordPress.
```json
{
  "article_id": "uuid",
  "wordpress_config": {}
}
```

#### POST `/api/articles/queue`
Queue multiple articles for generation.

#### POST `/api/articles/bulk`
Bulk article operations.

#### POST `/api/articles/fix-stuck`
Fix stuck article generation.

#### POST `/api/articles/fix-title`
Fix article title generation.

#### POST `/api/articles/diagnose-broken-citations`
Diagnose citation issues.

#### POST `/api/articles/fix-broken-citations`
Fix broken citations.

#### GET `/api/articles/usage`
Get article usage statistics.

### 5. Keyword Management APIs (`/api/keywords/`)
Keyword research and management endpoints.

#### GET `/api/keywords/[keyword_id]`
Get specific keyword details.

#### POST `/api/keywords/[keyword_id]/subtopics`
Generate subtopics for keyword.
```json
{
  "limit": 3
}
```

#### POST `/api/keywords/[keyword_id]/approve-subtopics`
Approve generated subtopics.
```json
{
  "decision": "approved|rejected",
  "feedback": "Optional feedback"
}
```

### 6. Analytics APIs (`/api/analytics/`)
Analytics and reporting endpoints.

#### GET `/api/analytics/metrics`
Get system metrics and KPIs.
- **Query Params:** `date_range`, `metrics`

#### GET `/api/analytics/trends`
Get trend analysis data.
- **Query Params:** `metric`, `period`

#### GET `/api/analytics/recommendations`
Get AI-powered recommendations.

#### POST `/api/analytics/share`
Share analytics report.

#### GET `/api/analytics/weekly-report`
Get weekly performance report.

### 7. Onboarding APIs (`/api/onboarding/`)
User onboarding and setup endpoints.

#### POST `/api/onboarding/business`
Setup business information.
```json
{
  "company_name": "Company Name",
  "website_url": "https://example.com",
  "business_description": "Business description"
}
```

#### POST `/api/onboarding/competitors`
Setup competitor information.
```json
{
  "competitors": ["competitor1.com", "competitor2.com"]
}
```

#### POST `/api/onboarding/blog`
Setup blog configuration.
```json
{
  "blog_title": "Blog Title",
  "blog_description": "Blog description"
}
```

#### POST `/api/onboarding/keyword-settings`
Setup keyword research preferences.
```json
{
  "target_location": "US",
  "language": "en",
  "competitor_count": 3
}
```

#### POST `/api/onboarding/content-defaults`
Setup content generation defaults.
```json
{
  "tone": "professional",
  "word_count": 1500,
  "article_structure": "introduction,body,conclusion"
}
```

#### POST `/api/onboarding/integration`
Setup third-party integrations.
```json
{
  "wordpress_url": "https://blog.example.com",
  "api_credentials": {}
}
```

#### POST `/api/onboarding/persist`
Save onboarding progress.

#### GET `/api/onboarding/observe`
Get onboarding progress status.

### 8. AI & Content APIs (`/api/ai/`)
AI-powered content generation endpoints.

#### POST `/api/ai/autocomplete`
AI-powered content autocomplete.
```json
{
  "prompt": "Partial content...",
  "context": {}
}
```

#### POST `/api/article-generation/research-agent`
Trigger research agent for article data.

### 9. Admin APIs (`/api/admin/`)
Administrative and system management endpoints.

#### GET `/api/admin/feature-flags`
Get system feature flags.

#### POST `/api/admin/reset-sql-usage`
Reset SQL usage tracking (admin only).

### 10. Internal APIs (`/api/internal/`)
Internal system endpoints (development/testing).

#### POST `/api/internal/test-create-workflow`
Create test workflow (development only).

#### POST `/api/internal/test-delete-workflow`
Delete test workflow (development only).

#### GET `/api/internal/test-get-workflow`
Get test workflow details (development only).

### 11. Debug APIs (`/api/debug/`)
Debug and diagnostic endpoints.

#### GET `/api/debug/auth-test`
Test authentication system.

#### GET `/api/debug/inngest-env`
Get Inngest environment configuration.

#### GET `/api/debug/payment-status`
Get payment system status.

### 12. Feature Flag APIs (`/api/feature-flags/`)
Feature flag management.

#### GET `/api/feature-flags`
Get current feature flags.

### 13. Integration APIs (`/api/inngest/`)
Inngest webhook endpoints.

#### POST `/api/inngest`
Inngest webhook handler.

## API Usage Patterns

### Workflow Progression Pattern
```javascript
// 1. Create workflow
const workflow = await fetch('/api/intent/workflows', {
  method: 'POST',
  body: JSON.stringify({ name: 'My Workflow' })
});

// 2. Progress through steps
await fetch(`/api/intent/workflows/${workflow.id}/steps/icp-generate`, {
  method: 'POST',
  body: JSON.stringify({ business_description: '...' })
});

// 3. Check status
const status = await fetch(`/api/intent/workflows/${workflow.id}`);
```

### Article Generation Pattern
```javascript
// 1. Generate article
const article = await fetch('/api/articles/generate', {
  method: 'POST',
  body: JSON.stringify({ keyword_id: 'uuid' })
});

// 2. Check progress
const progress = await fetch(`/api/articles/status/${article.id}`);

// 3. Publish when ready
await fetch('/api/articles/publish', {
  method: 'POST',
  body: JSON.stringify({ article_id: article.id })
});
```

## Rate Limiting & Usage

### Organization-Based Limits
- **Starter Plan:** 10 articles per month
- **Pro Plan:** 50 articles per month
- **Agency Plan:** Unlimited articles

### API Rate Limits
- **Authentication endpoints:** 10 requests per minute
- **Workflow endpoints:** 60 requests per minute
- **Article generation:** Based on plan limits
- **Analytics endpoints:** 120 requests per minute

## Security Considerations

### Authentication Required
All endpoints except `/api/auth/register` and `/api/auth/login` require valid authentication tokens.

### Organization Isolation
All data access is automatically scoped to the user's organization through RLS policies.

### Input Validation
All endpoints implement comprehensive input validation with proper error responses.

### Audit Logging
All API actions are logged with user attribution for compliance and security.

---

**API Status:** Production-Ready  
**Documentation Version:** 1.0.0  
**Last Updated:** 2026-02-22
