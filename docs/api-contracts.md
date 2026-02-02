# API Contracts - Infin8Content

Generated: 2026-01-23 (Deep Scan Update)  
Framework: Next.js 16.1.1 API Routes  
Base URL: `/api`

## Overview

Infin8Content implements a comprehensive REST API using Next.js App Router with TypeScript, featuring multi-tenant architecture, authentication, payment processing, and AI content generation capabilities.

## Authentication

All API endpoints require authentication via Supabase Auth sessions. Authentication is handled through middleware and user context validation.

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Registers new user with OTP verification via Brevo email service.

**Request Body:**
```typescript
{
  email: string;
  password: string; // min 8 characters
}
```

**Response:** 201 Created
```typescript
{
  message: "Registration successful. Please check your email for OTP code.";
  userId: string;
}
```

#### POST /api/auth/verify-otp
Verifies OTP code for user registration.

**Request Body:**
```typescript
{
  email: string;
  code: string; // 6-digit OTP
}
```

#### POST /api/auth/login
Authenticates user and creates session.

#### POST /api/auth/logout
Terminates user session.

### Articles Endpoints

#### POST /api/articles/generate
Creates new article and queues it for AI generation (Story 4a implementation).

**Authentication:** Required (401 if not authenticated)  
**Usage Limits:** Enforced per plan (Starter: 10, Pro: 50, Agency: unlimited)

**Request Body:**
```typescript
{
  keyword: string; // min 1, max 200 characters
  targetWordCount: number; // min 500, max 10000
  writingStyle?: 'Professional' | 'Conversational' | 'Technical' | 'Casual' | 'Formal';
  targetAudience?: 'General' | 'B2B' | 'B2C' | 'Technical' | 'Consumer';
  customInstructions?: string; // max 2000 characters
}
```

**Response:** 200 OK
```typescript
{
  id: string;
  keyword: string;
  status: 'queued';
  createdAt: string;
  estimatedCompletionTime: string;
}
```

**Error Responses:**
- 401 Unauthorized: Authentication required
- 403 Forbidden: Usage limit exceeded
```typescript
{
  error: "You've reached your article limit for this month";
  details: {
    code: 'USAGE_LIMIT_EXCEEDED';
    usageLimitExceeded: true;
    currentUsage: number;
    limit: number | null;
  };
}
```

**Features:**
- Multi-tenant article creation with organization isolation
- Usage tracking with monthly billing periods
- Activity logging for audit trail
- Automatic queuing via Inngest for AI generation
- Plan-based usage limits enforcement

#### POST /api/articles/publish
Publishes article to WordPress (Story 5-1 implementation).

**Request Body:**
```typescript
{
  articleId: string;
}
```

**Response:** 200 OK
```typescript
{
  success: boolean;
  wordpressPostId?: string;
  wordpressUrl?: string;
  publishedAt: string;
}
```

**Features:**
- Idempotent publishing via publish_references table
- WordPress Application Password authentication
- Synchronous execution with 30s timeout
- Error handling for API failures

### Organizations Endpoints

#### GET /api/organizations
Retrieves user's organizations.

#### POST /api/organizations
Creates new organization.

#### PUT /api/organizations/{id}
Updates organization details.

### Payment Endpoints

#### POST /api/payment/create-checkout-session
Creates Stripe checkout session for subscription.

#### POST /api/payment/webhook
Handles Stripe webhook events.

### Team Management Endpoints

#### GET /api/team/members
Lists organization team members.

#### POST /api/team/invite
Invites new team member.

#### POST /api/team/accept-invitation
Accepts team invitation.

### Analytics Endpoints

#### GET /api/analytics/dashboard
Retrieves dashboard analytics data.

#### GET /api/analytics/performance
Gets performance metrics.

### Research Endpoints

#### POST /api/research/keyword
Performs keyword research using Tavily API.

#### POST /api/research/seo-analysis
Conducts SEO analysis using DataForSEO.

### SEO Endpoints

#### GET /api/seo/metrics
Retrieves SEO metrics for content.

#### POST /api/seo/optimize
Optimizes content for SEO.

## Error Handling

Standard error response format:
```typescript
{
  error: string;
  code?: string;
  details?: any;
}
```

Common HTTP status codes:
- 400: Bad Request (validation errors)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error
- 503: Service Unavailable (feature disabled)

### Intent Workflow Endpoints

