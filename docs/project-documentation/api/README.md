# API Reference

## Overview

The Infin8Content API provides 48 endpoints across 10 domains, supporting the complete content creation workflow. All endpoints enforce authentication, organization-based multi-tenancy, and comprehensive audit logging.

## Base URL
```
Production: https://infin8content.com/api
Development: http://localhost:3000/api
```

## Authentication

All API endpoints (except auth endpoints) require JWT authentication:

```http
Authorization: Bearer <jwt_token>
```

## Response Format

### Success Response
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-01T10:00:00Z",
    "version": "v1"
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

### Paginated Response
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 127,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

## API Domains

### 1. Authentication Endpoints

#### POST /api/auth/register
Creates a new user account and organization.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "organizationName": "Example Corp"
}
```

**Response:**
```json
{
  "data": {
    "user": { "id": "uuid", "email": "user@example.com" },
    "organization": { "id": "uuid", "name": "Example Corp" },
    "token": "jwt_token"
  }
}
```

#### POST /api/auth/login
Authenticates existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### POST /api/auth/logout
Invalidates user session.

#### POST /api/auth/resend-otp
Resends OTP for verification.

#### POST /api/auth/verify-otp
Verifies OTP token.

---

### 2. Intent Workflow Endpoints

#### GET /api/intent/workflows
Lists all workflows for the authenticated user's organization.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `status`: Filter by workflow status
- `search`: Search workflow names

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Q1 2026 Content Strategy",
      "status": "step_4_longtails",
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": "2026-02-01T15:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### POST /api/intent/workflows
Creates a new workflow.

**Request:**
```json
{
  "name": "Q1 2026 Content Strategy",
  "description": "SEO-focused content plan for Q1"
}
```

#### GET /api/intent/workflows/[workflow_id]
Gets detailed workflow information.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Q1 2026 Content Strategy",
    "status": "step_4_longtails",
    "icp_data": { ... },
    "keywords_count": 45,
    "articles_count": 12,
    "created_at": "2026-02-01T10:00:00Z"
  }
}
```

#### GET /api/intent/workflows/dashboard
Provides dashboard view with aggregated metrics.

**Response:**
```json
{
  "data": {
    "total_workflows": 5,
    "active_workflows": 2,
    "completed_workflows": 3,
    "total_keywords": 234,
    "total_articles": 67,
    "recent_activity": [ ... ]
  }
}
```

---

### Workflow Step Endpoints

#### POST /api/intent/workflows/[workflow_id]/steps/competitor-analyze
Triggers competitor analysis and seed keyword extraction.

**Request:**
```json
{
  "competitors": [
    "https://competitor1.com",
    "https://competitor2.com",
    "https://competitor3.com"
  ]
}
```

**Response:**
```json
{
  "data": {
    "success": true,
    "seeds_extracted": 9,
    "competitors_processed": 3,
    "processing_time": "45s"
  }
}
```

#### POST /api/intent/workflows/[workflow_id]/steps/longtail-expand
Expands seed keywords into long-tail keywords.

**Response:**
```json
{
  "data": {
    "success": true,
    "seeds_processed": 9,
    "longtails_generated": 108,
    "processing_time": "3m 15s"
  }
}
```

#### POST /api/intent/workflows/[workflow_id]/steps/filter-keywords
Filters keywords by business criteria.

**Request:**
```json
{
  "filters": {
    "min_search_volume": 100,
    "max_competition": "medium",
    "max_difficulty": 50
  }
}
```

#### POST /api/intent/workflows/[workflow_id]/steps/cluster-topics
Creates semantic topic clusters.

**Response:**
```json
{
  "data": {
    "success": true,
    "clusters_created": 12,
    "keywords_clustered": 89,
    "avg_similarity": 0.73
  }
}
```

#### POST /api/intent/workflows/[workflow_id]/steps/validate-clusters
Validates cluster coherence and structure.

#### POST /api/intent/workflows/[workflow_id]/steps/approve-seeds
Human approval gate for seed keywords.

