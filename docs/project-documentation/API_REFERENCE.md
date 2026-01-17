# Infin8Content API Reference

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

### JWT Token Authentication

All API endpoints (except public ones) require authentication via JWT token.

```http
Authorization: Bearer <jwt_token>
```

### Token Source

- **Client-side**: Stored in secure HTTP-only cookie
- **Server-side**: Extracted from request headers

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/signin
Sign in user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
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