#### ICP Gate Enforcement (Story 39-1)
All downstream Intent Engine workflow endpoints are protected by an ICP (Ideal Customer Profile) completion gate. This ensures that ICP generation is completed before any subsequent workflow steps can be executed.

**Gate Behavior:**
- **423 Blocked:** Returned when ICP is not complete (`step_1_icp` or earlier)
- **200 OK:** Proceeds normally when ICP is complete (`step_2_icp_complete` or later)
- **Fail-Open:** Database errors allow access for availability

**423 Response Format:**
```typescript
{
  error: "ICP completion required before {step_name}",
  workflowStatus: "step_1_icp",
  icpStatus: "step_1_icp", 
  requiredAction: "Complete ICP generation (step 2) before proceeding",
  currentStep: "{step_name}",
  blockedAt: "2026-01-31T10:00:00.000Z"
}
```

**Protected Endpoints:**
- POST /api/intent/workflows/{workflow_id}/steps/competitor-analyze
- POST /api/intent/workflows/{workflow_id}/steps/longtail-expand  
- POST /api/intent/workflows/{workflow_id}/steps/filter-keywords
- POST /api/intent/workflows/{workflow_id}/steps/cluster-topics
- POST /api/intent/workflows/{workflow_id}/steps/validate-clusters
- POST /api/keywords/{keyword_id}/subtopics
- POST /api/keywords/{keyword_id}/approve-subtopics
- POST /api/intent/workflows/{workflow_id}/steps/queue-articles

**Audit Logging:**
All gate enforcement attempts are logged with:
- `workflow.gate.icp.allowed` - when access is permitted
- `workflow.gate.icp.blocked` - when access is denied
- Full context including workflow status, step attempted, and error details

#### POST /api/intent/workflows/{workflow_id}/steps/approve-seeds
Approves or rejects seed keywords for long-tail expansion (Story 35.3).

**Authentication:** Required (401 if not authenticated)  
**Authorization:** User must be organization admin (403 if not admin)

**Path Parameters:**
```typescript
{
  workflow_id: string; // UUID of intent workflow
}
```

**Request Body:**
```typescript
{
  decision: 'approved' | 'rejected'; // Approval decision
  feedback?: string; // Optional feedback or notes
  approved_keyword_ids?: string[]; // Optional subset of keyword IDs for partial approval
}
```

**Response:** 200 OK
```typescript
{
  success: boolean;
  approval_id: string; // UUID of approval record
  workflow_status: 'step_3_seeds'; // Status unchanged (governance gate)
  message: string; // Success message
}
```

**Workflow State Requirements:**
- Workflow must be in `step_3_seeds` status
- Seed keywords must exist

**Business Logic:**
- Idempotent: One approval record per workflow + approval_type
- Full approval: All seed keywords approved (approved_items = null)
- Partial approval: Only specified keyword IDs approved
- Rejection: No keywords approved for expansion

**Error Responses:**
- 400 Bad Request: Invalid decision, workflow state, or keyword ID format
- 401 Unauthorized: Authentication required
- 403 Forbidden: Admin access required
- 404 Not Found: Workflow not found or belongs to different organization
- 500 Internal Server Error: Database constraint violation

#### POST /api/intent/workflows/{workflow_id}/steps/longtail-expand
Expands seed keywords into long-tail keywords using four DataForSEO endpoints (Story 35.1).

**Authentication:** Required (401 if not authenticated)  
**Authorization:** Workflow must belong to authenticated user's organization

**Path Parameters:**
```typescript
{
  workflow_id: string; // UUID of intent workflow
}
```

**Request Body:**
```typescript
{
  // No request body required - uses workflow context
}
```

**Response:** 200 OK
```typescript
{
  success: boolean;
  data: {
    seeds_processed: number;
    longtails_created: number;
    step_4_longtails_completed_at: string; // ISO 8601 timestamp
  }
}
```

**Workflow State Requirements:**
- Workflow must be in `step_3_seeds` status
- Seed keywords must exist with `longtail_status = 'not_started'`

**Error Responses:**
- 400 Bad Request: Invalid workflow state or no seed keywords found
- 401 Unauthorized: Authentication required
- 404 Not Found: Workflow not found or belongs to different organization
- 500 Internal Server Error: Expansion failed

