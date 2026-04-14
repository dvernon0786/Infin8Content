# Infin8Content API Reference Documentation

*Last Updated: 2026-02-20*  
*System Version: v2.1.0 - Zero-Legacy FSM Architecture*

## Overview

The Infin8Content API follows RESTful patterns with JSON responses, JWT authentication, and comprehensive error handling. All endpoints require authentication and enforce organization-based multi-tenancy through Row Level Security (RLS) policies.

**API Statistics:**
- **Total Endpoints**: 91 across 13 categories
- **Authentication**: JWT-based with organization isolation
- **Rate Limiting**: Per-organization usage tracking
- **Audit Logging**: WORM-compliant for all operations

## Authentication

### JWT Token Authentication
All API endpoints require a valid JWT token passed in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### Organization Context
Users are automatically scoped to their organization via Row Level Security (RLS) policies. No manual organization ID selection required.

## Base URL
```
https://your-domain.com/api
```

## API Endpoint Categories

### 1. Authentication Endpoints (`/api/auth/*`)
Manages user authentication and session handling.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user account |
| `/api/auth/login` | POST | User login with email/password |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/verify-otp` | POST | Verify one-time password |
| `/api/auth/resend-otp` | POST | Resend verification OTP |

### 2. Intent Workflow Endpoints (`/api/intent/*`)
Core workflow management for the 9-step content creation pipeline.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/intent/workflows` | GET/POST | List/create workflows |
| `/api/intent/workflows/[id]` | GET/PUT | Get/update workflow details |
| `/api/intent/workflows/[id]/cancel` | POST | Cancel workflow execution |
| `/api/intent/workflows/[id]/blocking-conditions` | GET | Check workflow blockers |
| `/api/intent/workflows/[id]/steps/*` | POST | Execute workflow steps |
| `/api/intent/workflows/[id]/articles/progress` | GET | Article generation progress |
| `/api/intent/audit/logs` | GET | Access audit trail |

**Workflow Step Endpoints:**
- `/steps/competitor-analyze` - Step 2: Competitor analysis
- `/steps/seed-extract` - Step 3: Seed keyword extraction
- `/steps/longtail-expand` - Step 4: Long-tail expansion
- `/steps/cluster-topics` - Step 6: Topic clustering
- `/steps/validate-clusters` - Step 7: Cluster validation
- `/steps/human-approval` - Step 8: Human approval gate

### 3. Keyword Management Endpoints (`/api/keywords/*`)
Keyword research, expansion, and management operations.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/keywords/[id]/subtopics` | POST | Generate subtopics for keyword |
| `/api/keywords/[id]/approve-subtopics` | POST | Approve/reject subtopics |

### 4. Article Generation Endpoints (`/api/articles/*`)
Article creation, management, and publishing operations.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/articles/generate` | POST | Create new article |
| `/api/articles/[id]` | GET | Get article details |
| `/api/articles/[id]/progress` | GET | Get generation progress |
| `/api/articles/[id]/cancel` | POST | Cancel article generation |
| `/api/articles/[id]/diagnostics` | GET | Article diagnostics |
| `/api/articles/[id]/sections/[section_id]/write` | POST | Write specific section |
| `/api/articles/bulk` | POST | Bulk article operations |
| `/api/articles/queue` | POST | Queue articles for generation |
| `/api/articles/status` | GET | System article status |
| `/api/articles/publish` | POST | Publish to WordPress |
| `/api/articles/usage` | GET | Usage statistics |

### 5. Organization Management (`/api/organizations/*`)
Organization settings and competitor management.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/organizations/[orgId]/competitors` | GET/POST | Manage competitors |
| `/api/organizations/[orgId]/competitors/[id]` | DELETE | Remove competitor |
| `/api/organizations/[orgId]/icp-settings` | GET/PUT | ICP configuration |

### 6. Analytics & Reporting (`/api/analytics/*`)
System metrics, usage analytics, and reporting.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/metrics` | GET | System metrics |
| `/api/analytics/trends` | GET | Usage trends |
| `/api/analytics/recommendations` | GET | AI recommendations |
| `/api/analytics/export/csv` | GET | Export data to CSV |
| `/api/analytics/export/pdf` | GET | Export report to PDF |
| `/api/analytics/share` | POST | Share analytics |
| `/api/analytics/weekly-report` | GET | Weekly summary |

### 7. Administration (`/api/admin/*`)
System administration and debugging tools.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/feature-flags` | GET/POST | Feature flag management |
| `/api/admin/metrics/collect` | POST | Collect system metrics |
| `/api/admin/metrics/dashboard` | GET | Dashboard metrics |
| `/api/admin/metrics/efficiency-summary` | GET | Efficiency data |
| `/api/admin/performance/metrics` | GET | Performance metrics |
| `/api/admin/reset-sql-usage` | POST | Reset usage tracking |
| `/api/admin/ux-metrics/rollups` | GET | UX metrics |
| `/api/admin/debug/analytics` | GET | Debug analytics data |

### 8. AI & Research (`/api/ai/*`, `/api/article-generation/*`)
AI-powered services and research tools.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/autocomplete` | POST | AI autocomplete |
| `/api/article-generation/research-agent` | POST | Research agent |

### 9. SEO Tools (`/api/seo/*`)
SEO analysis and optimization tools.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/seo/score` | POST | Calculate SEO score |
| `/api/seo/validate` | POST | Validate SEO metrics |
| `/api/seo/recommendations/[articleId]` | GET | SEO recommendations |
| `/api/seo/reports/[articleId]` | GET | SEO reports |
| `/api/seo/performance-test` | POST | Performance testing |

### 10. Debug & System (`/api/debug/*`)
System debugging and status endpoints.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/debug/auth-test` | GET | Authentication test |
| `/api/debug/inngest-env` | GET | Inngest environment |
| `/api/debug/payment-status` | GET | Payment system status |

### 11. Feature Flags (`/api/feature-flags`)
Feature flag management system.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/feature-flags` | GET | Get active feature flags |

### 12. Inngest (`/api/inngest`)
Inngest webhook handler for background jobs.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/inngest` | POST | Inngest event webhook |

## Response Format

### Success Response
```json
{
  "data": { ... },
  "success": true,
  "timestamp": "2026-02-20T11:14:00.000Z"
}
```

### Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": { ... }
  },
  "success": false,
  "timestamp": "2026-02-20T11:14:00.000Z"
}
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (state mismatch) |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |

## Rate Limiting

API endpoints are rate-limited per organization to ensure fair usage:

- **Standard Plans**: 1000 requests/hour
- **Pro Plans**: 5000 requests/hour  
- **Enterprise**: Unlimited

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

## Error Handling

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid request parameters |
| `AUTHENTICATION_REQUIRED` | Missing or invalid JWT |
| `ORGANIZATION_NOT_FOUND` | User not in organization |
| `WORKFLOW_STATE_INVALID` | Workflow in wrong state |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `EXTERNAL_API_ERROR` | Third-party service failure |

### Workflow-Specific Errors

| Error | When Occurs |
|-------|-------------|
| `WORKFLOW_ALREADY_COMPLETED` | Trying to modify completed workflow |
| `STEP_NOT_ACCESSIBLE` | Current step doesn't allow operation |
| `HUMAN_APPROVAL_REQUIRED` | Waiting for human input |
| `AUTOMATION_IN_PROGRESS` | Background job running |

## Usage Tracking

All API usage is tracked for billing and analytics:

```sql
-- Usage tracking table structure
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Audit Logging

Every API operation is logged for compliance and debugging:

```sql
-- Audit log structure
CREATE TABLE intent_audit_logs (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Development Examples

### Create New Workflow
```bash
curl -X POST https://your-domain.com/api/intent/workflows \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Content Strategy for Tech Blog",
    "description": "Generate comprehensive content strategy"
  }'
```

### Generate Article
```bash
curl -X POST https://your-domain.com/api/articles/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword_id": "uuid-here",
    "title": "Understanding Modern Web Development",
    "outline": ["Introduction", "Core Concepts", "Best Practices", "Conclusion"]
  }'
```

### Get Workflow Progress
```bash
curl https://your-domain.com/api/intent/workflows/[workflow-id] \
  -H "Authorization: Bearer <token>"
```

## SDK and Client Libraries

### TypeScript/JavaScript
```typescript
import { Infin8ContentAPI } from '@infin8content/client'

const client = new Infin8ContentAPI({
  baseURL: 'https://your-domain.com/api',
  authToken: 'your-jwt-token'
})

const workflow = await client.workflows.create({
  name: 'My Content Strategy'
})
```

### Python (Coming Soon)
```python
from infin8content import Infin8ContentClient

client = Infin8ContentAPI(
    base_url='https://your-domain.com/api',
    auth_token='your-jwt-token'
)

workflow = client.workflows.create(name='My Content Strategy')
```

## WebSocket Support

Real-time updates are available via WebSocket connections for:

- Article generation progress
- Workflow state changes
- System notifications

Connect to: `wss://your-domain.com/api/realtime`

## API Versioning

The current API version is **v1**. Future versions will be:

- **Backward compatible** when possible
- **Versioned in URL** (`/api/v2/...`)
- **Announced 30 days** before deprecation
- **Supported** for at least 6 months after deprecation

## Support and Documentation

- **API Documentation**: This reference guide
- **Developer Guide**: `/docs/project-documentation/development-guide.md`
- **Architecture Overview**: `/docs/project-documentation/architecture-overview.md`
- **Support**: Create issue in GitHub repository
- **Status Page**: https://status.infin8content.com

This API reference provides comprehensive documentation for all 91 endpoints across the Infin8Content platform, enabling developers to build sophisticated content generation workflows.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "organization_id": "uuid",
    "role": "owner"
  },
  "token": "jwt_token"
}
```

#### POST /api/auth/login
Authenticate existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "organization_id": "uuid",
    "role": "owner"
  },
  "token": "jwt_token"
}
```

#### POST /api/auth/logout
Invalidate current session.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### 2. Intent Workflow Endpoints

#### GET /api/intent/workflows
List all workflows for the organization.

**Response:**
```json
{
  "workflows": [
    {
      "id": "uuid",
      "name": "Q1 2026 Content Strategy",
      "description": "SEO-focused content plan",
      "status": "step_4_longtails",
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-01-20T15:30:00Z"
    }
  ]
}
```

#### POST /api/intent/workflows
Create a new workflow.

**Request:**
```json
{
  "name": "Q2 2026 Content Strategy",
  "description": "Summer content campaign"
}
```

**Response:**
```json
{
  "workflow": {
    "id": "uuid",
    "name": "Q2 2026 Content Strategy",
    "description": "Summer content campaign",
    "status": "step_1_icp",
    "organization_id": "uuid",
    "created_at": "2026-02-01T10:00:00Z"
  }
}
```

#### GET /api/intent/workflows/[workflow_id]
Get specific workflow details.

**Response:**
```json
{
  "workflow": {
    "id": "uuid",
    "name": "Q1 2026 Content Strategy",
    "description": "SEO-focused content plan",
    "status": "step_4_longtails",
    "icp_analysis": {...},
    "competitor_analysis": {...},
    "seed_extraction": {...},
    "longtail_expansion": {...},
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-01-20T15:30:00Z"
  }
}
```

### 3. Workflow Step Endpoints

#### POST /api/intent/workflows/[workflow_id]/steps/competitor-analyze
Extract seed keywords from competitor URLs.

**Request:**
```json
{
  "competitor_urls": [
    "https://competitor1.com",
    "https://competitor2.com"
  ]
}
```

**Response:**
```json
{
  "status": "started",
  "seeds_extracted": 9,
  "competitors_processed": 2,
  "workflow_status": "step_3_seeds"
}
```

#### POST /api/intent/workflows/[workflow_id]/steps/longtail-expand
Expand seed keywords into long-tail keywords.

**Response:**
```json
{
  "status": "completed",
  "seeds_processed": 9,
  "longtails_created": 27,
  "workflow_status": "step_4_longtails"
}
```

#### POST /api/intent/workflows/[workflow_id]/steps/filter-keywords
Filter keywords based on criteria.

**Request:**
```json
{
  "filters": {
    "min_search_volume": 100,
    "max_competition": "medium",
    "min_keyword_difficulty": 20
  }
}
```

**Response:**
```json
{
  "status": "completed",
  "keywords_filtered": 15,
  "keywords_approved": 12,
  "workflow_status": "step_5_filtering"
}
```

#### POST /api/intent/workflows/[workflow_id]/steps/cluster-topics
Cluster keywords into hub-and-spoke structure.

**Response:**
```json
{
  "status": "completed",
  "clusters_created": 4,
  "keywords_clustered": 12,
  "workflow_status": "step_6_clustering"
}
```

#### POST /api/intent/workflows/[workflow_id]/steps/validate-clusters
Validate cluster coherence and structure.

**Response:**
```json
{
  "status": "completed",
  "valid_clusters": 3,
  "invalid_clusters": 1,
  "workflow_status": "step_7_validation"
}
```

#### POST /api/intent/workflows/[workflow_id]/steps/approve-seeds
Human approval gate for seed keywords.

**Request:**
```json
{
  "decision": "approved",
  "feedback": "Good selection of competitive keywords"
}
```

**Response:**
```json
{
  "status": "approved",
  "approved_by": "user_uuid",
  "approved_at": "2026-02-01T10:00:00Z"
}
```

### 4. Keyword Endpoints

#### GET /api/keywords
List keywords with filtering and pagination.

**Query Parameters:**
- `status`: Filter by workflow status
- `type`: Filter by keyword type (seed/longtail)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 50)

**Response:**
```json
{
  "keywords": [
    {
      "id": "uuid",
      "keyword": "content marketing strategy",
      "search_volume": 1200,
      "competition_level": "medium",
      "longtail_status": "completed",
      "subtopics_status": "completed",
      "article_status": "not_started"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 127,
    "total_pages": 3
  }
}
```

#### POST /api/keywords/[keyword_id]/subtopics
Generate subtopics for a keyword.

**Response:**
```json
{
  "status": "completed",
  "subtopics": [
    {
      "title": "Content Marketing ROI Measurement",
      "type": "how-to",
      "keywords": ["content marketing", "ROI", "measurement"]
    }
  ],
  "subtopics_status": "complete"
}
```

#### POST /api/keywords/[keyword_id]/approve-subtopics
Approve or reject generated subtopics.

**Request:**
```json
{
  "decision": "approved",
  "feedback": "Well-structured subtopics for content planning"
}
```

**Response:**
```json
{
  "status": "approved",
  "article_status": "ready",
  "approved_by": "user_uuid",
  "approved_at": "2026-02-01T10:00:00Z"
}
```

### 5. Article Endpoints

#### POST /api/articles/generate
Generate an article from a keyword.

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
  "article": {
    "id": "uuid",
    "keyword_id": "uuid",
    "workflow_id": "uuid",
    "title": "Complete Guide to Content Marketing Strategy",
    "status": "queued",
    "created_at": "2026-02-01T10:00:00Z"
  }
}
```

#### GET /api/articles/[id]
Get article details and status.

**Response:**
```json
{
  "article": {
    "id": "uuid",
    "title": "Complete Guide to Content Marketing Strategy",
    "content": "Full article content...",
    "status": "completed",
    "word_count": 1523,
    "quality_score": 0.87,
    "citations": [...],
    "created_at": "2026-02-01T10:00:00Z",
    "updated_at": "2026-02-01T11:30:00Z"
  }
}
```

#### GET /api/articles/status
Get real-time article generation status.

**Query Parameters:**
- `article_id`: Specific article ID (optional)
- `workflow_id`: Workflow ID for batch status (optional)

**Response:**
```json
{
  "articles": [
    {
      "id": "uuid",
      "title": "Complete Guide to Content Marketing Strategy",
      "status": "generating",
      "progress": 65,
      "current_section": "Introduction",
      "estimated_completion": "2026-02-01T12:00:00Z"
    }
  ]
}
```

#### POST /api/articles/publish
Publish article to WordPress.

**Request:**
```json
{
  "article_id": "uuid",
  "wordpress_config": {
    "url": "https://blog.example.com",
    "username": "api_user",
    "password": "app_password"
  }
}
```

**Response:**
```json
{
  "status": "published",
  "wordpress_post_id": 123,
  "wordpress_url": "https://blog.example.com/complete-guide-content-marketing",
  "published_at": "2026-02-01T12:00:00Z"
}
```

### 6. Analytics Endpoints

#### GET /api/analytics/metrics
Get organization analytics metrics.

**Query Parameters:**
- `period`: Time period (7d, 30d, 90d)
- `metric_type`: Specific metric (articles, keywords, workflows)

**Response:**
```json
{
  "metrics": {
    "articles_generated": 23,
    "keywords_researched": 127,
    "workflows_completed": 3,
    "average_quality_score": 0.85,
    "publish_rate": 0.78
  },
  "period": "30d",
  "generated_at": "2026-02-01T12:00:00Z"
}
```

#### GET /api/analytics/trends
Get trend data over time.

**Response:**
```json
{
  "trends": [
    {
      "date": "2026-01-01",
      "articles_generated": 2,
      "keywords_researched": 15
    },
    {
      "date": "2026-01-02",
      "articles_generated": 3,
      "keywords_researched": 18
    }
  ]
}
```

### 7. Admin Endpoints

#### GET /api/admin/feature-flags
Get feature flag status (admin only).

**Response:**
```json
{
  "flags": {
    "ENABLE_INTENT_ENGINE": true,
    "ENABLE_ADVANCED_ANALYTICS": false,
    "ENABLE_BULK_OPERATIONS": true
  }
}
```

#### POST /api/admin/feature-flags
Update feature flags (admin only).

**Request:**
```json
{
  "ENABLE_INTENT_ENGINE": false,
  "ENABLE_ADVANCED_ANALYTICS": true
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "keyword_id",
      "issue": "Required field missing"
    }
  }
}
```

### Common Error Codes

#### Authentication Errors
- `401 UNAUTHORIZED`: Invalid or missing authentication token
- `403 FORBIDDEN`: Insufficient permissions for the operation

#### Validation Errors
- `400 BAD_REQUEST`: Invalid request parameters
- `422 VALIDATION_ERROR`: Request failed validation rules

#### Rate Limiting
- `429 RATE_LIMIT_EXCEEDED`: API rate limit exceeded

#### Server Errors
- `500 INTERNAL_SERVER_ERROR`: Unexpected server error
- `503 SERVICE_UNAVAILABLE`: External service unavailable

## Rate Limiting

### Organization-Based Limits
- Starter Plan: 100 requests/hour
- Pro Plan: 500 requests/hour  
- Agency Plan: 2000 requests/hour

### Endpoint-Specific Limits
- Article generation: 10 requests/hour
- Keyword research: 50 requests/hour
- Analytics: 200 requests/hour

## Pagination

### Standard Pagination Parameters
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 50, max: 100)

### Pagination Response Format
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

## Webhooks

### Article Generation Events
```json
{
  "event": "article.completed",
  "data": {
    "article_id": "uuid",
    "workflow_id": "uuid",
    "status": "completed",
    "quality_score": 0.87
  },
  "timestamp": "2026-02-01T12:00:00Z"
}
```

### Workflow Progress Events
```json
{
  "event": "workflow.step_completed",
  "data": {
    "workflow_id": "uuid",
    "step": "longtail_expand",
    "status": "completed",
    "next_step": "filter_keywords"
  },
  "timestamp": "2026-02-01T12:00:00Z"
}
```

## SDK and Client Libraries

### JavaScript/TypeScript
```typescript
import { Infin8ContentClient } from '@infin8content/client'

const client = new Infin8ContentClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.infin8content.com'
})

const workflows = await client.workflows.list()
```

### Python
```python
from infin8content import Infin8ContentClient

client = Infin8ContentClient(
    api_key='your-api-key',
    base_url='https://api.infin8content.com'
)

workflows = client.workflows.list()
```

## Testing

### Sandbox Environment
- URL: `https://sandbox-api.infin8content.com`
- Test data automatically reset daily
- No usage limits for testing

### Test Authentication
Use test credentials for sandbox environment:
```json
{
  "email": "test@example.com",
  "password": "test-password"
}
```
