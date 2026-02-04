# API Structure and Patterns Analysis

## Overview

The Infin8Content API consists of 48 endpoints organized across 8 major domains. The API follows RESTful patterns with consistent authentication, error handling, and response formatting. All endpoints enforce organization-based multi-tenancy via Row Level Security.

## API Organization

### Domain Breakdown

#### 1. Authentication Endpoints (5 endpoints)
**Location**: `app/api/auth/`

- **POST /api/auth/register**
  - Creates new user account
  - Returns user and JWT token
  - Triggers organization creation

- **POST /api/auth/login**
  - Authenticates existing user
  - Returns JWT token
  - Sets session cookies

- **POST /api/auth/logout**
  - Invalidates session
  - Clears authentication state

- **POST /api/auth/resend-otp**
  - Resends OTP for verification
  - Supports email-based auth

- **POST /api/auth/verify-otp**
  - Verifies OTP token
  - Completes authentication flow

**Authentication Pattern:**
```typescript
// All endpoints require JWT in Authorization header
Authorization: Bearer <jwt_token>

// Extracted via middleware
const currentUser = await getCurrentUser()
const organizationId = currentUser.org_id
```

#### 2. Intent Workflow Endpoints (11 endpoints)
**Location**: `app/api/intent/workflows/`

**Core Workflow Management:**
- **GET /api/intent/workflows**
  - Lists all workflows for organization
  - Supports filtering and pagination
  - Returns workflow summary data

- **POST /api/intent/workflows**
  - Creates new workflow
  - Initializes workflow state
  - Returns workflow ID

- **GET /api/intent/workflows/[workflow_id]**
  - Gets workflow details
  - Includes all step metadata
  - Shows current status

- **GET /api/intent/workflows/dashboard**
  - Provides dashboard view
  - Aggregates progress metrics
  - Real-time status updates

**Workflow Step Endpoints:**
- **POST /api/intent/workflows/[workflow_id]/steps/competitor-analyze**
  - Triggers competitor analysis
  - Extracts seed keywords
  - Returns extraction results

- **POST /api/intent/workflows/[workflow_id]/steps/longtail-expand**
  - Expands seed keywords
  - Processes 4 DataForSEO endpoints
  - Returns long-tail keywords

- **POST /api/intent/workflows/[workflow_id]/steps/filter-keywords**
  - Filters keywords by criteria
  - Applies business rules
  - Returns filtered set

- **POST /api/intent/workflows/[workflow_id]/steps/cluster-topics**
  - Creates semantic clusters
  - Implements hub-and-spoke
  - Returns cluster data

- **POST /api/intent/workflows/[workflow_id]/steps/validate-clusters**
  - Validates cluster coherence
  - Checks semantic similarity
  - Returns validation results

- **POST /api/intent/workflows/[workflow_id]/steps/approve-seeds**
  - Human approval gate
  - Creates approval records
  - Updates workflow status

**Blocking Conditions:**
- **GET /api/intent/workflows/[workflow_id]/blocking-conditions**
  - Checks workflow prerequisites
  - Returns blocking reasons
  - Enables conditional progression

**Article Progress:**
- **GET /api/intent/workflows/[workflow_id]/articles/progress**
  - Tracks article generation progress
  - Returns per-article status
  - Provides completion estimates

#### 3. Keyword Endpoints (2 endpoints)
**Location**: `app/api/keywords/`

- **POST /api/keywords/[id]/subtopics**
  - Generates subtopics for keyword
  - Uses DataForSEO subtopic endpoint
  - Returns structured subtopics

- **POST /api/keywords/[keyword_id]/approve-subtopics**
  - Approves or rejects subtopics
  - Creates approval records
  - Updates keyword status

#### 4. Article Endpoints (9 endpoints)
**Location**: `app/api/articles/`

**Core Article Operations:**
- **POST /api/articles/generate**
  - Queues article for generation
  - Triggers Inngest job
  - Returns article ID

- **GET /api/articles/[id]**
  - Gets article details
  - Includes content and metadata
  - Shows generation status

- **GET /api/articles/status**
  - Gets real-time status
  - Supports batch queries
  - Returns progress data

- **POST /api/articles/publish**
  - Publishes to WordPress
  - Handles idempotency
  - Returns WordPress post ID

- **POST /api/articles/queue**
  - Queues articles for generation
  - Batch operation support
  - Returns queue status

**Article Management:**
- **POST /api/articles/[id]/cancel**
  - Cancels generation
  - Cleans up resources
  - Updates status

- **POST /api/articles/bulk**
  - Bulk article operations
  - Batch processing
  - Returns operation results

**Article Diagnostics:**
- **GET /api/articles/[id]/diagnostics**
  - Provides diagnostic data
  - Troubleshooting information
  - Performance metrics