**DataForSEO Integration:**
Calls four endpoints per seed keyword:
1. `/v3/dataforseo_labs/google/related_keywords/live` - 3 results
2. `/v3/dataforseo_labs/google/keyword_suggestions/live` - 3 results
3. `/v3/dataforseo_labs/google/keyword_ideas/live` - 3 results
4. `/v3/serp/google/autocomplete/live/advanced` - 3 results

**Retry Policy:**
- Max attempts: 3
- Backoff: Exponential (2s, 4s, 8s)
- Timeout: 5 minutes total

**Database Updates:**
- Creates new keyword records with `parent_seed_keyword_id` reference
- Updates seed keyword `longtail_status` to `'complete'`
- Updates workflow status to `step_4_longtails`

**Audit Logging:**
- `workflow.longtail_keywords.started` - on request start
- `workflow.longtail_keywords.completed` - on successful completion
- `workflow.longtail_keywords.failed` - on error

#### GET /api/intent/workflows/{workflow_id}/steps/human-approval/summary
Provides a complete, read-only summary of the workflow for human review (Story 37.3).

**Authentication:** Required (401 if not authenticated)  
**Authorization:** Workflow must belong to authenticated user's organization

**Path Parameters:**
```typescript
{
  workflow_id: string; // UUID of intent workflow
}
```

**Request Body:** None

**Response:** 200 OK
```typescript
{
  workflow_id: string;
  status: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  icp_document: any;
  competitor_analysis: any;
  seed_keywords: any[];
  longtail_keywords: any[];
  topic_clusters: any[];
  validation_results: any[];
  approved_keywords: any[];
  summary_statistics: {
    total_keywords: number;
    seed_keywords_count: number;
    longtail_keywords_count: number;
    topic_clusters_count: number;
    approved_keywords_count: number;
  }
}
```

**Workflow State Requirements:**
- Workflow must exist and belong to user's organization
- No specific status requirement (read-only)

**Error Responses:**
- 400 Bad Request: Invalid workflow ID
- 401 Unauthorized: Authentication required
- 403 Forbidden: Workflow belongs to different organization
- 404 Not Found: Workflow not found
- 500 Internal Server Error: Database query failed

#### POST /api/intent/workflows/{workflow_id}/steps/human-approval
Processes final human approval decision for the entire workflow (Story 37.3).

**Authentication:** Required (401 if not authenticated)  
**Authorization:** User must be organization admin (403 if not admin)

**Path Parameters:**
```typescript
{
  workflow_id: string; // UUID of intent workflow
}
```

**Request Body:**
```typescript
{
  decision: 'approved' | 'rejected'; // Approval decision
  feedback?: string; // Optional feedback or notes
  reset_to_step?: number; // Required if rejected: 1-7
}
```

**Response:** 200 OK
```typescript
{
  success: boolean;
  approval_id: string; // UUID of approval record
  workflow_status: string; // 'step_9_articles' if approved, 'step_{reset_to_step}' if rejected
  message: string; // Success message
}
```

**Workflow State Requirements:**
- Workflow must be in `step_7_subtopics` status
- Keywords with `article_status = 'ready'` must exist

**Business Logic:**
- Idempotent: One approval record per workflow + approval_type
- Approved: Workflow status updates to `step_9_articles` (article generation eligible)
- Rejected: Workflow status resets to specified step with feedback

**Error Responses:**
- 400 Bad Request: Invalid decision, workflow state, or reset_to_step
- 401 Unauthorized: Authentication required
- 403 Forbidden: Admin access required
- 404 Not Found: Workflow not found or belongs to different organization
- 500 Internal Server Error: Database constraint violation

**Audit Logging:**
- `workflow.human_approval.started` - on request start
- `workflow.human_approval.approved` - on approval
- `workflow.human_approval.rejected` - on rejection

#### GET /api/intent/workflows/{workflow_id}/articles/progress
Tracks article generation progress for intent workflows (Story 38.2).

**Authentication:** Required (401 if not authenticated)  
**Authorization:** Workflow must belong to authenticated user's organization

**Path Parameters:**
```typescript
{
  workflow_id: string; // UUID of intent workflow
}
```

**Query Parameters:**
```typescript
{
  status?: 'queued' | 'generating' | 'completed' | 'failed'; // Filter by status
  date_from?: string;       // ISO 8601 timestamp (inclusive)
  date_to?: string;         // ISO 8601 timestamp (inclusive)
  limit?: number;          // Max 1000, default 100
  offset?: number;         // Default 0
}
```

