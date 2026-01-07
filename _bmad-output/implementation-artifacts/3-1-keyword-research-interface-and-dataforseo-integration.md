# Story 3.1: Keyword Research Interface and DataForSEO Integration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to research keywords with search volume, difficulty, and trend data,
So that I can identify content opportunities and prioritize keywords for my content strategy.

## Acceptance Criteria

### 1. Keyword Research Interface
**Given** I am on the Keyword Research page (`/dashboard/research/keywords`)
**When** I enter a seed keyword (e.g., "best running shoes")
**Then** I can click "Research" or press Enter
**And** the system calls DataForSEO Keywords Data API
**And** I see a loading state with progress indicator
**And** within 60 seconds, I see keyword research results with:
  - Keyword (the search term)
  - Search Volume (monthly searches, e.g., "12,000")
  - Keyword Difficulty (0-100 score, e.g., "45")
  - Trend Data (30-day trend chart/sparkline)
  - CPC (Cost Per Click, if available)
  - Competition Level (Low/Medium/High)
**And** results are displayed in a sortable table
**And** I can see the API cost for this research (tracked for usage limits)

### 2. Input Validation
**Given** I enter an invalid or empty keyword
**When** I try to research
**Then** I see a validation error: "Please enter a keyword to research"
**And** the research does not proceed

### 3. Error Handling
**Given** DataForSEO API returns an error
**When** the research fails
**Then** I see a clear error message: "Keyword research failed. Please try again."
**And** I see a "Retry" button
**And** clicking "Retry" attempts the research again
**And** the error is logged for monitoring

### 4. Usage Limit Enforcement
**Given** I have reached my keyword research limit for the month
**When** I try to research a keyword
**Then** I see a message: "You've reached your keyword research limit for this month"
**And** I see my current usage and plan limits
**And** I see an "Upgrade Plan" button
**And** the research does not proceed

## Tasks / Subtasks

- [x] 1. Create DataForSEO Service Client
  - [x] Create `lib/services/dataforseo.ts` following Brevo service pattern
  - [x] Implement singleton client with API key from environment variables
  - [x] Add TypeScript interfaces for API request/response types
  - [x] Implement retry logic (3 attempts, exponential backoff)
  - [x] Add error handling and logging

- [x] 2. Create Database Schema for Keyword Research
  - [x] Create migration: `supabase/migrations/20260107230541_add_keyword_research_tables.sql`
  - [x] Create `keyword_researches` table:
    - `id` (uuid, primary key)
    - `organization_id` (uuid, foreign key to organizations)
    - `user_id` (uuid, foreign key to users)
    - `keyword` (text, not null)
    - `results` (jsonb, stores API response)
    - `api_cost` (decimal, cost of API call)
    - `cached_until` (timestamp, 7 days from creation)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)
  - [x] Add indexes: `organization_id`, `keyword`, `cached_until`
  - [x] Add RLS policies following Story 1.11 pattern:
    - Policy "Users can view their org's research": `SELECT USING (organization_id = public.get_auth_user_org_id())`
    - Policy "Users can insert research": `INSERT WITH CHECK (organization_id = public.get_auth_user_org_id())`
    - Reference: `supabase/migrations/20260105180000_enable_rls_and_fix_security.sql`

- [x] 3. Implement API Route for Keyword Research
  - [x] Create `app/api/research/keywords/route.ts`
  - [x] Use `getCurrentUser()` helper from `lib/supabase/get-current-user.ts` to get authenticated user and organization context
  - [x] Create Zod schema for request body validation: `keyword: z.string().min(1).max(200)`
  - [x] Check usage limits before API call:
    - Query `usage_tracking` table: `SELECT usage_count FROM usage_tracking WHERE organization_id = ? AND metric_type = 'keyword_research' AND billing_period = current_month`
    - Get plan limits from `organizations.plan` (Starter: 50, Pro: 200, Agency: unlimited)
    - Block if `usage_count >= limit`, return 403 with usage details
  - [x] Check cache for existing research (7-day TTL)
  - [x] Call DataForSEO API if cache miss
  - [x] Store results in database with cache expiration
  - [x] Track API cost in `api_costs` table (Epic 10.7)
  - [x] Increment usage tracking (Epic 10.1)
  - [x] Return results to client with TypeScript response types
  - [x] Handle errors with retry logic