- **POST /api/articles/fix-stuck**
  - Recovers stuck articles
  - Clears error states
  - Resumes generation

**Citation Management:**
- **POST /api/articles/diagnose-broken-citations**
  - Identifies broken citations
  - Validates URLs
  - Returns issues

- **POST /api/articles/fix-broken-citations**
  - Repairs broken citations
  - Validates sources
  - Updates article

- **POST /api/articles/fix-title**
  - Fixes article titles
  - Regenerates if needed
  - Updates metadata

**Usage & Testing:**
- **GET /api/articles/usage**
  - Gets usage statistics
  - Plan limit tracking
  - Billing information

- **POST /api/articles/test-inngest**
  - Tests Inngest integration
  - Triggers test job
  - Validates setup

#### 5. Analytics Endpoints (5 endpoints)
**Location**: `app/api/analytics/`

- **GET /api/analytics/metrics**
  - Gets organization metrics
  - Supports time period filtering
  - Returns aggregated data

- **GET /api/analytics/trends**
  - Gets trend data over time
  - Supports date ranges
  - Returns time-series data

- **POST /api/analytics/share**
  - Creates shareable reports
  - Generates public links
  - Manages sharing

- **POST /api/analytics/export/csv**
  - Exports data as CSV
  - Supports filtering
  - Returns file

- **POST /api/analytics/export/pdf**
  - Exports data as PDF
  - Includes charts
  - Returns file

#### 6. Organization Endpoints (4 endpoints)
**Location**: `app/api/organizations/`

- **POST /api/organizations/create**
  - Creates new organization
  - Sets up initial configuration
  - Returns organization ID

- **POST /api/organizations/update**
  - Updates organization settings
  - Manages configuration
  - Returns updated data

- **GET /api/organizations/[orgId]/competitors**
  - Lists competitor URLs
  - Supports filtering
  - Returns competitor data

- **POST /api/organizations/[orgId]/icp-settings**
  - Manages ICP configuration
  - Sets targeting parameters
  - Returns settings

#### 7. Admin Endpoints (8 endpoints)
**Location**: `app/api/admin/`

**Feature Flags:**
- **GET /api/admin/feature-flags**
  - Lists all feature flags
  - Shows current state
  - Admin only

- **POST /api/feature-flags**
  - Updates feature flags
  - Controls feature rollout
  - Admin only

**Metrics & Monitoring:**
- **GET /api/admin/metrics/dashboard**
  - System metrics dashboard
  - Performance data
  - Health status

- **POST /api/admin/metrics/collect**
  - Collects metrics
  - Aggregates data
  - Stores results

- **GET /api/admin/performance/metrics**
  - Performance metrics
  - API response times
  - Database performance

- **GET /api/admin/efficiency-summary**
  - Efficiency metrics
  - Cost analysis
  - Resource utilization

- **POST /api/admin/reset-sql-usage**
  - Resets usage counters
  - Admin maintenance
  - Testing support

- **GET /api/admin/ux-metrics/rollups**
  - UX metrics aggregation
  - User experience data
  - Trend analysis

#### 8. Debug Endpoints (3 endpoints)
**Location**: `app/api/debug/`

- **GET /api/debug/auth-test**
  - Tests authentication
  - Validates token
  - Returns user info

- **GET /api/debug/inngest-env**
  - Shows Inngest configuration
  - Environment variables
  - Debug information

- **GET /api/debug/payment-status**
  - Shows payment status
  - Stripe integration info
  - Subscription data

#### 9. Audit Endpoints (1 endpoint)
**Location**: `app/api/intent/audit/`

- **GET /api/intent/audit/logs**
  - Retrieves audit logs
  - Supports filtering
  - Pagination support

#### 10. Inngest Endpoints (1 endpoint)
**Location**: `app/api/inngest/`

- **POST /api/inngest**
  - Inngest webhook endpoint
  - Receives job events
  - Triggers handlers

## API Patterns

### Authentication Pattern

```typescript
// Middleware extracts user from JWT
const currentUser = await getCurrentUser()

// Check authentication
if (!currentUser) {
  return NextResponse.json(
    { error: 'Authentication required' },
    { status: 401 }
  )
}

// Get organization context
const organizationId = currentUser.org_id
```

### Request Validation Pattern

```typescript
import { z } from 'zod'

const RequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  filters: z.object({
    minVolume: z.number().optional(),
    maxCompetition: z.string().optional()
  }).optional()
})

export async function POST(request: Request) {
  const body = await request.json()
  const validated = RequestSchema.parse(body)
  // Process validated data
}
```

### Error Handling Pattern

```typescript
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const service = new MyService()
    const result = await service.doSomething()
    
    return NextResponse.json({ data: result })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 }
      )
    }
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      )
    }
    
    // Log unexpected errors
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
```

