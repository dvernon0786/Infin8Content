# API Contracts - Infin8Content

Generated: 2026-02-11 (v2 System Law - Canonical Implementation Complete)  
Framework: Next.js 16.1.1 API Routes  
Base URL: `/api`

## Overview

Infin8Content implements a comprehensive REST API using Next.js App Router with TypeScript, featuring multi-tenant architecture, authentication, payment processing, AI content generation, and a robust workflow state machine.

## System Status (2026-02-11)

🎯 **SYSTEM STATUS**

### **Current State: v2 SYSTEM LAW - COMPLETE WITH ROUTE GUARDS**
- **Onboarding System Law**: ✅ **v2 PRODUCTION READY** - All critical issues resolved, route protection implemented
- **Auth System**: ✅ **STABILIZED** - Database trigger errors resolved, audit logging fixed
- **Component Interfaces**: ✅ **FIXED** - All prop interfaces corrected (onNext vs onComplete)
- **Observe API**: ✅ **GET-ONLY** - All calls use GET method, auth-derived org, step derivation added
- **Build Status**: ✅ **PASSING** - All TypeScript compilation errors resolved
- **Route Protection**: ✅ **IMPLEMENTED** - Server-side onboarding guard and dashboard empty state
- **URL Normalization**: ✅ **IMPLEMENTED** - Auto-normalizes WordPress site URLs
- **Payment UX**: ✅ **CLEANED** - Removed debug components from payment success page
- **Complete Flow**: ✅ **IMPLEMENTED** - Onboarding → Dashboard → Workflow Creation
- **Branch**: `onboarding-system-law-complete`  

### **Critical Components**
- **Validator Authority**: `validateOnboarding()` is only decision maker
- **Single Writer**: `/api/onboarding/persist` is only data writer  
- **Read-Only Observer**: `/api/onboarding/observe` (GET-only, auth-derived, step derivation)
- **Canonical Redirect**: Observer-driven Step 5 → dashboard termination
- **Route Guard**: Server-side protection in `app/onboarding/layout.tsx`
- **Empty State**: Dashboard guidance with "Create First Workflow" CTA
- **URL Normalization**: `normalizeSiteUrl()` in StepIntegration component
- **Workflow Gate**: `requireOnboardingComplete()` backend enforcement
- **UI Authority**: ❌ **REMOVED** - No step derivation in frontend
- **Latest Commit**: `d902f55` - "feat: Implement onboarding route guard and dashboard empty state"

### **Production Readiness: 100%**
- **Safety**: ✅ Guaranteed (fail-closed on errors + invariant test)
- **Build**: ✅ All TypeScript errors resolved
- **Deployment**: ✅ Ready for production
- **System Law**: ✅ Mathematically enforced with irreversibility
- **Liveness**: ✅ Guaranteed (explicit success paths)
- **Idempotency**: ✅ Guaranteed (approval re-entry works)
- **Determinism**: ✅ Guaranteed (no optimistic transitions)
- **Multi-Instance Safety**: ✅ Guaranteed (database-backed concurrency)
- **LLM Output Hygiene**: ✅ Guaranteed (strict JSON extraction)
- **Regression Protection**: ✅ Guaranteed (automated invariant test)
**Canonical Workflow States**:
```typescript
step_0_auth (5%) → Authentication
step_1_icp (15%) → ICP Generation  
step_2_competitors (25%) → Competitor Analysis
step_3_keywords (35%) → Seed Keyword Extraction
step_4_longtails (45%) → Long-tail Expansion
step_5_filtering (55%) → Keyword Filtering
step_6_clustering (65%) → Topic Clustering
step_7_validation (75%) → Cluster Validation
step_8_subtopics (85%) → Subtopic Generation
step_9_articles (95%) → Article Generation
completed (100%) → Completed
failed (0%) → Failed
```

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

**Response:** 200 OK
```typescript
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string", 
    "email_confirmed_at": "string",
    "aud": "authenticated",
    "role": "authenticated"
  },
  "message": "Account created. Please check your email for the verification code."
}
```

**Status:** ✅ **WORKING** - Fully tested and operational

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

#### POST /api/articles/{article_id}/sections/{section_id}/write
Generates content for a specific article section using AI (Story B-3 implementation).

**Authentication:** Required (401 if not authenticated)  
**Authorization:** User must belong to the same organization as the article

**Request Body:** Empty (all data retrieved from database)

**Response:** 200 OK
```typescript
{
  success: true,
  data: {
    section_id: string,
    status: 'completed',
    markdown: string,
    html: string,
    word_count: number
  }
}
```

**Error Responses:**
- 400: Section must be researched before writing
- 401: Authentication required
- 404: Section not found
- 500: Content writing failed