- [x] 4. Create Keyword Research Page UI
  - [x] Create `app/dashboard/research/keywords/page.tsx` (Server Component)
  - [x] Create `components/research/keyword-research-form.tsx` (Client Component)
  - [x] Create `components/research/keyword-results-table.tsx` (Client Component)
  - [x] Implement loading states with skeleton UI
  - [x] Implement error states with retry button
  - [x] Implement usage limit warning UI
  - [x] Add sortable table columns (Search Volume, Difficulty, Trend, CPC, Competition)

- [x] 5. Implement Usage Tracking Integration
  - [x] After successful research, increment `keyword_research` count in `usage_tracking` table (Epic 10.1)
  - [x] Track API cost in `api_costs` table with service='dataforseo', operation='keyword_research' (Epic 10.7)
  - [x] Display current usage and limits in UI from `usage_tracking` and `organizations.plan`

- [x] 6. Add Caching Logic
  - [x] Check `keyword_researches` table for cached results
  - [x] Use cached results if `cached_until > now()`
  - [x] Return cached results without API call
  - [x] Update `updated_at` timestamp on cache hit

- [x] 7. Testing
  - [x] Unit tests for DataForSEO service client (vitest, `tests/services/dataforseo.test.ts`)
  - [x] Integration tests for API route (vitest, `tests/integration/keyword-research.test.ts`)
  - [x] Component tests for UI components (vitest + React Testing Library, `tests/components/keyword-research-form.test.tsx`)
  - [x] E2E tests for full research flow (playwright, `tests/e2e/keyword-research-flow.test.ts`)
  - [x] Test error handling and retry logic
  - [x] Test usage limit enforcement
  - [x] Test caching behavior

## Dev Notes

### Epic 3 Context

**Epic 3: Content Research & Discovery**
- **User Outcome:** Users can research keywords, analyze SERP data, and discover content opportunities with real-time research and citations.
- **FRs covered:** FR13-FR20
- **Key Capabilities:**
  - Keyword research with search volume, difficulty, and trend data (Story 3.1 - THIS STORY)
  - Filter and organize keyword research results (Story 3.2)
  - Keyword clustering (pillar content + supporting articles) (Story 3.3)
  - Real-time web research with citations (Tavily integration) (Story 3.4)
  - SERP analysis for competitor intelligence (Story 3.5)
  - Keyword research history and saved lists (Story 3.6)
  - Related keyword suggestions (Story 3.7)
  - Batch keyword research operations (Story 3.8)
- **Dependencies:** Epic 1 (requires authentication, organization context, payment status)
- **Success Metrics:**
  - < 60 seconds keyword research completion (NFR-P1 breakdown)
  - 80%+ articles include 3+ citations (NFR-DQ2)

**Story 3.1 Role in Epic:**
- Foundation story for Epic 3 - enables all other keyword research features
- Provides core keyword data that Stories 3.2-3.8 build upon
- Establishes DataForSEO integration pattern for future stories (3.5 SERP analysis)
- Sets caching and usage tracking patterns for Epic 3

### Previous Story Intelligence

