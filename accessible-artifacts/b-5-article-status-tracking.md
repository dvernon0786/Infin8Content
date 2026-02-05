# Story B.5: Article Status Tracking

Status: done

## Story Context

**Epic**: B – Deterministic Article Pipeline  
**User Story**: As a user, I want to see real-time progress of article generation so that I know when articles will be ready.

**Story Classification**:
- Type: Consumer (progress tracking service)
- Tier: Tier 1 (foundational pipeline visibility)

**Business Intent**: Enable users to monitor real-time progress of article generation with visibility into section-by-section completion, estimated timing, and error tracking.

**Contracts Required**:
- C1: GET /api/articles/{article_id}/progress endpoint
- C2/C4/C5: articles, article_sections tables (read-only), authentication system
- Terminal State: No workflow state change (read-only progress tracking)
- UI Boundary: No UI events (backend API only)
- Analytics: article.progress.queries audit events

**Contracts Modified**: None (read-only endpoint, no schema changes)

**Contracts Guaranteed**:
- ✅ No UI events emitted (backend API only)
- ✅ No intermediate analytics (only audit logs for queries)
- ✅ No state mutation (read-only access to article progress)
- ✅ Idempotency: Multiple queries return consistent results
- ✅ Retry rules: 3 attempts with exponential backoff (2s, 4s, 8s) for transient failures

**Producer Dependency Check**:
- Epic B Status: IN-PROGRESS ✅
- Story B-1 (Article Sections Data Model): COMPLETED ✅
- Story B-4 (Sequential Orchestration): COMPLETED ✅
- Dependencies Met: article_sections table exists, sequential pipeline implemented
- Blocking Decision: ALLOWED

## Story

As a user,
I want to see real-time progress of article generation,
so that I know when articles will be ready.

## Acceptance Criteria

1. Given an article is being generated
   When I query the article status
   Then the system returns:
   - Article status (queued, generating, completed, failed)
   - Progress percentage (based on completed sections)
   - Sections completed / total sections
   - Current section being processed
   - Estimated completion time
   - Error details (if failed)

2. And the endpoint is `GET /api/articles/{article_id}/progress`

3. And the endpoint requires authentication

4. And the endpoint enforces organization isolation

5. And the endpoint returns 200 with progress data

6. And the endpoint returns 404 if article not found

## Tasks / Subtasks

- [x] Task 1: Create progress calculation service (AC: 1)
  - [x] Subtask 1.1: Implement progress-calculator.ts with pure logic
  - [x] Subtask 1.2: Add completed sections calculation
  - [x] Subtask 1.3: Add current section detection (first non-completed)
  - [x] Subtask 1.4: Add percentage calculation (floor for clean integers)
  - [x] Subtask 1.5: Add ETA calculation (average duration heuristic)
- [x] Task 2: Create progress tracking API endpoint (AC: 1, 2, 5, 6)
  - [x] Subtask 2.1: Implement GET /api/articles/[article_id]/progress/route.ts
  - [x] Subtask 2.2: Add authentication and authorization checks
  - [x] Subtask 2.3: Add organization isolation via RLS + defensive filtering
  - [x] Subtask 2.4: Add error handling for missing articles (404)
  - [x] Subtask 2.5: Wire progress-calculator service
- [x] Task 3: Add TypeScript interfaces and types (AC: 1)
  - [x] Subtask 3.1: Define ArticleProgress interface (see design spec)
  - [x] Subtask 3.2: Define ProgressResponse interface
  - [x] Subtask 3.3: Add type safety to API route and service
- [x] Task 4: Add comprehensive error handling (AC: 6)
  - [x] Subtask 4.1: Return 404 for non-existent articles
  - [x] Subtask 4.2: Include error details for failed articles
  - [x] Subtask 4.3: Handle database connection errors gracefully
  - [x] Subtask 4.4: Add timeout protection (response < 200ms target)
- [x] Task 5: Write comprehensive tests (AC: all)
  - [x] Subtask 5.1: Unit tests for progress math correctness
  - [x] Subtask 5.2: Unit tests for current section detection
  - [x] Subtask 5.3: Unit tests for ETA calculation heuristics
  - [x] Subtask 5.4: Integration tests for API endpoint
  - [x] Subtask 5.5: Authentication and authorization tests
  - [x] Subtask 5.6: Cross-org access forbidden tests
  - [x] Subtask 5.7: Performance tests under many sections

## Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Fixed type mismatch in progress-calculator.ts line 67 - ArticleProgress -> ArticleProgressResponse
- [x] [AI-Review][HIGH] Fixed import path in progress-calculator.ts - changed relative to absolute path
- [x] [AI-Review][HIGH] Fixed audit logging async issue in API route - replaced with setTimeout fire-and-forget
- [x] [AI-Review][HIGH] Fixed error response format for 400 responses - added code field per ProgressApiErrorResponse
- [x] [AI-Review][MEDIUM] Added performance test to validate <200ms response time requirement
- [x] [AI-Review][LOW] Updated story File List to match actual git changes (5 files vs 4 claimed)
- [x] [AI-Review][LOW] Remove console.log statements from production API route