**Features:**
- Fixed system prompt with integrity enforcement (SHA-256 hashing)
- 60-second timeout protection
- Exponential backoff retry (2s, 4s, 8s)
- Comprehensive audit logging
- Markdown to HTML conversion with XSS protection
- Organization isolation via RLS
- Prior sections context for coherence

#### Article Assembly Service (Story C-1)

**Service Overview**
The Article Assembly Service combines completed article sections into final markdown and HTML content with table of contents generation and metadata calculation.

**Core Function**
```typescript
interface AssemblyInput {
  articleId: string
  organizationId: string
}

interface AssemblyOutput {
  markdown: string
  html: string
  wordCount: number
  readingTimeMinutes: number
  tableOfContents: TOCEntry[]
}

class ArticleAssembler {
  async assemble(input: AssemblyInput): Promise<AssemblyOutput>
}

private countWords(markdown: string): number {
  // Extract only actual content words, not headers or TOC
  const contentLines = markdown.split('\n')
    .filter(line => !line.startsWith('#') && !line.startsWith('- [') && line.trim())
  
  const contentText = contentLines.join(' ')
  return contentText
    .replace(/[#*_>\-\n`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length
}

// Reading time: 200 words per minute, rounded up
const readingTimeMinutes = Math.ceil(wordCount / 200)
```

**Assembly Process**
1. Load article with status 'generating'
2. Load all completed sections in order
3. Generate table of contents with anchors
4. Assemble markdown with H2 headers
5. Assemble HTML with proper structure
6. Calculate word count (content only, no headers)
7. Calculate reading time (200 words/minute, rounded up)
8. Persist final content to articles table
9. Update article status to 'completed'

**Business Rules**
- Sections ordered by `section_order` ASC
- H2 headers only for section titles
- TOC generated from section titles with slugified anchors
- Word count excludes headers and TOC
- Reading time calculated as `Math.ceil(words / 200)`
- Idempotent: re-running overwrites previous content
- Graceful handling of missing/empty sections

**Error Handling**
- Missing article: "Article not found or access denied"
- No completed sections: "No completed sections found"
- Database errors: proper error propagation
- Retry with exponential backoff (2s, 4s, 8s)

**Analytics Events**
- `article.assembly.started` - when assembly begins
- `article.assembly.completed` - when assembly finishes

**Performance**
- Assembly time < 5 seconds
- Supports up to 10 sections per article
- Single atomic database write for final content

**Security**
- Organization isolation via RLS
- Service role client for admin operations
- No intermediate analytics events
- Backend-only execution

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

#### Onboarding Validation Gate (Story A-6)
Intent workflow creation is protected by an onboarding completion validation gate. This ensures that all required onboarding steps are completed before any Intent Engine workflows can be created.

**Gate Behavior:**
- **403 Forbidden:** Returned when onboarding is incomplete with detailed error list
- **200 Allowed:** Gate passes, workflow creation proceeds
- **Authoritative:** Server-side validation (cannot be bypassed by client)

**Validated Requirements:**
- `onboarding_completed = true`
- `website_url` is not null and valid URL
- `business_description` is not null and > 10 characters
- `target_audiences` array is not empty
- `competitors` table has 3-7 entries for the organization
- `content_defaults` JSONB is not empty
- `keyword_settings` JSONB is not empty

**Error Response Format:**
```json
{
  "error": "ONBOARDING_INCOMPLETE",
  "details": [
    "WEBSITE_URL_MISSING",
    "COMPETITORS_INVALID_COUNT"
  ]
}
```

**Protected Endpoints:**
- POST /api/intent/workflows

**Audit Logging:**
All validation attempts are logged with:
- `onboarding.validation.succeeded` - when validation passes
- `onboarding.validation.failed` - when validation fails
- Full context including organization ID, missing requirements, and error details

#### ICP Gate Enforcement (Story 39-1)
All downstream Intent Engine workflow endpoints are protected by an ICP (Ideal Customer Profile) completion gate. This ensures that ICP generation is completed before any subsequent workflow steps can be executed.

**Gate Behavior:**
- **423 Blocked:** Returned when ICP is not complete (`step_1_icp` or earlier)
- **200 Allowed:** Gate passes, request proceeds to endpoint logic
- **Fail-open:** Database errors allow request to proceed (availability priority)

**Protected Endpoints:**
- POST /api/intent/workflows/{workflow_id}/steps/competitor-analyze
- POST /api/intent/workflows/{workflow_id}/steps/seed-extract
- POST /api/intent/workflows/{workflow_id}/steps/longtail-expand  
- POST /api/intent/workflows/{workflow_id}/steps/filter-keywords
- POST /api/intent/workflows/{workflow_id}/steps/cluster-topics
- POST /api/intent/workflows/{workflow_id}/steps/validate-clusters
- POST /api/keywords/{keyword_id}/subtopics
- POST /api/keywords/{keyword_id}/approve-subtopics
- POST /api/intent/workflows/{workflow_id}/steps/queue-articles

**Audit Logging:**
All gate enforcement attempts are logged with:
- `workflow.gate.icp.allowed` - when access is granted
- `workflow.gate.icp.blocked` - when access is denied
- Full context including workflow status, step attempted, and error details

#### Competitor Gate Enforcement (Story 39-2)
Seed keyword extraction and downstream steps are protected by a competitor analysis completion gate. This ensures that competitor analysis is completed before seed keyword extraction can begin.

**Gate Behavior:**
- **423 Blocked:** Returned when competitor analysis is not complete (`step_2_icp_complete` or earlier)
- **200 Allowed:** Gate passes, request proceeds to endpoint logic
- **Fail-open:** Database errors allow request to proceed (availability priority)

**Protected Endpoints:**
- POST /api/intent/workflows/{workflow_id}/steps/seed-extract

**Error Response Format:**
```json
{
  "error": "Competitor analysis required before seed keywords",
  "workflowStatus": "step_2_icp_complete",
  "competitorStatus": "not_complete",
  "requiredAction": "Complete competitor analysis (step 2) before proceeding",
  "currentStep": "step_2_icp_complete",
  "blockedAt": "2026-02-03T10:13:00.000Z"
}
```

**Audit Logging:**
All gate enforcement attempts are logged with:
- `workflow.gate.competitors_allowed` - when access is granted
- `workflow.gate.competitors_blocked` - when access is denied
- `workflow.gate.competitors_error` - when validation encounters errors

#### POST /api/intent/workflows/{workflow_id}/steps/seed-extract
Transitions workflow from competitor analysis completion to seed keyword readiness (Story 39.2). This endpoint represents the seed keyword extraction step that requires competitor analysis to be complete.

**Authentication:** Required (401 if not authenticated)  
**Authorization:** User must belong to workflow organization (404 if not)
**Gate Enforcement:** Protected by both ICP and Competitor gates (423 if blocked)

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
    step_3_seeds_completed_at: string; // ISO 8601 timestamp
    previous_status: 'step_2_competitors';
    new_status: 'step_3_seeds';
  }
}
```

