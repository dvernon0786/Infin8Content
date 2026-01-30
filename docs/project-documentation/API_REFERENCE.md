# API Reference Documentation

## 🎯 Overview

Complete API reference for all Infin8Content endpoints including WordPress publishing, article management, and realtime functionality.

---

## 📚 Table of Contents

1. [WordPress Publishing APIs](#wordpress-publishing-apis)
2. [Article Management APIs](#article-management-apis)
3. [Authentication APIs](#authentication-apis)
4. [Realtime APIs](#realtime-apis)
5. [Error Codes](#error-codes)
6. [Rate Limiting](#rate-limiting)

---

## 🚀 WordPress Publishing APIs

### POST /api/articles/publish

Publish a completed article to WordPress.

**Authentication Required**: Yes  
**Rate Limit**: 10 requests per minute per user  

#### Request

```json
{
  "articleId": "uuid-string"
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| articleId | string | Yes | UUID of the article to publish |

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "url": "https://site.com/post-url",
  "postId": 123,
  "alreadyPublished": false
}
```

**Already Published (200 OK):**
```json
{
  "success": true,
  "url": "https://site.com/existing-post-url",
  "alreadyPublished": true
}
```

**Error Responses:**
```json
// 401 Unauthorized
{
  "error": "Authentication required"
}

// 403 Forbidden
{
  "error": "Access denied"
}

// 404 Not Found
{
  "error": "Article not found"
}

// 400 Bad Request
{
  "error": "Article must be completed before publishing"
}

// 500 Internal Server Error
{
  "error": "WordPress authentication failed. Please check your credentials."
}

// 503 Service Unavailable
{
  "error": "WordPress publishing is currently disabled"
}
```

#### Example

```bash
curl -X POST http://localhost:3000/api/articles/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"articleId": "f8080b57-b592-46ff-a9de-f6e3a2a871b1"}'
```

---

### GET /api/articles/publish

Check WordPress publishing feature status and configuration.

**Authentication Required**: Yes  

#### Response

```json
{
  "enabled": true,
  "configured": true
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| enabled | boolean | Whether WordPress publishing is enabled via feature flag |
| configured | boolean | Whether WordPress credentials are properly configured |

---

## 📝 Article Management APIs

### GET /api/articles

List articles for the authenticated user's organization.

**Authentication Required**: Yes  
**Rate Limit**: 100 requests per minute per user  

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | number | No | 20 | Maximum number of articles to return |
| offset | number | No | 0 | Number of articles to skip |
| status | string | No | all | Filter by article status |
| sort | string | No | created_at | Sort field |
| order | string | No | desc | Sort order (asc/desc) |

#### Response

```json
{
  "articles": [
    {
      "id": "uuid-string",
      "title": "Article Title",
      "keyword": "article-keyword",
      "status": "completed",
      "target_word_count": 2000,
      "writing_style": "professional",
      "target_audience": "general",
      "created_at": "2026-01-22T00:00:00Z",
      "updated_at": "2026-01-22T00:00:00Z",
      "org_id": "uuid-string"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

---

### GET /api/articles/[id]

Get detailed information about a specific article.

**Authentication Required**: Yes  

#### Response

```json
{
  "id": "uuid-string",
  "title": "Article Title",
  "keyword": "article-keyword",
  "status": "completed",
  "target_word_count": 2000,
  "writing_style": "professional",
  "target_audience": "general",
  "content": "<p>Article content...</p>",
  "sections": [
    {
      "id": "uuid-string",
      "section_type": "introduction",
      "section_title": "Introduction",
      "section_order": 1,
      "content": "Section content...",
      "word_count": 250,
      "status": "completed"
    }
  ],
  "created_at": "2026-01-22T00:00:00Z",
  "updated_at": "2026-01-22T00:00:00Z",
  "org_id": "uuid-string"
}
```

---

### POST /api/articles

Create a new article for generation.

**Authentication Required**: Yes  
**Rate Limit**: 10 requests per minute per user  

#### Request

```json
{
  "keyword": "article-keyword",
  "target_word_count": 2000,
  "writing_style": "professional",
  "target_audience": "general",
  "custom_instructions": "Additional instructions..."
}
```

#### Response

```json
{
  "id": "uuid-string",
  "keyword": "article-keyword",
  "status": "queued",
  "created_at": "2026-01-22T00:00:00Z"
}
```

---

## 🔐 Authentication APIs

### POST /api/auth/signin

Sign in user with email and password.

**Rate Limit**: 5 requests per minute per IP  

#### Request

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Response

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt_token_here"
}
```

---

### POST /api/auth/logout

Invalidate user session.

**Authentication Required**: Yes  

#### Response

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/me

Get current user information.

**Authentication Required**: Yes  

#### Response

```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "name": "User Name",
  "org_id": "uuid-string",
  "role": "admin",
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

## 🔄 Realtime APIs

### GET /api/articles/[id]/status

Get real-time status updates for an article.

**Authentication Required**: Yes  
**Rate Limit**: 60 requests per minute per user  

#### Response

```json
{
  "id": "uuid-string",
  "status": "generating",
  "progress": 75,
  "current_section": "Main Content",
  "estimated_completion": "2026-01-22T00:30:00Z",
  "updated_at": "2026-01-22T00:15:00Z"
}
```

#### WebSocket Connection

For real-time updates, connect to the WebSocket endpoint:

```javascript
const ws = new WebSocket('ws://localhost:3000/api/articles/realtime');
ws.send(JSON.stringify({
  type: 'subscribe',
  articleId: 'uuid-string',
  token: 'JWT_TOKEN'
}));
```

#### WebSocket Events

```json
// Status update
{
  "type": "status_update",
  "articleId": "uuid-string",
  "status": "completed",
  "progress": 100,
  "timestamp": "2026-01-22T00:30:00Z"
}

// Progress update
{
  "type": "progress_update",
  "articleId": "uuid-string",
  "progress": 85,
  "current_section": "Conclusion",
  "timestamp": "2026-01-22T00:25:00Z"
}
```

---

## ❌ Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required or invalid |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Feature disabled or maintenance |

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details",
    "timestamp": "2026-01-22T00:00:00Z"
  }
}
```

### Specific Error Codes

| Code | Context | Description |
|------|---------|-------------|
| ARTICLE_NOT_FOUND | Article APIs | Article with specified ID not found |
| ARTICLE_NOT_COMPLETED | WordPress Publishing | Article must be completed before publishing |
| WORDPRESS_DISABLED | WordPress Publishing | WordPress publishing feature disabled |
| WORDPRESS_AUTH_FAILED | WordPress Publishing | WordPress authentication failed |
| WORDPRESS_API_ERROR | WordPress Publishing | WordPress API error occurred |
| PUBLISH_ALREADY_EXISTS | WordPress Publishing | Article already published |
| INVALID_CREDENTIALS | Authentication | Invalid email or password |
| TOKEN_EXPIRED | Authentication | JWT token has expired |
| INSUFFICIENT_PERMISSIONS | Authorization | User lacks required permissions |
| RATE_LIMIT_EXCEEDED | Rate Limiting | Too many requests |
| VALIDATION_ERROR | Validation | Request validation failed |

---

## ⚡ Rate Limiting

### Rate Limits by Endpoint

| Endpoint | Limit | Period | Scope |
|----------|-------|--------|-------|
| POST /api/articles/publish | 10 | 1 minute | Per user |
| POST /api/articles | 10 | 1 minute | Per user |
| GET /api/articles | 100 | 1 minute | Per user |
| GET /api/articles/[id]/status | 60 | 1 minute | Per user |
| POST /api/auth/signin | 5 | 1 minute | Per IP |
| All other endpoints | 1000 | 1 hour | Per user |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642848000
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 10,
    "reset": "2026-01-22T00:01:00Z"
  }
}
```

---

## 🌐 Base URLs

```
Production: https://api.infin8content.com
Development: http://localhost:3000/api
Sandbox: https://sandbox-api.infin8content.com
```

---

## 🔍 Pagination

### Cursor-based Pagination

For large datasets, use cursor-based pagination:

```json
{
  "data": [...],
  "pagination": {
    "hasNext": true,
    "hasPrev": false,
    "nextCursor": "eyJpZCI6IjEyMyJ9",
    "prevCursor": null
  }
}
```

### Offset-based Pagination

For smaller datasets, use offset-based pagination:

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 📝 SDK Examples

### JavaScript/TypeScript

```typescript
import { Infin8ContentAPI } from '@infin8content/api-client';

const api = new Infin8ContentAPI({
  baseURL: 'https://api.infin8content.com',
  token: 'your-jwt-token'
});

// Publish article
const result = await api.articles.publish({
  articleId: 'uuid-string'
});

// Get articles
const articles = await api.articles.list({
  limit: 20,
  status: 'completed'
});
```

### Python

```python
import requests

class Infin8ContentAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def publish_article(self, article_id):
        response = requests.post(
            f'{self.base_url}/api/articles/publish',
            headers=self.headers,
            json={'articleId': article_id}
        )
        return response.json()

api = Infin8ContentAPI('https://api.infin8content.com', 'your-token')
result = api.publish_article('uuid-string')
```

---

## 🧪 Testing Endpoints

### Sandbox Environment

For testing, use the sandbox environment:

- **Base URL**: `https://sandbox-api.infin8content.com`
- **Authentication**: Test tokens available in developer dashboard
- **Rate Limits**: Relaxed for testing

### Test Data

```json
{
  "test_article_id": "00000000-0000-0000-0000-000000000000",
  "test_token": "test-jwt-token-for-development"
}
```

---

## 📞 Support

### API Support

- **Documentation**: [https://docs.infin8content.com](https://docs.infin8content.com)
- **Status Page**: [https://status.infin8content.com](https://status.infin8content.com)
- **Support Email**: api-support@infin8content.com

### Reporting Issues

When reporting API issues, include:
- Request URL and method
- Request headers and body
- Response status and body
- Timestamp and timezone
- User ID and organization ID (if applicable)

---

## 🔄 Version History

### v2.0.0 (January 22, 2026)
- ✅ Added WordPress publishing APIs
- ✅ Enhanced realtime stability
- ✅ Improved error handling
- ✅ Added comprehensive rate limiting

### v1.0.0 (January 1, 2026)
- ✅ Initial API release
- ✅ Basic article management
- ✅ Authentication system
- ✅ Realtime updates

---

**This API reference is continuously updated. Check the documentation portal for the latest changes and additions.**

#### POST /api/auth/signup
Register new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt_token_here"
}
```

#### POST /api/auth/signout
Sign out current user.

**Response:**
```json
{
  "success": true
}
```

#### GET /api/auth/me
Get current user information.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "subscription": {
      "plan": "pro",
      "status": "active"
    }
  }
}
```

### Articles Endpoints

#### GET /api/articles
Get list of articles with filtering and pagination.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `status` (string, optional): Filter by status (`draft`, `published`, `archived`)
- `organization_id` (string, optional): Filter by organization
- `search` (string, optional): Search in title and content

**Response:**
```json
{
  "articles": [
    {
      "id": "uuid",
      "title": "Article Title",
      "content": "Article content...",
      "excerpt": "Brief excerpt...",
      "status": "published",
      "author_id": "uuid",
      "organization_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "author": {
        "id": "uuid",
        "name": "John Doe",
        "avatar": "https://example.com/avatar.jpg"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### POST /api/articles
Create new article.

**Request Body:**
```json
{
  "title": "Article Title",
  "content": "Article content...",
  "status": "draft",
  "organization_id": "uuid",
  "tags": ["tag1", "tag2"],
  "featured_image": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "article": {
    "id": "uuid",
    "title": "Article Title",
    "content": "Article content...",
    "status": "draft",
    "organization_id": "uuid",
    "author_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/articles/[id]
Get specific article by ID.

**Response:**
```json
{
  "article": {
    "id": "uuid",
    "title": "Article Title",
    "content": "Article content...",
    "excerpt": "Brief excerpt...",
    "status": "published",
    "author_id": "uuid",
    "organization_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "author": {
      "id": "uuid",
      "name": "John Doe",
      "avatar": "https://example.com/avatar.jpg"
    },
    "organization": {
      "id": "uuid",
      "name": "Organization Name"
    },
    "tags": ["tag1", "tag2"],
    "featured_image": "https://example.com/image.jpg"
  }
}
```

#### PUT /api/articles/[id]
Update existing article.

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "status": "published",
  "tags": ["tag1", "tag2", "tag3"]
}
```

**Response:**
```json
{
  "article": {
    "id": "uuid",
    "title": "Updated Title",
    "content": "Updated content...",
    "status": "published",
    "updated_at": "2024-01-02T00:00:00Z"
  }
}
```

#### DELETE /api/articles/[id]
Delete article.

**Response:**
```json
{
  "success": true
}
```

### Reconciliation Endpoints

#### GET /api/articles/queue
**Authoritative reconciliation endpoint for articles data.**

This endpoint is the **single source of truth** for article state reconciliation and is safe to call repeatedly.

**Purpose:**
- Primary data source for all article state updates
- Idempotent refresh mechanism for realtime event handling
- Fallback data source for polling mechanisms
- Authoritative state resolution for conflicts

**Query Parameters:**
- `organization_id` (string, optional): Filter by organization
- `status` (string, optional): Filter by status (`draft`, `published`, `archived`)
- `limit` (number, optional): Maximum items to return (default: 50)

**Response:**
```json
{
  "articles": [
    {
      "id": "uuid",
      "title": "Article Title",
      "content": "Article content...",
      "status": "published",
      "author_id": "uuid",
      "organization_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "author": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 50,
    "has_more": false
  }
}
```

**Key Characteristics:**
- **Idempotent**: Safe to call multiple times without side effects
- **Authoritative**: Returns current database state, not cached or partial data
- **Complete**: Full article objects with all necessary relationships
- **Consistent**: Same data structure regardless of trigger (realtime, polling, manual)
- **Performant**: Optimized for frequent calls with proper database indexing

**Usage Patterns:**

```typescript
// ✅ CORRECT: Realtime reconciliation
supabase.channel('articles')
  .on('postgres_changes', (event) => {
    // Trigger authoritative refresh
    refreshArticlesFromQueue()
  })

// ✅ CORRECT: Polling fallback
useEffect(() => {
  const polling = setInterval(() => {
    if (!navigator.onLine) {
      refreshArticlesFromQueue() // Idempotent fallback
    }
  }, 120000)
  return () => clearInterval(polling)
}, [])

// ✅ CORRECT: Manual refresh
async function refreshArticlesFromQueue() {
  const response = await fetch('/api/articles/queue')
  const data = await response.json()
  setArticles(data.articles) // Replace entire state
}
```

**Why This Endpoint is Authoritative:**

1. **Database Direct**: Queries database directly, no caches or intermediaries
2. **Full Reconciliation**: Returns complete state, not incremental changes
3. **Conflict Resolution**: Resolves any state inconsistencies automatically
4. **Realtime Integration**: Designed specifically for realtime event handling
5. **Polling Safety**: Optimized for frequent polling without performance impact

**Important Notes:**
- This endpoint should be used for all state updates, never individual article endpoints
- Realtime payloads must trigger calls to this endpoint, never direct state updates
- Polling mechanisms should use this endpoint as their fallback data source
- Client-side state should always be replaced, never merged with queue response data

### Organizations Endpoints

#### GET /api/organizations
Get user's organizations.

**Response:**
```json
{
  "organizations": [
    {
      "id": "uuid",
      "name": "Organization Name",
      "slug": "org-slug",
      "owner_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "member_count": 5,
      "article_count": 25
    }
  ]
}
```

#### POST /api/organizations
Create new organization.

**Request Body:**
```json
{
  "name": "New Organization",
  "slug": "new-org"
}
```

**Response:**
```json
{
  "organization": {
    "id": "uuid",
    "name": "New Organization",
    "slug": "new-org",
    "owner_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/organizations/[id]
Get organization details.

**Response:**
```json
{
  "organization": {
    "id": "uuid",
    "name": "Organization Name",
    "slug": "org-slug",
    "owner_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "members": [
      {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "admin"
      }
    ]
  }
}
```

### Payments Endpoints

#### POST /api/payments/checkout
Create Stripe checkout session.

**Request Body:**
```json
{
  "price_id": "price_1234567890",
  "success_url": "https://your-domain.com/success",
  "cancel_url": "https://your-domain.com/cancel",
  "customer_email": "user@example.com"
}
```

**Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/pay/cs_test_1234567890"
}
```

#### POST /api/payments/webhook
Handle Stripe webhooks.

**Headers:**
- `stripe-signature`: Stripe signature for webhook verification

**Request Body:** Stripe webhook event payload

**Response:**
```json
{
  "received": true
}
```

#### GET /api/payments/subscription
Get current subscription status.

**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    "status": "active",
    "plan": "pro",
    "current_period_end": "2024-02-01T00:00:00Z",
    "cancel_at_period_end": false,
    "customer": {
      "id": "cus_1234567890",
      "email": "user@example.com"
    }
  }
}
```

#### POST /api/payments/portal
Create Stripe Customer Portal session.

**Request Body:**
```json
{
  "return_url": "https://your-domain.com/settings/billing"
}
```

**Response:**
```json
{
  "portal_url": "https://billing.stripe.com/session/portal_1234567890"
}
```

### Users Endpoints

#### GET /api/users/profile
Get user profile.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "User biography",
    "website": "https://example.com",
    "location": "New York, USA",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/users/profile
Update user profile.

**Request Body:**
```json
{
  "name": "Updated Name",
  "bio": "Updated biography",
  "website": "https://updated-website.com",
  "location": "Updated location"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "Updated Name",
    "bio": "Updated biography",
    "website": "https://updated-website.com",
    "location": "Updated location",
    "updated_at": "2024-01-02T00:00:00Z"
  }
}
```

#### POST /api/users/avatar
Upload user avatar.

**Request Body:** `multipart/form-data`
- `avatar`: Image file (max 5MB, jpg/png/webp)

**Response:**
```json
{
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required or invalid |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | External service unavailable |

### Validation Errors

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": {
        "email": "Invalid email format",
        "password": "Password must be at least 8 characters"
      }
    }
  }
}
```

## Rate Limiting

### Rate Limits

- **Authenticated requests**: 1000 requests per hour
- **Unauthenticated requests**: 100 requests per hour
- **Upload endpoints**: 10 requests per hour

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

### Standard Pagination

All list endpoints support pagination:

```http
GET /api/articles?page=2&limit=20
```

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": true
  }
}
```

### Cursor Pagination (for large datasets)

```http
GET /api/articles?cursor=eyJpZCI6InV1aWQxMjMifQ&limit=20
```

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6InV1aWQ0NTYifQ",
    "hasNext": true,
    "limit": 20
  }
}
```

## Search and Filtering

### Search Parameters

- `search`: Full-text search
- `sort`: Sort field (`created_at`, `updated_at`, `title`)
- `order`: Sort order (`asc`, `desc`)
- `filters[field]`: Field-specific filters

### Example Search

```http
GET /api/articles?search=react&sort=created_at&order=desc&filters[status]=published
```

## Webhooks

### Stripe Webhooks

**Endpoint:** `POST /api/payments/webhook`

**Supported Events:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Webhook Verification:**
```typescript
const signature = request.headers.get('stripe-signature')
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
```

## SDK Examples

### JavaScript/TypeScript

```typescript
// API client setup
const api = {
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
}

// Authenticated request
async function getArticles() {
  const response = await fetch(`${api.baseURL}/articles`, {
    headers: {
      ...api.headers,
      'Authorization': `Bearer ${token}`,
    },
  })
  return response.json()
}

// Create article
async function createArticle(articleData) {
  const response = await fetch(`${api.baseURL}/articles`, {
    method: 'POST',
    headers: {
      ...api.headers,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(articleData),
  })
  return response.json()
}
```

### Python

```python
import requests

class Infin8ContentAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_articles(self, page=1, limit=10):
        response = requests.get(
            f'{self.base_url}/articles',
            headers=self.headers,
            params={'page': page, 'limit': limit}
        )
        return response.json()
    
    def create_article(self, article_data):
        response = requests.post(
            f'{self.base_url}/articles',
            headers=self.headers,
            json=article_data
        )
        return response.json()
```

## Testing

### API Testing Examples

```bash
# Health check
curl -X GET http://localhost:3000/api/health

# Get articles (authenticated)
curl -X GET http://localhost:3000/api/articles \
  -H "Authorization: Bearer <token>"

# Create article
curl -X POST http://localhost:3000/api/articles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Article", "content": "Test content"}'
```

---

*This API reference provides comprehensive documentation for all Infin8Content API endpoints.*