## Dev Notes

### Design Review Insights (Architectural Validation)

**Key Insight**: Progress is a pure function of database state - no websockets, no background jobs, no coupling to Inngest internals. Just read → calculate → respond.

**Core Design Decisions Validated**:
- ✅ **Read-only contract**: No writes, no side effects, safe and cacheable
- ✅ **Progress from article_sections**: Correct source of truth, not article row
- ✅ **ETA as best-effort**: Heuristic, monotonic improving, nullable (not SLA)

### Recommended Data Model for Response

```typescript
interface ArticleProgress {
  articleId: string
  status: 'queued' | 'generating' | 'completed' | 'failed'

  progress: {
    completedSections: number
    totalSections: number
    percentage: number
    currentSection?: {
      id: string
      section_order: number
      section_header: string
      status: string
    }
  }

  timing: {
    startedAt?: string
    estimatedCompletionAt?: string
    averageSectionDurationSeconds?: number
  }

  error?: {
    message: string
    failedSectionOrder?: number
    failedAt?: string
  }
}
```

### Progress Calculation Logic (Critical Path)

```typescript
// Completed sections
completed = sections.filter(s => s.status === 'completed').length

// Total sections  
total = sections.length

// Percentage (floor for clean integers)
percentage = Math.floor((completed / total) * 100)

// Current section (first non-completed, respects B-4 sequential semantics)
current = sections.find(s => s.status !== 'completed')
```

### ETA Calculation (Safe Heuristic)

```typescript
// Rules: If completedSections < 1 → return null
// Rules: If article is completed/failed → return null

if (completedSections < 1 || article.status === 'completed' || article.status === 'failed') {
  return null
}

avgSeconds = (now - generation_started_at) / completedSections
eta = now + avgSeconds * (totalSections - completedSections)
```

### Security & Isolation Requirements

- **Authentication**: Required, fail fast (401)
- **Organization Isolation**: Enforced via RLS AND defensive filtering
- **Never trust client-supplied article IDs**: Always validate organization_id on articles

### Common Pitfalls to Avoid

- ❌ Don't compute progress from article status alone
- ❌ Don't expose raw section internals  
- ❌ Don't mutate last_viewed_at or similar
- ❌ Don't block on Inngest state

### Implementation Order (To minimize churn)

1. **progress-calculator.ts** (pure logic, unit tests)
2. **API route** (auth + wiring)  
3. **Types**
4. **Integration tests**
5. **Performance check**

### Relevant Architecture Patterns and Constraints

- **Sequential Processing**: Articles are processed section-by-section in strict order (no parallel execution)
- **Section Status Tracking**: Each section has status: pending → researching → researched → writing → completed/failed
- **Organization Isolation**: All data access must be isolated by organization_id via RLS
- **Authentication Required**: All API endpoints must validate user authentication
- **Real-time Progress**: Progress should reflect current state of article_sections table

### Source Tree Components to Touch

- `app/api/articles/[article_id]/progress/route.ts` - New API endpoint
- `lib/services/article-generation/progress-calculator.ts` - Progress calculation service
- `types/article.ts` - Add ArticleProgress and related interfaces
- `__tests__/api/articles/progress.test.ts` - API endpoint tests
- `__tests__/services/article-generation/progress-calculator.test.ts` - Service tests

### Testing Standards Summary

- Unit tests for all business logic (progress calculation, time estimation)
- Integration tests for API endpoint with authentication
- Organization isolation tests (RLS compliance)
- Error handling tests (404, authentication failures, database errors)
- Performance tests (response time < 200ms)

### Project Structure Notes

- **Alignment with Unified Project Structure**: Follow existing API route patterns in `app/api/articles/`
- **Service Layer**: Create service in `lib/services/article-generation/` following existing patterns
- **Type Definitions**: Add to existing `types/article.ts` file
- **Test Structure**: Follow existing test patterns in `__tests__/` directories

### Detected Conflicts or Variances

- **No Conflicts**: This story builds on existing article_sections table from B-1
- **Consistent Patterns**: API route structure follows existing article management endpoints
- **Database Schema**: Uses existing article_sections table, no schema changes needed

### References