**Workflow State Requirements:**
- Workflow must be in `step_2_competitors` status
- Seed keywords must exist (generated by competitor analysis)
- Both ICP and Competitor gates must pass

**Gate Enforcement:**
- ICP Gate: Must have completed ICP generation (`step_2_icp_complete` or later)
- Competitor Gate: Must have completed competitor analysis (`step_3_competitors` or later)

**Error Responses:**
- 400 Bad Request: Invalid workflow state or no seed keywords found
- 401 Unauthorized: Authentication required
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Workflow not found or belongs to different organization
- 423 Locked: Gate enforcement blocked (ICP or Competitor gate)
- 500 Internal Server Error: Database update failed

**Database Updates:**
- Updates workflow status from `step_2_competitors` to `step_3_seeds`
- Verifies existence of seed keywords before transition
- Logs audit trail for state transition

**Audit Events:**
- `workflow.seed_keywords.approved` - on successful transition
- Full context including workflow ID, status changes, and user actions

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

## Research Agent Service (Story B-2)

### Service Overview
The Research Agent Service provides deterministic research capabilities for article sections using Perplexity Sonar API with a fixed, immutable system prompt.

### Core Function
```typescript
export async function runResearchAgent(
  input: ResearchAgentInput
): Promise<ResearchAgentOutput>
```

### Input Interface
```typescript
interface ResearchAgentInput {
  sectionHeader: string;
  sectionType: string;
  priorSections: ArticleSection[];
  organizationContext: {
    name: string;
    description: string;
    website?: string;
    industry?: string;
  };
}
```

### Output Interface
```typescript
interface ResearchAgentOutput {
  queries: string[];
  results: {
    query: string;
    answer: string;
    citations: string[];
  }[];
  totalSearches: number;
}
```

### Key Features
- **Fixed System Prompt**: Locked, immutable prompt using expert Research Analyst persona
- **Perplexity Sonar Integration**: Uses `perplexity/llama-3.1-sonar-small-128k-online` model
- **Search Limits**: Hard maximum of 10 searches per section
- **Timeout Enforcement**: 30-second absolute timeout via Promise.race()
- **Retry Logic**: 3 attempts with exponential backoff (2s, 4s, 8s)
- **JSON Output**: Structured research results with citations

### Usage Pattern
```typescript
import { runResearchAgent } from '@/lib/services/article-generation/research-agent';

const researchResults = await runResearchAgent({
  sectionHeader: 'Introduction to AI',
  sectionType: 'introduction',
  priorSections: completedSections,
  organizationContext: orgContext
});
```

