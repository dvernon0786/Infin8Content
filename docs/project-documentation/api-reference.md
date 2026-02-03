# Infin8Content API Reference Documentation

## Overview

The Infin8Content API follows RESTful patterns with JSON responses, JWT authentication, and comprehensive error handling. All endpoints require authentication and enforce organization-based multi-tenancy.

## Authentication

### JWT Token Authentication
All API endpoints require a valid JWT token passed in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### Organization Context
Users are automatically scoped to their organization via Row Level Security (RLS) policies.

## Base URL
```
https://your-domain.com/api
```

## API Endpoints

### 1. Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

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