**Response:** 200 OK
```typescript
{
  workflow_id: string;
  total_articles: number;
  articles: [
    {
      article_id: string;
      subtopic_id?: string;
      status: 'queued' | 'generating' | 'completed' | 'failed';
      progress_percent: number;        // 0-100
      sections_completed: number;
      sections_total: number;
      current_section?: string;
      estimated_completion_time?: string; // ISO 8601
      created_at: string;
      started_at?: string;
      completed_at?: string;
      error?: {
        code: string;
        message: string;
        details: object;
      } | null;
      word_count?: number;
      quality_score?: number;
    }
  ];
  summary: {
    queued_count: number;
    generating_count: number;
    completed_count: number;
    failed_count: number;
    average_generation_time_seconds: number;
    estimated_total_completion_time?: string;
  };
}
```

**Workflow State Requirements:**
- Workflow must exist and belong to user's organization
- No specific status requirement (read-only)

**Business Logic:**
- Read-only access to article generation progress
- Supports filtering by status, date range, and pagination
- Calculates estimated completion times based on current progress
- Returns comprehensive summary statistics

**Error Responses:**
- 400 Bad Request: Invalid workflow ID, date format, or status parameter
- 401 Unauthorized: Authentication required
- 403 Forbidden: Workflow belongs to different organization
- 404 Not Found: Workflow not found
- 500 Internal Server Error: Database query failed

**Performance:**
- Response time < 2 seconds for 1000+ articles
- Supports pagination for large result sets
- Indexed queries on (workflow_id, status, created_at)

**Audit Logging:**
- `workflow.article_generation.progress_queried` - on successful request
- `workflow.article_generation.progress_error` - on error

#### POST /api/intent/workflows/{workflow_id}/steps/link-articles
Links completed articles back to their originating intent workflow (Story 38.3).

**Authentication:** Required (401 if not authenticated)  
**Authorization:** Organization isolation via RLS (403 if not owner)  
**Rate Limiting:** Standard API limits apply

**Request Body:** Empty (workflow_id from path parameter)

**Response:** 200 OK
```typescript
{
  success: true;
  data: {
    workflow_id: string;
    linking_status: 'in_progress' | 'completed' | 'failed';
    total_articles: number;
    linked_articles: number;
    already_linked: number;
    failed_articles: number;
    workflow_status: string;
    processing_time_seconds: number;
    details: {
      linked_article_ids: string[];
      failed_article_ids: string[];
      skipped_article_ids: string[];
    };
  };
}
```

**Workflow State Requirements:**
- Workflow must exist and belong to user's organization
- Workflow status must be 'step_9_articles'

**Business Logic:**
- Links completed/published articles to their workflow
- Processes articles in batches of 10 for performance
- Updates workflow status to 'step_10_completed' when successful
- Maintains bidirectional references (articles ↔ workflow)
- Idempotent: safe to re-run, skips already linked articles

**Database Changes:**
- articles.workflow_link_status: 'not_linked' → 'linking' → 'linked'/'failed'
- articles.linked_at: timestamp when linked
- intent_workflows.article_link_count: count of linked articles
- intent_workflows.status: 'step_9_articles' → 'step_10_completed'

**Error Responses:**
- 400 Bad Request: Invalid workflow state (must be step_9_articles)
- 401 Unauthorized: Authentication required
- 403 Forbidden: Workflow belongs to different organization
- 404 Not Found: Workflow not found
- 500 Internal Server Error: Linking service failure

**Performance:**
- Processing time < 30 seconds for 100 articles
- Batch processing (10 articles per transaction)
- Database indexes on (workflow_id, status, workflow_link_status)

**Audit Logging:**
- `workflow.articles.linking.started` - when linking process begins
- `workflow.article.linked` - for each successfully linked article
- `workflow.article.link_failed` - for each failed linking attempt
- `workflow.articles.linking.completed` - when entire process completes
- `workflow.articles.linking.failed` - on overall process failure

#### GET /api/intent/audit/logs
Retrieves Intent Engine audit logs for compliance tracking (Story 37.4).

**Authentication:** Required (401 if not authenticated)  
**Authorization:** Organization owners only (403 if not owner)  
**Rate Limiting:** Standard API limits apply