### Error Handling
- **Timeout**: Rejects with "Research timeout: 30 seconds exceeded"
- **Non-retryable**: 401/403 errors propagate immediately
- **Retryable**: 429/5xx errors trigger exponential backoff
- **JSON Parsing**: Malformed responses throw "Invalid JSON response from research service"

### Performance Characteristics
- **Typical Response**: 2-8 seconds for simple queries
- **Maximum Timeout**: 30 seconds enforced
- **Search Limit**: 10 searches maximum (hard enforced)
- **Retry Pattern**: 2s → 4s → 8s backoff

### Security Notes
- Server-only execution (browser context blocked)
- Organization isolation via RLS
- No prompt modification possible (locked in code)
- Structured error reporting without sensitive data exposure

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

## Intent Engine Workflow Gates

### Seed Approval Gate (Story 39-3)

**Endpoint:** POST /api/intent/workflows/{workflow_id}/steps/longtail-expand  
**Gate Enforcement:** Seed Approval Gate

**Purpose:** Enforces that seed keywords must be approved before long-tail expansion.

**Gate Validation:**
- Checks if workflow is at `step_3_seeds` status
- Verifies seed keywords have been approved via `intent_approvals` table
- Returns 423 Blocked if approval not found
- Fails open on database errors for availability

**Request Parameters:**
- `workflow_id` (path): UUID of the workflow

**Response on Gate Pass:** 200 OK (continues to longtail expansion)

**Response on Gate Block:** 423 Locked
```typescript
{
  error: "Seed keywords must be approved before longtail expansion",
  workflowStatus: "step_3_seeds",
  seedApprovalStatus: "not_approved",
  requiredAction: "Approve seed keywords via POST /api/intent/workflows/{workflow_id}/steps/approve-seeds",
  currentStep: "longtail-expand",
  blockedAt: "2026-02-03T10:48:00.000Z"
}
```

**Audit Logging:**
- `workflow.gate.seeds_allowed`: When gate passes
- `workflow.gate.seeds_blocked`: When access denied due to missing approval
- `workflow.gate.seeds_error`: When gate enforcement encounters errors

**Error Scenarios:**
- 423 Locked: Seed keywords not approved
- 423 Locked: Seed keywords not yet extracted (workflow before step_3_seeds)
- 404 Not Found: Workflow not found
- 401 Unauthorized: Authentication required

**Implementation Pattern:**
```typescript
// In API endpoint
const seedGateResponse = await enforceSeedApprovalGate(workflowId, 'longtail-expand')
if (seedGateResponse) {
  return seedGateResponse
}
// Continue with step logic if gate passes
```

---

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

### Intent Workflow Blocking Conditions Endpoints

#### GET /api/intent/workflows/{workflow_id}/blocking-conditions
Retrieves blocking condition for a workflow if it is blocked at a gate (Story 39-7).

**Authentication:** Required (401 if not authenticated)  
**Organization Isolation:** RLS enforced via organization_id

**Path Parameters:**
```typescript
{
  workflow_id: string; // UUID format
}
```

**Response:** 200 OK
```typescript
{
  workflow_id: string;
  blocking_condition: {
    blocked_at_step: string; // e.g., 'step_0_auth'
    blocking_gate: string; // e.g., 'gate_icp_required'
    blocking_reason: string; // Human-readable explanation
    required_action: string; // What needs to be done
    action_link: string; // Direct link to required action
    blocked_since: string; // ISO 8601 timestamp
  } | null;
  queried_at: string; // ISO 8601 timestamp
}
```

**Error Responses:**
- 400 Bad Request: Invalid workflow_id format
```typescript
{
  error: "Invalid workflow_id format"
}
```
- 401 Unauthorized: Authentication required
- 500 Internal Server Error: Service error

**Features:**
- Returns null if workflow is not blocked
- Provides clear, actionable blocking messages
- Includes direct links to unblock actions
- Logs all queries for audit trail
- Supports organization isolation via RLS

**Blocking Conditions Map:**
| Step | Gate | Reason | Action |
|------|------|--------|--------|
| step_0_auth | gate_icp_required | ICP generation required | Generate ICP document |
| step_1_icp | gate_competitors_required | Competitor analysis required | Analyze competitors |
| step_3_seeds | gate_seeds_approval_required | Seed keywords must be approved | Review and approve seeds |
| step_4_longtails | gate_filtering_required | Keyword filtering required | Filter keywords |
| step_5_filtering | gate_clustering_required | Clustering required | Cluster keywords |
| step_6_clustering | gate_validation_required | Cluster validation required | Validate clusters |
| step_7_validation | gate_subtopic_generation_required | Subtopic generation required | Generate subtopics |
| step_8_subtopics | gate_subtopic_approval_required | Subtopics must be approved | Review and approve subtopics |

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