### Response Format Pattern

```typescript
// Success response
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-01T10:00:00Z",
    "version": "v1"
  }
}

// Error response
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}

// Paginated response
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

### Rate Limiting Pattern

```typescript
// Per-organization rate limits
const limits = {
  'starter': { requests_per_hour: 100 },
  'pro': { requests_per_hour: 500 },
  'agency': { requests_per_hour: 2000 }
}

// Check rate limit
const remaining = await checkRateLimit(organizationId, plan)
if (remaining <= 0) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  )
}
```

### Pagination Pattern

```typescript
// Query parameters
const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
const limit = Math.min(
  parseInt(request.nextUrl.searchParams.get('limit') || '50'),
  100 // Max limit
)

// Calculate offset
const offset = (page - 1) * limit

// Query with limit/offset
const { data, count } = await query
  .limit(limit)
  .offset(offset)

// Return paginated response
return NextResponse.json({
  data,
  pagination: {
    page,
    limit,
    total: count,
    total_pages: Math.ceil(count / limit),
    has_next: offset + limit < count,
    has_prev: page > 1
  }
})
```

## HTTP Status Codes

### Success Codes
- **200 OK**: Successful request
- **201 Created**: Resource created
- **202 Accepted**: Request accepted for processing

### Client Error Codes
- **400 Bad Request**: Invalid request format
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation error
- **429 Too Many Requests**: Rate limit exceeded

### Server Error Codes
- **500 Internal Server Error**: Unexpected error
- **503 Service Unavailable**: External service down

## Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string // Machine-readable error code
    message: string // Human-readable message
    details?: Record<string, any> // Additional context
  }
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED`: Missing or invalid token
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `SERVICE_UNAVAILABLE`: External service down
- `INTERNAL_ERROR`: Unexpected server error

## Endpoint Statistics

### By Domain
- Authentication: 5 endpoints
- Intent Workflows: 11 endpoints
- Keywords: 2 endpoints
- Articles: 9 endpoints
- Analytics: 5 endpoints
- Organizations: 4 endpoints
- Admin: 8 endpoints
- Debug: 3 endpoints
- Audit: 1 endpoint
- Inngest: 1 endpoint

**Total: 49 endpoints**

### By Method
- GET: 18 endpoints
- POST: 31 endpoints

### By Authentication
- Public: 2 endpoints (auth/register, auth/login)
- Authenticated: 45 endpoints
- Admin Only: 8 endpoints

## Request/Response Examples

### Create Workflow
```bash
POST /api/intent/workflows
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Q1 2026 Content Strategy",
  "description": "SEO-focused content plan"
}

Response:
{
  "data": {
    "id": "uuid",
    "name": "Q1 2026 Content Strategy",
    "status": "step_1_icp",
    "created_at": "2026-02-01T10:00:00Z"
  }
}
```

### Generate Article
```bash
POST /api/articles/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "keyword_id": "uuid",
  "workflow_id": "uuid",
  "options": {
    "word_count": 1500,
    "tone": "professional"
  }
}

Response:
{
  "data": {
    "id": "uuid",
    "keyword_id": "uuid",
    "status": "queued",
    "created_at": "2026-02-01T10:00:00Z"
  }
}
```

## Performance Characteristics

### Response Times
- Authentication: < 100ms
- Workflow queries: < 200ms
- Article generation: < 500ms (async)
- Analytics: < 1000ms

### Throughput
- Requests per second: 100+ (with proper scaling)
- Concurrent connections: 1000+
- Database connections: Pooled

## Security Features

### Authentication
- JWT tokens with expiration
- Refresh token rotation
- Secure cookie handling
- Multi-factor authentication support

### Authorization
- Role-based access control
- Organization-based isolation
- Feature flag gating
- Resource ownership validation

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF token validation
- Rate limiting

## Testing Patterns

### Unit Tests
```typescript
describe('POST /api/articles/generate', () => {
  it('should generate article with valid input', async () => {
    const response = await request(app)
      .post('/api/articles/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ keyword_id: 'uuid', workflow_id: 'uuid' })
      .expect(200)
    
    expect(response.body.data.id).toBeDefined()
  })
})
```

### Integration Tests
- Full request/response cycle
- Database operations
- External service mocking
- Error scenario testing

## Improvement Opportunities

1. **GraphQL API**: Reduce over-fetching with GraphQL
2. **Webhooks**: Event-driven integrations
3. **Batch Operations**: More efficient bulk operations
4. **Streaming**: Stream large responses
5. **Caching Headers**: Improve client-side caching
6. **API Versioning**: Support multiple API versions
7. **OpenAPI Documentation**: Auto-generated API docs
8. **SDK Generation**: Auto-generated client libraries