**Query Parameters:**
```typescript
{
  workflow_id?: string;     // Filter by specific workflow
  actor_id?: string;        // Filter by specific user
  action?: string;          // Filter by specific action
  entity_type?: 'workflow' | 'keyword' | 'article'; // Filter by entity type
  date_from?: string;       // ISO 8601 timestamp (inclusive)
  date_to?: string;         // ISO 8601 timestamp (inclusive)
  limit?: number;           // Max 1000, default 100
  offset?: number;          // Default 0, minimum 0
  include_count?: boolean;  // Include total count in response
}
```

**Response:** 200 OK
```typescript
{
  logs: IntentAuditLog[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
    totalCount?: number; // Only if include_count=true
  };
}
```

**IntentAuditLog Schema:**
```typescript
{
  id: string;
  organization_id: string;
  workflow_id: string | null;
  entity_type: 'workflow' | 'keyword' | 'article';
  entity_id: string;
  actor_id: string;
  action: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string; // ISO 8601 timestamp
}
```

**Supported Actions:**
- `workflow.created` - Workflow creation
- `workflow.archived` - Workflow archival
- `workflow.superseded` - Workflow superseded
- `workflow.step.completed` - Step completion
- `workflow.step.failed` - Step failure
- `workflow.step.blocked` - Step blocked
- `workflow.approval.approved` - Approval granted
- `workflow.approval.rejected` - Approval denied
- `keyword.subtopics.approved` - Subtopic approval
- `keyword.subtopics.rejected` - Subtopic rejection
- `article.queued` - Article queued for generation
- `article.generated` - Article generation completed
- `article.failed` - Article generation failed
- `system.error` - System error
- `system.retry_exhausted` - Retry attempts exhausted

**Business Logic:**
- Organization isolation: Users can only view their organization's audit logs
- Immutable records: Audit logs cannot be modified or deleted (WORM compliance)
- Non-blocking: Audit logging failures do not affect core functionality
- Comprehensive: All Intent Engine actions are logged with full context

**Error Responses:**
- 400 Bad Request: Invalid query parameters
- 401 Unauthorized: Authentication required
- 403 Forbidden: Owner access required
- 500 Internal Server Error: Database query failed

**Audit Logging:**
- `audit.queries.executed` - Logs each audit query for meta-auditing

## Rate Limiting

API endpoints implement rate limiting to prevent abuse. Specific limits vary by endpoint type.

## Security Features

- Row Level Security (RLS) on all database operations
- Multi-tenant data isolation via org_id
- OTP verification for registration
- Stripe webhook signature validation
- Input validation using Zod schemas

## Real-time Features

While API endpoints are synchronous, the application uses Supabase real-time subscriptions for:
- Article generation progress
- Dashboard updates
- Team collaboration features

## External API Integrations

- **OpenRouter**: AI content generation
- **Tavily**: Keyword research and analysis
- **DataForSEO**: SEO data services
- **Brevo**: Email notifications and OTP
- **Stripe**: Payment processing
- **WordPress**: Content publishing

## Testing

## Keyword Engine Endpoints

### POST /api/keywords/[keyword_id]/subtopics
Generate subtopic ideas for a longtail keyword using DataForSEO NLP.

**Authentication:** Required (valid user session with organization)

**Request Parameters:**
- `keyword_id` (path): UUID of the keyword to generate subtopics for

**Request Body:** None (uses keyword_id from path)

**Response:** 200 OK
```typescript
{
  success: true,
  data: {
    keyword_id: string,
    subtopics: Array<{
      title: string,
      keywords: string[]
    }>,
    subtopics_count: number
  }
}
```

**Error Responses:**
- 401 Unauthorized: Authentication required
- 400 Bad Request: Keyword ID missing or invalid
- 404 Not Found: Keyword not found
- 409 Conflict: Subtopics already generated for this keyword
- 503 Service Unavailable: DataForSEO API error

**Requirements:**
- Keyword must have `longtail_status = 'complete'`
- Keyword must have `subtopics_status != 'complete'`
- Generates exactly 3 subtopics per keyword
- Updates keyword record with subtopics and status

---

API endpoints are tested with:
- Unit tests (Vitest)
- Integration tests 
- Contract tests
- Error scenario validation

## Version Information

- API Version: 1.0
- Framework: Next.js 16.1.1
- Language: TypeScript 5
- Database: Supabase (PostgreSQL)