**Request:**
```json
{
  "approvals": [
    {
      "keyword_id": "uuid",
      "decision": "approved",
      "feedback": "High relevance to our business"
    },
    {
      "keyword_id": "uuid", 
      "decision": "rejected",
      "feedback": "Too broad, not specific enough"
    }
  ]
}
```

---

### 3. Keyword Endpoints

#### POST /api/keywords/[keyword_id]/subtopics
Generates subtopics for a specific keyword.

**Response:**
```json
{
  "data": {
    "keyword_id": "uuid",
    "subtopics": [
      {
        "title": "How to Create Effective Content Marketing Strategy",
        "type": "how-to",
        "keywords": ["content marketing", "strategy", "effective"],
        "search_volume": 1200,
        "difficulty": 45
      }
    ]
  }
}
```

#### POST /api/keywords/[keyword_id]/approve-subtopics
Approves or rejects generated subtopics.

**Request:**
```json
{
  "decision": "approved",
  "feedback": "Great subtopics for our audience"
}
```

---

### 4. Article Endpoints

#### POST /api/articles/generate
Queues an article for generation.

**Request:**
```json
{
  "keyword_id": "uuid",
  "workflow_id": "uuid",
  "options": {
    "word_count": 1500,
    "tone": "professional",
    "include_citations": true
  }
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "keyword_id": "uuid",
    "status": "queued",
    "estimated_completion": "2026-02-01T11:30:00Z"
  }
}
```

#### GET /api/articles/[article_id]
Gets article details and content.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "title": "Complete Guide to Content Marketing",
    "content": "<h1>Complete Guide...</h1><p>Content marketing is...",
    "status": "completed",
    "word_count": 1523,
    "quality_score": 0.89,
    "created_at": "2026-02-01T10:00:00Z"
  }
}
```

#### GET /api/articles/status
Gets real-time status for multiple articles.

**Query Parameters:**
- `article_ids`: Comma-separated article IDs
- `workflow_id`: Filter by workflow

#### POST /api/articles/publish
Publishes article to WordPress.

**Request:**
```json
{
  "article_id": "uuid",
  "wordpress_config": {
    "site_url": "https://example.com",
    "username": "editor",
    "password": "app_password"
  }
}
```

**Response:**
```json
{
  "data": {
    "success": true,
    "wordpress_post_id": 12345,
    "wordpress_url": "https://example.com/complete-guide-content-marketing"
  }
}
```

#### POST /api/articles/[article_id]/cancel
Cancels article generation.

#### GET /api/articles/[article_id]/progress
Gets detailed generation progress.

**Response:**
```json
{
  "data": {
    "article_id": "uuid",
    "status": "generating",
    "progress_percent": 65,
    "current_section": "Introduction",
    "sections_completed": 3,
    "sections_total": 5,
    "estimated_completion": "2026-02-01T10:45:00Z"
  }
}
```

---

### 5. Analytics Endpoints

#### GET /api/analytics/metrics
Gets organization analytics metrics.

**Query Parameters:**
- `period`: Time period (7d, 30d, 90d)
- `metrics`: Specific metrics to retrieve

**Response:**
```json
{
  "data": {
    "workflow_completion_rate": 0.87,
    "article_generation_time": "12m 30s",
    "content_quality_score": 0.91,
    "cost_per_article": 0.023,
    "user_engagement": {
      "sessions": 234,
      "avg_session_duration": "8m 45s"
    }
  }
}
```

#### GET /api/analytics/trends
Gets trend data over time.

#### POST /api/analytics/export/csv
Exports analytics data as CSV.

#### POST /api/analytics/export/pdf
Exports analytics report as PDF.

---

### 6. Organization Endpoints

#### POST /api/organizations/create
Creates new organization.

#### POST /api/organizations/update
Updates organization settings.

#### GET /api/organizations/[orgId]/competitors
Lists competitor URLs.

#### POST /api/organizations/[orgId]/icp-settings
Manages ICP configuration.

---

### 7. Admin Endpoints

#### GET /api/admin/feature-flags
Lists all feature flags (admin only).

#### POST /api/feature-flags
Updates feature flags (admin only).

#### GET /api/admin/metrics/dashboard
System metrics dashboard (admin only).

#### POST /api/admin/metrics/collect
Collects system metrics (admin only).

---

### 8. Debug Endpoints

#### GET /api/debug/auth-test
Tests authentication status.

#### GET /api/debug/inngest-env
Shows Inngest configuration.

#### GET /api/debug/payment-status
Shows payment integration status.

---

### 9. Audit Endpoints

#### GET /api/intent/audit/logs
Retrieves audit logs with filtering.

**Query Parameters:**
- `workflow_id`: Filter by workflow
- `action`: Filter by action type
- `date_from`: Start date filter
- `date_to`: End date filter
- `limit`: Results limit (max: 1000)

---

### 10. Inngest Endpoints

#### POST /api/inngest
Webhook endpoint for Inngest events.

---

## Error Codes

### Authentication Errors
- `AUTHENTICATION_REQUIRED`: Missing or invalid token
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `TOKEN_EXPIRED`: JWT token has expired

### Validation Errors
- `VALIDATION_ERROR`: Input validation failed
- `MISSING_REQUIRED_FIELD`: Required field missing
- `INVALID_FORMAT`: Invalid data format

### Business Logic Errors
- `WORKFLOW_NOT_FOUND`: Workflow doesn't exist
- `INVALID_WORKFLOW_STATE`: Workflow in wrong state
- `STEP_NOT_ACCESSIBLE`: Step not available
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded

### System Errors
- `INTERNAL_ERROR`: Unexpected server error
- `SERVICE_UNAVAILABLE`: External service down
- `DATABASE_ERROR`: Database operation failed
- `TIMEOUT_ERROR`: Operation timed out

## Rate Limiting

Rate limits are enforced per organization:

| Plan | Requests/Hour | Concurrent Requests |
|------|---------------|---------------------|
| Starter | 100 | 5 |
| Pro | 500 | 20 |
| Agency | 2000 | 100 |

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 499
X-RateLimit-Reset: 1643723400
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { Infin8ContentAPI } from '@infin8content/client'

const client = new Infin8ContentAPI({
  baseURL: 'https://api.infin8content.com',
  token: 'your-jwt-token'
})

// Create workflow
const workflow = await client.workflows.create({
  name: 'Q1 Content Strategy',
  description: 'SEO-focused content plan'
})

// Generate article
const article = await client.articles.generate({
  keywordId: 'uuid',
  workflowId: workflow.id,
  options: { wordCount: 1500 }
})
```