**From Story 1.2 (Supabase Setup):**
- `organizations` table exists with schema: `id`, `name`, `plan`, `white_label_settings`, `created_at`, `updated_at`
- `users` table exists with schema: `id`, `email`, `first_name`, `org_id` (nullable), `role`, `auth_user_id`, `created_at`
- Foreign key constraint: `users.org_id` → `organizations.id` (CASCADE delete)
- Indexes: `idx_users_org_id`, `idx_users_email`, `idx_organizations_id`
- Supabase client files: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/middleware.ts`
- Environment validation: `lib/supabase/env.ts` with `validateSupabaseEnv()` function

**From Story 1.3 (Registration):**
- Users are created with `org_id = null` (migration made `org_id` nullable)
- Users are created with `role = 'owner'` (default role)
- Registration API route: `app/api/auth/register/route.ts`
- Form patterns: Real-time validation on blur, clear error messages, accessibility requirements

**From Story 1.4 (Login):**
- Login API route: `app/api/auth/login/route.ts`
- Login redirects to `/create-organization` if `org_id` is null
- User context helper: `lib/supabase/get-current-user.ts` (loads user with organization data)
- Session management via Supabase Auth cookies

**From Story 1.6 (Organization Creation):**
- Organization creation API: `app/api/organizations/create/route.ts`
- Pattern: Zod validation, Supabase server client, structured error responses
- Error handling: Generic messages for security, specific messages for validation
- Transaction pattern: Rollback organization creation if user update fails

**From Story 1.7 (Stripe Payment):**
- Payment status stored in `organizations.payment_status` field
- Payment status values: `pending_payment`, `active`, `suspended`, `cancelled`
- Middleware checks payment status before allowing dashboard access
- Plan values: `starter`, `pro`, `agency`

**From Story 1.8 (Paywall):**
- Middleware enforces payment-first access model
- Dashboard routes (`/dashboard/*`) require `payment_status = 'active'`
- Redirect to payment page if payment pending

**From Story 1.11 (RLS Policies):**
- RLS enabled on all tables with multi-tenant data
- Helper function: `public.get_auth_user_org_id()` returns current user's organization ID
- Policy pattern: `SELECT USING (organization_id = public.get_auth_user_org_id())`
- Policy pattern: `INSERT WITH CHECK (organization_id = public.get_auth_user_org_id())`
- Reference migration: `supabase/migrations/20260105180000_enable_rls_and_fix_security.sql`

**From Story 1.12 (Dashboard Access):**
- Dashboard page: `app/dashboard/page.tsx` (Server Component)
- Uses `getCurrentUser()` helper for authentication
- Protected by middleware (payment status check)
- Pattern: Server Component for data loading, Client Components for interactivity

**Key Learnings to Apply:**
1. **Service Client Pattern:** Follow `lib/services/brevo.ts` exactly:
   - Singleton instance with lazy initialization
   - Environment variable validation on startup (throw error if missing)
   - TypeScript interfaces for all API types
   - Error handling with retry logic
   - Logging for debugging

2. **API Route Pattern:** Follow `app/api/organizations/create/route.ts` exactly:
   - `validateSupabaseEnv()` at start
   - `getCurrentUser()` helper for auth (NOT `supabase.auth.getUser()` directly)
   - Zod schema validation for request body
   - Structured error responses: `{ error: string, details?: any }`
   - HTTP status codes: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 500 (server error)
   - Transaction pattern for multi-step operations

3. **Database Patterns:**
   - Use Supabase client for all database operations
   - Always check for errors and handle gracefully
   - Use transactions where needed (rollback on failure)
   - Foreign key relationships: `keyword_researches.organization_id` → `organizations.id` (CASCADE delete)
   - Foreign key relationships: `keyword_researches.user_id` → `users.id` (CASCADE delete)
   - RLS policies MUST be added for multi-tenant isolation

4. **Authentication Patterns:**
   - Use `getCurrentUser()` helper in Server Components and API routes
   - Check authentication in API routes before processing
   - Middleware handles session refresh and route protection automatically
   - Organization context available via `getCurrentUser().organizations`

5. **Testing Patterns:**
   - Vitest with React Testing Library (configured in Story 1.4)
   - Unit tests for service clients
   - Integration tests for API routes
   - Component tests for UI components
   - E2E tests with Playwright

**Files Created in Previous Stories:**
- `app/(auth)/register/page.tsx` - Reference for form styling
- `app/(auth)/login/page.tsx` - Reference for form styling
- `app/dashboard/page.tsx` - Reference for dashboard page structure
- `lib/services/brevo.ts` - Reference for service client pattern
- `lib/supabase/get-current-user.ts` - Reference for authentication helper
- `app/api/organizations/create/route.ts` - Reference for API route pattern

### Architecture Patterns

**Service Layer Pattern:**
- Follow `lib/services/brevo.ts` pattern EXACTLY for DataForSEO client
- Singleton instance with lazy initialization (`let dataforseoApiInstance: DataForSEOApi | null = null`)
- Environment variable validation on startup (throw error if `DATAFORSEO_LOGIN` or `DATAFORSEO_PASSWORD` missing)
- TypeScript interfaces for all API request/response types
- Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
- Error handling: Log errors, throw user-friendly messages
- Basic Auth: Use `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` for HTTP Basic Auth

**API Route Pattern:**
- Server-side route handler in `app/api/research/keywords/route.ts`
- Use `getCurrentUser()` helper for authentication and organization context (see `lib/supabase/get-current-user.ts`)
- Route protected by middleware (handles `/dashboard/*` routes automatically)
- Zod validation for request body (matching `app/api/organizations/create/route.ts` pattern)
- TypeScript response interfaces matching existing API patterns
- Error responses: `{ error: string, details?: { code?: string, usageLimitExceeded?: boolean, currentUsage?: number, limit?: number } }`
- Success responses: `{ success: true, data: {...} }`

**Database Pattern:**
- Supabase PostgreSQL with migrations
- RLS policies for multi-tenant data isolation (MUST follow Story 1.11 pattern)
- JSONB for flexible API response storage (stores full DataForSEO API response)
- Timestamps for cache expiration (`cached_until` field)
- Indexes: `organization_id`, `keyword` (for cache lookups), `cached_until` (for cache cleanup)
- Foreign keys: `organization_id` → `organizations.id` (CASCADE), `user_id` → `users.id` (CASCADE)

**Caching Strategy:**
- 7-day cache TTL (NFR caching strategy from epics)
- Database-backed cache (not in-memory) for multi-tenant isolation
- Cache key: `organization_id + keyword` (case-insensitive comparison)
- Cache invalidation: automatic via `cached_until` timestamp
- Cache lookup: Query `keyword_researches` table WHERE `organization_id = ? AND LOWER(keyword) = LOWER(?) AND cached_until > NOW()`
- Cache update: Update `updated_at` timestamp on cache hit (for analytics)

### Technical Requirements

**DataForSEO API Integration:**
- **Endpoint:** `https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live`
- **Method:** POST
- **Auth:** HTTP Basic Auth using `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` environment variables
- **Request Format:**
  ```json
  [{
    "keywords": ["best running shoes"],
    "location_code": 2840,  // United States
    "language_code": "en",
    "date_from": "2024-01-01",  // Optional: for trend data
    "date_to": "2024-12-31"     // Optional: for trend data
  }]
  ```
- **Response Format:**
  ```json
  {
    "version": "0.1.20240115",
    "status_code": 20000,
    "status_message": "Ok.",
    "time": "0.1234 sec.",
    "cost": 0.001,
    "result_count": 1,
    "tasks": [{
      "id": "...",
      "status_code": 20000,
      "status_message": "Ok.",
      "time": "0.1234 sec.",
      "cost": 0.001,
      "result_count": 1,
      "path": ["v3", "keywords_data", "google_ads", "search_volume", "live"],
      "data": {
        "api": "keywords_data",
        "function": "google_ads",
        "se": "google",
        "keywords": ["best running shoes"],
        "location_code": 2840,
        "language_code": "en"
      },
      "result": [{
        "keyword": "best running shoes",
        "location_code": 2840,
        "language_code": "en",
        "search_volume": 12000,
        "competition": 0.75,
        "competition_index": 75,
        "cpc": 2.5,
        "monthly_searches": [
          {"year": 2024, "month": 1, "search_volume": 11000},
          {"year": 2024, "month": 2, "search_volume": 12000},
          // ... 12 months of data
        ],
        "keyword_info": {
          "se_type": "google",
          "last_updated_time": "2024-01-15 10:00:00 +00:00",
          "competition": "HIGH",
          "cpc": 2.5,
          "search_volume": 12000,
          "categories": [1234, 5678],
          "monthly_searches": [...]
        }
      }]
    }]
  }
  ```
- **Cost:** ~$0.01-0.1 per research (varies by depth and number of keywords)
- **Retry Logic:** 3 attempts with exponential backoff (1s, 2s, 4s)
- **Rate Limits:** Handle 429 responses gracefully (retry after `Retry-After` header)
- **Error Codes:**
  - `40000`: Bad request (invalid parameters)
  - `40100`: Unauthorized (invalid credentials)
  - `40200`: Payment required (insufficient balance)
  - `42900`: Rate limit exceeded (too many requests)
  - `50000`: Internal server error
- **Note:** Verify latest DataForSEO API v3 documentation before implementation: https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/live

**Usage Tracking:**
- **Table:** `usage_tracking` (Epic 10.1 - may not exist yet, create if needed)
- **Schema:** `organization_id`, `metric_type` ('keyword_research'), `usage_count`, `billing_period` (YYYY-MM format)
- **Check Before API Call:**
  ```sql
  SELECT usage_count 
  FROM usage_tracking 
  WHERE organization_id = $1 
    AND metric_type = 'keyword_research' 
    AND billing_period = TO_CHAR(NOW(), 'YYYY-MM')
  ```
- **Plan Limits:**
  - Starter: 50 keyword researches per month
  - Pro: 200 keyword researches per month
  - Agency: unlimited (NULL limit)
- **Increment After Success:** Atomic increment using `INSERT ... ON CONFLICT UPDATE` or transaction
- **API Cost Tracking:** Track in `api_costs` table (Epic 10.7 - may not exist yet, create if needed)
  - Schema: `organization_id`, `service` ('dataforseo'), `operation` ('keyword_research'), `cost` (decimal), `created_at`
  - Store cost from DataForSEO API response (`cost` field)

**Performance Requirements:**
- **API call completion:** < 60 seconds (NFR-P1 breakdown from Epic 3)
- **Cache hit response:** < 500ms (database query + JSON parsing)
- **Page load:** < 2 seconds (NFR-P2)
- **Loading state:** Show skeleton UI immediately, update with results when ready
- **Error recovery:** Retry button should retry immediately (no delay)

### File Structure

**New Files:**
- `lib/services/dataforseo.ts` - DataForSEO API client
- `app/api/research/keywords/route.ts` - Keyword research API endpoint
- `app/dashboard/research/keywords/page.tsx` - Keyword research page
- `components/research/keyword-research-form.tsx` - Research input form
- `components/research/keyword-results-table.tsx` - Results display table
- `supabase/migrations/YYYYMMDDHHMMSS_add_keyword_research_tables.sql` - Database schema
- `tests/services/dataforseo.test.ts` - Service unit tests
- `tests/integration/keyword-research.test.ts` - Integration tests
- `tests/e2e/keyword-research-flow.test.ts` - E2E tests

**Modified Files:**
- `lib/services/usage-tracker.ts` (if exists) - Add keyword research tracking
- `lib/services/api-cost-tracker.ts` (if exists) - Add DataForSEO cost tracking

### Project Structure Notes

- Follows Next.js App Router conventions (`app/` directory)
- Service layer in `lib/services/` (matches Brevo pattern)
- Components in `components/research/` (new directory)
- Database migrations in `supabase/migrations/`
- Tests mirror source structure

### API Response Types

```typescript
interface KeywordResearchSuccessResponse {
  success: true
  data: {
    keyword: string
    results: KeywordResult[]
    apiCost: number
    cached: boolean
    usage: {
      current: number
      limit: number | null
    }
  }
}

interface KeywordResearchErrorResponse {
  error: string
  details?: {
    code: string
    usageLimitExceeded?: boolean
    currentUsage?: number
    limit?: number
  }
}

interface KeywordResult {
  keyword: string
  searchVolume: number
  keywordDifficulty: number
  trend: number[]
  cpc?: number
  competition: 'Low' | 'Medium' | 'High'
}
```

### References

**Epic and Story Documentation:**
- [Source: _bmad-output/epics.md#Epic-3] - Epic 3 overview and context
- [Source: _bmad-output/epics.md#Story-3.1] - Story requirements and acceptance criteria
- [Source: _bmad-output/epics.md#Epic-10.1] - Usage tracking requirements
- [Source: _bmad-output/epics.md#Epic-10.7] - API cost tracking requirements

**Architecture and Design:**
- [Source: _bmad-output/architecture.md] - System architecture and patterns
- [Source: _bmad-output/prd.md#Integrations] - DataForSEO integration details
- [Source: _bmad-output/prd.md#Phase-1] - MVP scope and priorities

**Code Patterns and References:**
- [Source: infin8content/lib/services/brevo.ts] - Service client pattern reference (singleton, env validation, error handling)
- [Source: infin8content/lib/supabase/get-current-user.ts] - Authentication helper pattern (use this, NOT direct auth calls)
- [Source: infin8content/app/api/organizations/create/route.ts] - API route pattern with Zod validation, error handling, transaction pattern
- [Source: infin8content/app/dashboard/page.tsx] - Dashboard page structure (Story 1.12) - Server Component pattern
- [Source: infin8content/supabase/migrations/20260105180000_enable_rls_and_fix_security.sql] - RLS policy patterns (Story 1.11) - MUST follow this pattern
- [Source: infin8content/lib/supabase/env.ts] - Environment validation pattern (`validateSupabaseEnv()`)

**Previous Story Files (Pattern References):**
- [Source: infin8content/app/(auth)/register/page.tsx] - Form styling and validation patterns
- [Source: infin8content/app/(auth)/login/page.tsx] - Form styling and validation patterns
- [Source: infin8content/app/middleware.ts] - Route protection and payment status checks

**External Documentation:**
- DataForSEO API v3 Documentation: https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/live
- DataForSEO Authentication: https://docs.dataforseo.com/#section/Authentication
- DataForSEO Error Codes: https://docs.dataforseo.com/#section/Errors

**Environment Variables:**
```bash
# DataForSEO API Credentials (REQUIRED)
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**DataForSEO API Details:**
- **Base URL:** `https://api.dataforseo.com`
- **Request:** `POST /v3/keywords_data/google_ads/search_volume/live`
- **Request Body:** `[{keywords: [string], location_code: number, language_code: string}]`
- **Response Fields:**
  - `keyword`: The search term
  - `search_volume`: Monthly search volume (number)
  - `competition`: Competition level (0.0-1.0, where 1.0 = highest)
  - `competition_index`: Competition index (0-100)
  - `cpc`: Cost per click (decimal, USD)
  - `monthly_searches[]`: Array of monthly search volume data (12 months)
  - `keyword_info`: Additional keyword metadata
- **Error Codes:**
  - `40000`: Bad request (invalid parameters)
  - `40100`: Unauthorized (invalid credentials)
  - `40200`: Payment required (insufficient balance)
  - `42900`: Rate limit exceeded (too many requests)
  - `50000`: Internal server error

### Git Intelligence Summary

**Recent Commit Patterns (Last 10 Commits):**
- Story 1.11 completion - RLS policies implementation
- Story 1.12 completion - Dashboard access after payment
- Story 1.13 completion - Audit logging for compliance
- Epic 1 retrospective completion
- MVP prioritization - P0/P1 story classification

**Key Implementation Patterns from Recent Work:**
1. **API Route Structure:** All API routes follow consistent pattern:
   - Environment validation using `validateSupabaseEnv()` from `lib/supabase/env.ts`
   - Zod schema validation for request bodies
   - Supabase server client from `lib/supabase/server.ts`
   - Structured error responses: `{ error: string, details?: any }`
   - HTTP status codes: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 500 (server error)

2. **Service Client Patterns:**
   - Singleton pattern with lazy initialization
   - Environment variable validation on first access
   - TypeScript interfaces for all API types
   - Error handling with retry logic
   - Logging for debugging

3. **Database Migration Patterns:**
   - Timestamped migrations: `YYYYMMDDHHMMSS_description.sql`
   - RLS policies follow Story 1.11 pattern
   - Foreign keys with CASCADE delete
   - Indexes for performance (organization_id, common query fields)

4. **Component Patterns:**
   - Server Components for data loading (`app/dashboard/*/page.tsx`)
   - Client Components for interactivity (`components/*/*.tsx`)
   - Form validation on blur (not on every keystroke)
   - Loading states with skeleton UI
   - Error states with retry buttons

### Latest Technical Information

**DataForSEO API v3 (2025):**
- Latest stable version: v3 (as of 2025)
- Authentication: HTTP Basic Auth (login + password)
- Rate limits: Varies by plan, handle 429 responses with exponential backoff
- Cost structure: Pay-per-use, ~$0.01-0.1 per keyword research
- Response time: Typically 5-30 seconds, can take up to 60 seconds for complex queries
- Best practices:
  - Cache results for 7 days (keyword data changes slowly)
  - Batch multiple keywords in single request when possible (future optimization)
  - Handle rate limits gracefully (429 responses)
  - Monitor API costs per organization

**Next.js 16.1.1 Patterns:**
- App Router conventions: `app/` directory structure
- Server Components: Default for data loading
- Client Components: Use `'use client'` directive for interactivity
- API Routes: `app/api/**/route.ts` pattern
- Middleware: `app/middleware.ts` for route protection

**Supabase Patterns:**
- RLS policies: Must be enabled for multi-tenant isolation
- Helper function: `public.get_auth_user_org_id()` returns current user's organization ID
- JSONB: Use for flexible data storage (API responses, settings)
- Migrations: Versioned SQL files in `supabase/migrations/`

**TypeScript Patterns:**
- Strict mode enabled
- Type safety: Use interfaces for all API request/response types
- Database types: Auto-generated from Supabase schema (`lib/supabase/database.types.ts`)

### Project Context Reference

**Project:** Infin8Content
**Architecture:** Next.js 16.1.1 with App Router, Supabase PostgreSQL, TypeScript
**Deployment:** Vercel (recommended)
**Database:** Supabase PostgreSQL with RLS
**Authentication:** Supabase Auth (session-based, cookies)

**Key Project Conventions:**
- File naming: kebab-case for files (`keyword-research-form.tsx`)
- Component naming: PascalCase for components (`KeywordResearchForm`)
- API routes: RESTful endpoints in `app/api/**/route.ts`
- Services: External API clients in `lib/services/*.ts`
- Migrations: Timestamped SQL files in `supabase/migrations/`
- Tests: Mirror source structure in `tests/` directory

**Multi-Tenant Architecture:**
- Organizations are top-level tenant entity
- All data must be scoped to `organization_id`
- RLS policies enforce tenant isolation
- `getCurrentUser()` helper provides organization context

**Payment-First Access Model:**
- Users must have `payment_status = 'active'` to access dashboard
- Middleware enforces payment check
- Plan limits enforced at API level (not just UI)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Task 1 - DataForSEO Service Client:**
- ✅ Created singleton service client following Brevo pattern
- ✅ Implemented retry logic with exponential backoff (3 attempts: 1s, 2s, 4s)
- ✅ Added comprehensive error handling for API errors (40000, 40100, 40200, 42900, 50000)
- ✅ Implemented rate limit handling with Retry-After header support
- ✅ All 13 unit tests passing

**Task 2 - Database Schema:**
- ✅ Created `keyword_researches` table with all required fields
- ✅ Created `usage_tracking` table (Epic 10.1) for usage limit enforcement
- ✅ Created `api_costs` table (Epic 10.7) for API cost tracking
- ✅ Added proper indexes for performance (organization_id, keyword, cached_until)
- ✅ Implemented RLS policies following Story 1.11 pattern
- ✅ Added composite index for efficient cache lookups
- ⚠️ **IMPORTANT:** After migration, regenerate TypeScript database types:
  ```bash
  supabase gen types typescript --project-id <project-ref> > lib/supabase/database.types.ts
  ```

**Task 3 - API Route:**
- ✅ Implemented usage limit checking before API calls
- ✅ Implemented 7-day cache TTL with database-backed caching
- ✅ Integrated DataForSEO API with proper error handling
- ✅ Implemented usage tracking increment after successful research
- ✅ Implemented API cost tracking for monitoring
- ✅ Added proper validation with Zod schema
- ✅ Returns structured error responses with usage details
- ✅ Fixed: Added error handling for cache timestamp updates
- ✅ Fixed: Optimized cache lookup (changed from `ilike` to `eq` with normalized keywords)
- ✅ Fixed: Store keywords normalized (lowercase, trimmed) for consistent cache lookups
- ✅ Fixed: Improved error logging with context for debugging

**Task 4 - UI Components:**
- ✅ Created Server Component page with usage limit display
- ✅ Created Client Component for research form with validation
- ✅ Created sortable results table with trend visualization
- ✅ Implemented loading states with skeleton UI
- ✅ Implemented error states with retry button
- ✅ Implemented usage limit warning UI with upgrade button
- ✅ Added API cost display with cached badge indicator
- ✅ Fixed: Added missing Badge import in keyword-research-client.tsx

**Task 5 & 6 - Usage Tracking & Caching:**
- ✅ Usage tracking integrated in API route (Task 3)
- ✅ Caching logic implemented in API route (Task 3)
- ✅ Cache hit updates `updated_at` timestamp for analytics

**Task 7 - Testing:**
- ✅ Unit tests: 13 tests passing for DataForSEO service
- ✅ Integration tests: 7 tests passing for API route (updated mocks to match eq-based cache lookup)
- ✅ Component tests: 9 tests passing for form component (fixed validation error tests)
- ✅ E2E tests: Full research flow tests with Playwright
- ✅ All tests cover error handling, retry logic, usage limits, and caching
- ✅ Fixed: Updated integration test mocks to use `eq` instead of `ilike` for cache lookups
- ✅ Fixed: Component tests now properly trigger form submission for validation testing

### Code Review Fixes (2026-01-07)

**Critical Fixes:**
- ✅ Fixed missing Badge import in `keyword-research-client.tsx`
- ⚠️ **Action Required:** Regenerate TypeScript database types after migration:
  ```bash
  supabase gen types typescript --project-id <project-ref> > lib/supabase/database.types.ts
  ```

**High Priority Fixes:**
- ✅ Added error handling for cache timestamp updates (prevents silent failures)
- ✅ Improved error logging with context (keyword, error message, stack trace)

**Medium Priority Fixes:**
- ✅ Optimized cache lookup: Changed from `ilike` to `eq` with normalized keywords
- ✅ Store keywords normalized (lowercase, trimmed) for consistent cache lookups
- ✅ Added JSDoc comments to helper functions for better code documentation

**Files Modified:**
- `app/dashboard/research/keywords/keyword-research-client.tsx` - Added Badge import
- `app/api/research/keywords/route.ts` - Error handling, cache optimization, JSDoc comments, keyword scoping fix
- `tests/integration/keyword-research.test.ts` - Updated test mocks to match new cache lookup pattern (eq instead of ilike)
- `tests/components/keyword-research-form.test.tsx` - Fixed validation error tests to properly trigger form submission

### File List

**New Files Created:**
- `lib/services/dataforseo.ts` - DataForSEO API client service
- `app/api/research/keywords/route.ts` - Keyword research API endpoint
- `app/dashboard/research/keywords/page.tsx` - Keyword research page (Server Component)
- `app/dashboard/research/keywords/keyword-research-client.tsx` - Client component for research page
- `components/research/keyword-research-form.tsx` - Research input form component
- `components/research/keyword-results-table.tsx` - Results display table component
- `supabase/migrations/20260107230541_add_keyword_research_tables.sql` - Database schema migration
- `tests/services/dataforseo.test.ts` - Unit tests for DataForSEO service
- `tests/integration/keyword-research.test.ts` - Integration tests for API route
- `tests/components/keyword-research-form.test.tsx` - Component tests for form
- `tests/e2e/keyword-research-flow.test.ts` - E2E tests for research flow

**Modified Files:**
- None (all new functionality)