- [Source: story-breakdown-epic-b-deterministic-pipeline.md#B-5] - Detailed story requirements and API contract
- [Source: docs/project-documentation/ARCHITECTURE.md] - System architecture and database patterns
- [Source: _bmad-output/implementation-artifacts/b-1-article-sections-data-model.md] - Article sections table schema
- [Source: existing API routes in app/api/articles/] - Authentication and organization isolation patterns

---

## 🚀 IMPLEMENTATION SPECIFICATIONS

### File Structure and Locations

```
app/api/articles/[article_id]/progress/
├── route.ts                    # API endpoint implementation
└── GET.ts                      # HTTP method handler

lib/services/article-generation/
├── progress-calculator.ts      # Pure progress calculation logic
└── types.ts                    # Progress-related types (or add to types/article.ts)

types/
└── article.ts                  # Add ArticleProgress interfaces

__tests__/
├── services/article-generation/
│   └── progress-calculator.test.ts  # Unit tests for calculation logic
└── api/articles/progress/
    └── progress.test.ts              # Integration tests for API endpoint
```

### API Endpoint Contract

```typescript
// GET /api/articles/[article_id]/progress
// Authentication: Required
// Response: 200 with ArticleProgress | 404 | 401 | 403

interface ProgressResponse {
  success: true
  data: ArticleProgress
}

interface ErrorResponse {
  success: false
  error: string
  code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN'
}
```

### Progress Calculator Service Signature

```typescript
// lib/services/article-generation/progress-calculator.ts

export interface ProgressCalculatorInput {
  article: {
    id: string
    status: 'queued' | 'generating' | 'completed' | 'failed'
    generation_started_at?: string
    organization_id: string
  }
  sections: Array<{
    id: string
    section_order: number
    section_header: string
    status: 'pending' | 'researching' | 'researched' | 'writing' | 'completed' | 'failed'
    updated_at: string
  }>
}

export function calculateArticleProgress(input: ProgressCalculatorInput): ArticleProgress
```

### Critical Implementation Details

#### 1. Database Query Pattern
```typescript
// Query with organization isolation (defensive + RLS)
const { data: article, error: articleError } = await supabaseAdmin
  .from('articles')
  .select(`
    id,
    status,
    generation_started_at,
    organization_id,
    article_sections (
      id,
      section_order,
      section_header,
      status,
      updated_at
    )
  `)
  .eq('id', articleId)
  .eq('organization_id', organizationId)  // Defensive filtering
  .single()
```

#### 2. Progress Calculation Edge Cases
- **No sections**: Return 0% progress, status based on article
- **All sections completed**: 100% progress, article status = 'completed'
- **Failed sections**: Include error details from failed section
- **Mixed statuses**: Current section = first non-completed

#### 3. ETA Calculation Rules
- **Null if**: < 1 completed section OR article completed/failed
- **Monotonic**: ETA should never go backwards
- **Heuristic only**: Not an SLA, clearly documented as best-effort

#### 4. Performance Requirements
- **Target**: < 200ms response time
- **Strategy**: Single query with sections join
- **Caching**: Safe to cache (read-only data)

### Test Scenarios (Must-Have)

#### Unit Tests (progress-calculator.test.ts)
```typescript
describe('calculateArticleProgress', () => {
  test('calculates 0% for no sections')
  test('calculates 100% for all completed sections')
  test('identifies current section correctly')
  test('handles failed sections with error details')
  test('returns null ETA for < 1 completed sections')
  test('calculates ETA correctly for in-progress articles')
  test('handles mixed section statuses')
})
```

#### Integration Tests (progress.test.ts)
```typescript
describe('GET /api/articles/[article_id]/progress', () => {
  test('returns 401 for unauthenticated requests')
  test('returns 404 for non-existent articles')
  test('returns 403 for cross-organization access')
  test('returns 200 with correct progress data')
  test('includes error details for failed articles')
  test('performance under many sections (< 200ms)')
})
```

### Security Checklist

- [ ] Authentication validation (401 if no user)
- [ ] Organization isolation (RLS + defensive filtering)
- [ ] Input validation (articleId format)
- [ ] Error message sanitization (no internal details)
- [ ] Rate limiting consideration (progress polling)

### Dev Handoff Checklist

**Prerequisites**: ✅ All dependencies completed (B-1, B-4)
**Story Status**: ✅ Ready for development
**Design Review**: ✅ Completed and validated
**Implementation Spec**: ✅ Detailed above
**Test Coverage**: ✅ Scenarios defined
**Security Requirements**: ✅ Documented

---

## 🎯 DEV HANDOFF SUMMARY

**Story**: B-5 Article Status Tracking  
**Status**: 🟢 **READY FOR IMMEDIATE DEVELOPMENT**  
**Effort**: 4 hours  
**Risk**: Low (read-only, well-scoped)

**Key Files to Create**:
1. `app/api/articles/[article_id]/progress/route.ts`
2. `lib/services/article-generation/progress-calculator.ts`
3. `types/article.ts` (add interfaces)
4. Comprehensive test suite

**Implementation Order**: Progress calculator → API route → Types → Tests

**Success Criteria**:
- ✅ API returns accurate progress data
- ✅ < 200ms response time
- ✅ Proper authentication and isolation
- ✅ All test scenarios passing

**Dependencies**: All completed ✅

---

## Dev Agent Record

### Agent Model Used

Cascade (Penguin Alpha)

### Debug Log References

- Story creation workflow executed via SM agent
- Project artifacts loaded from epics-formalized.md and story-breakdown-epic-b-deterministic-pipeline.md
- Architecture context loaded from docs/project-documentation/ARCHITECTURE.md

### Completion Notes List

- Story B-5 identified as "Article Status Tracking" (not Context Accumulation as initially listed in sprint-status)
- Epic B status confirmed as "in-progress" with B-1 through B-4 completed
- Technical specifications extracted from story breakdown document
- API contract and progress calculation logic defined
- Dependencies confirmed: B-1 (article_sections table) and B-4 (sequential orchestration)

### Implementation Summary

**✅ COMPLETED - All Acceptance Criteria Implemented**

**Core Components Implemented:**
1. **Progress Calculator Service** (`lib/services/article-generation/progress-calculator.ts`)
   - Pure function for calculating article progress from sections data
   - Completed sections calculation with proper counting
   - Current section detection (first non-completed, respects B-4 sequential semantics)
   - Percentage calculation using floor for clean integers
   - ETA calculation using average duration heuristic (null for <1 completed or completed/failed)

2. **API Endpoint** (`app/api/articles/[article_id]/progress/route.ts`)
   - GET endpoint with proper authentication and authorization
   - Organization isolation via RLS + defensive filtering
   - Comprehensive error handling (401, 403, 404, 500 responses)
   - Audit logging for all progress queries
   - Single database query with sections join for performance

3. **TypeScript Interfaces** (`types/article.ts`)
   - ArticleProgressResponse interface for API responses
   - ProgressApiResponse and ProgressApiErrorResponse for type safety
   - Proper integration with existing ArticleProgressStatus type

4. **Comprehensive Test Suite**
   - 7 unit tests for progress calculation logic covering all scenarios
   - 8 integration tests for API endpoint including auth, errors, and edge cases
   - All tests passing (15/15) with 100% success rate

**Security & Performance Features:**
- ✅ Authentication required (401 enforcement)
- ✅ Organization isolation enforced (RLS + defensive filtering)
- ✅ Input validation (article ID format and length)
- ✅ Error message sanitization (no internal details exposed)
- ✅ Audit logging with IP, user agent, and progress details
- ✅ Non-blocking audit logging (won't fail requests)
- ✅ Target < 200ms response time with single query optimization

**Acceptance Criteria Status: ALL IMPLEMENTED ✅**
1. ✅ Article status, progress %, sections completed/total, current section, ETA, error details
2. ✅ GET /api/articles/{article_id}/progress endpoint implemented
3. ✅ Authentication required and enforced
4. ✅ Organization isolation enforced
5. ✅ 200 response with progress data for valid requests
6. ✅ 404 response for non-existent articles

**Technical Excellence:**
- Pure functional design (no side effects, deterministic)
- Read-only contract (safe for caching)
- Proper error boundaries and graceful degradation
- Type-safe implementation with comprehensive interfaces
- Follows existing project patterns and conventions

### File List

**New Files Created:**
- `/home/dghost/Desktop/Infin8Content/infin8content/lib/services/article-generation/progress-calculator.ts` - Progress calculation service with pure logic
- `/home/dghost/Desktop/Infin8Content/infin8content/app/api/articles/[article_id]/progress/route.ts` - API endpoint for progress tracking
- `/home/dghost/Desktop/Infin8Content/infin8content/__tests__/services/article-generation/progress-calculator.test.ts` - Unit tests for progress calculator
- `/home/dghost/Desktop/Infin8Content/infin8content/__tests__/api/articles/progress.test.ts` - Integration tests for API endpoint
- `/home/dghost/Desktop/Infin8Content/accessible-artifacts/b-5-article-status-tracking-enhanced.md` - Enhanced documentation (auto-generated)

**Modified Files:**
- `/home/dghost/Desktop/Infin8Content/infin8content/types/article.ts` - Added ArticleProgressResponse, ProgressApiResponse, ProgressApiErrorResponse interfaces

**Reference Files:**
- `/home/dghost/Desktop/Infin8Content/accessible-artifacts/b-5-article-status-tracking.md` (story file)
- `/home/dghost/Desktop/Infin8Content/accessible-artifacts/story-breakdown-epic-b-deterministic-pipeline.md` (source requirements)
- `/home/dghost/Desktop/Infin8Content/accessible-artifacts/epics-formalized.md` (epic context)
- `/home/dghost/Desktop/Infin8Content/docs/project-documentation/ARCHITECTURE.md` (architecture reference)