### Python
```python
from infin8content import Infin8ContentClient

client = Infin8ContentClient(
    base_url='https://api.infin8content.com',
    token='your-jwt-token'
)

# List workflows
workflows = client.workflows.list()

# Get workflow details
workflow = client.workflows.get('workflow-id')
```

## Webhooks

Infin8Content can send webhook notifications for workflow events:

### Article Generation Complete
```json
{
  "event": "article.completed",
  "data": {
    "article_id": "uuid",
    "workflow_id": "uuid",
    "title": "Article Title",
    "status": "completed",
    "quality_score": 0.89
  },
  "timestamp": "2026-02-01T10:30:00Z"
}
```

### Workflow Step Completed
```json
{
  "event": "workflow.step_completed",
  "data": {
    "workflow_id": "uuid",
    "step": 4,
    "step_name": "longtail_expansion",
    "status": "completed"
  },
  "timestamp": "2026-02-01T10:15:00Z"
}
```

## Testing

### Sandbox Environment
For testing, use the sandbox environment:
```
https://sandbox-api.infin8content.com/api
```

### Test Data
Use test organization ID: `test-org-id`
Test JWT tokens are available in the developer dashboard.

## Changelog

### v2.0 (2026-02-14)
- Added workflow state machine
- Enhanced audit logging
- Improved error handling
- Added article progress tracking

### v1.5 (2026-01-15)
- Added keyword clustering
- Enhanced subtopic generation
- Improved performance monitoring

### v1.0 (2025-12-01)
- Initial API release
- Core workflow endpoints
- Authentication and authorization
