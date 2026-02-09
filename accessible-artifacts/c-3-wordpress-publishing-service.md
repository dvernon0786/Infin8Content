# Story C.3: WordPress Publishing Service

Status: review

## Story Context: c-3-wordpress-publishing-service

**Status**: ready-for-dev

**Epic**: C – Assembly, Status & Publishing

**User Story**: As a system, I need to publish articles to WordPress idempotently so that users can publish with confidence.

**Implementation Note**: Story C.3 reuses the existing `WordPressAdapter` and publish UI from Story 5-1. This story implements the idempotent publishing service and API wiring only.

**Story Classification**:
- Type: Producer (WordPress publishing integration service)
- Tier: Tier 1 (foundational publishing infrastructure)

**Business Intent**: Implement idempotent WordPress publishing service that safely publishes completed articles to WordPress with proper error handling, logging, and duplicate prevention.

## Contracts Required

**C1**: WordPress publishing service implementation with idempotency
**C2/C4/C5**: publish_references table usage, articles table updates, WordPress API integration
**Terminal State**: Article published to WordPress with publish_reference record created
**UI Boundary**: No UI events (backend service only)
**Analytics**: No analytics events (service operation only)

## Contracts Modified

- New service: WordPress publishing service
- Uses existing publish_references table (from C-2)
- Uses existing articles table (from C-1)
- No existing tables modified

## Contracts Guaranteed

- ✅ No UI events emitted (backend service only)
- ✅ No intermediate analytics (service operation only)
- ✅ No state mutation outside producer (publish_references and articles tables only)
- ✅ Idempotency: Re-publishing returns same URL without duplicate posts
- ✅ Retry rules: No auto-retry (user retry via button only)

## Producer Dependency Check

**Epic B Status**: COMPLETED ✅  
**Epic C Status**: in-progress  
**Story C-1 Status**: done (Article Assembly Service completed)  
**Story C-2 Status**: done (Publish References Table completed)  
**Dependencies Met**: Epic B pipeline complete, C-1 assembly service ready, C-2 publish_references table available  
**Blocking Decision**: ALLOWED

## Acceptance Criteria

1. **Given** an article is ready to publish  
   **When** I call the WordPress publishing service  
   **Then** the system:
   - Checks if article already published (via publish_references)
   - If published, returns existing reference (idempotent)
   - If not published, calls WordPress API
   - Sends only: title, content (HTML), status=publish
   - Receives: post_id, link, status
   - Creates publish_reference record
   - Returns published URL

2. **And** the system uses HTTP Basic Auth (Application Passwords)

3. **And** the system enforces HTTPS only

4. **And** the system has a 30-second timeout

5. **And** the system does NOT send: categories, tags, author, featured_media, meta, excerpt

6. **And** the system handles errors gracefully (no auto-retry, user retry via button)

7. **And** the system logs all publishing attempts

## Technical Requirements

**Service File**: `lib/services/publishing/wordpress-publisher.ts`

**Existing Components to Reuse**:
- `lib/services/wordpress-adapter.ts` - WordPress REST API client (production-ready)
- `components/articles/publish-to-wordpress-button.tsx` - UI component (production-ready)
- `__tests__/lib/services/wordpress-adapter.test.ts` - Comprehensive test suite (production-ready)

**API Endpoint**: `app/api/articles/publish/route.ts` (NEW - missing piece)

**WordPress API Contract** (handled by existing adapter):
```typescript
POST {wordpress_url}/wp-json/wp/v2/posts
Authorization: Basic {base64(username:password)}
Content-Type: application/json

Request Body:
{
  "title": "Article Title",
  "content": "<p>HTML content...</p>",
  "status": "publish"
}

Response:
{
  "id": 123,
  "link": "https://example.com/article-title",
  "status": "publish"
}
```

**Interface Definitions**:
```typescript
export interface WordPressPublishInput {
  articleId: string
  organizationId: string
  credentials: {
    site_url: string
    username: string
    application_password: string
  }
}

export interface WordPressPublishOutput {
  url: string
  postId: string
  alreadyPublished: boolean
}

export async function publishArticleToWordPress(
  input: WordPressPublishInput
): Promise<WordPressPublishOutput>
```

**Idempotency Logic** (NEW - C.3 responsibility):
```typescript
// 1. Check if already published (C.3 responsibility)
const existing = await db
  .from('publish_references')
  .select('*')
  .eq('article_id', articleId)
  .eq('platform', 'wordpress')
  .single()

if (existing) {
  return {
    url: existing.platform_url,
    postId: existing.platform_post_id,
    alreadyPublished: true
  }
}

// 2. Load article (C.3 responsibility)
const article = await db
  .from('articles')
  .select('title, content_html, status')
  .eq('id', articleId)
  .eq('organization_id', organizationId)
  .single()

// 3. Publish via existing adapter (reuse Story 5-1)
const adapter = new WordPressAdapter(credentials)
const result = await adapter.publishPost({
  title: article.title,
  content: article.content_html,
  status: 'publish'
})

// 4. Persist reference (C.3 responsibility)
await db.from('publish_references').insert({
  article_id: articleId,
  platform: 'wordpress',
  platform_post_id: String(result.postId),
  platform_url: result.url,
  published_at: new Date()
})

return {
  url: result.url,
  postId: result.postId,
  alreadyPublished: false
}
```

**Error Handling** (reuse existing adapter, add C.3 context):
- Article validation errors (C.3)
- WordPress API errors (existing adapter)
- Database errors (C.3)
- Network errors (existing adapter)
- No auto-retry (user clicks retry button)
- Log all errors with context

**Security Requirements** (reuse existing adapter):
- HTTP Basic Auth using Application Passwords only
- HTTPS enforcement (existing adapter)
- 30-second timeout enforcement (existing adapter)
- No sensitive data in logs (existing adapter)
- Organization-based access control (C.3)

## Dev Agent Guardrails

### Architecture Compliance

**Service Pattern**: Follow established service pattern from article-generation services
- Use `lib/services/publishing/` directory
- Export interfaces and functions
- Proper error handling with typed errors
- Integration with Supabase client

**Reuse Existing Components**:
- DO NOT modify `lib/services/wordpress-adapter.ts` (production-ready)
- DO NOT modify `components/articles/publish-to-wordpress-button.tsx` (production-ready)
- DO NOT modify `__tests__/lib/services/wordpress-adapter.test.ts` (production-ready)
- ONLY implement thin orchestration layer and API endpoint

**Database Integration**:
- Use existing `publish_references` table from C-2
- Use existing `articles` table for article data
- Follow RLS patterns for organization isolation
- Use proper TypeScript interfaces

**API Integration**:
- Use existing `WordPressAdapter` for WordPress calls
- Implement proper timeout handling (already in adapter)
- Follow HTTP Basic Auth standards (already in adapter)
- Handle response parsing safely (already in adapter)

### Library/Framework Requirements

**Core Dependencies**:
- Next.js 16.1.1 (already in project)
- TypeScript 5 (already in project)
- Supabase client (already in project)

**No New Dependencies Required**:
- WordPress REST API (via existing adapter)
- No additional libraries needed

### File Structure Requirements

**Service Location**: `lib/services/publishing/wordpress-publisher.ts`
- Follow existing service patterns
- Export interfaces and main function
- Include proper JSDoc comments
- Import existing WordPressAdapter

**API Location**: `app/api/articles/publish/route.ts`
- Follow Next.js API route patterns
- Import WordPressPublishingService
- Handle authentication and authorization
- Return proper JSON responses

**Test Location**: `__tests__/services/publishing/wordpress-publisher.test.ts`
- Unit tests for C.3 service logic
- Mock WordPressAdapter (don't test it)
- Test idempotency logic
- Test database operations

### Testing Requirements

**Unit Tests**:
- Idempotency works (re-publish returns same URL)
- Article loading and validation
- Database operations (publish_references)
- Error handling for C.3 logic
- Integration with WordPressAdapter (mocked)

**Integration Tests**:
- End-to-end publishing flow
- Database integration
- API endpoint testing

**Mock Strategy**:
- Mock `WordPressAdapter` (don't retest it)
- Mock Supabase client
- Use Jest/Vitest patterns from existing tests

## Previous Story Intelligence

**Story C-2 Learnings**:
- Database migration patterns established
- RLS policies working correctly
- publish_references table structure validated
- Integration patterns with Supabase established

**Story C-1 Learnings**:
- Article assembly service patterns established
- Content handling with HTML/markdown
- Service layer patterns validated
- Error handling patterns working

**Story 5-1 Learnings** (REUSE):
- WordPress REST API integration completed
- Request contract validation implemented
- HTTP Basic Auth with Application Passwords working
- 30-second timeout enforcement working
- Comprehensive error handling implemented
- Test suite patterns established (294 lines)
- UI component with states implemented
- Connection testing capability available

## Git Intelligence Summary

**Recent Commits Context**:
- Article assembly service completed
- Publish references table implemented
- Service layer patterns established
- Database migrations working

**Code Patterns to Follow**:
- Service export patterns
- Error handling with try-catch
- Database query patterns
- Test structure and mocking

## Latest Tech Information

**WordPress REST API**:
- Current stable version: WP REST API v2
- Authentication: Application Passwords (recommended)
- Endpoint: `/wp-json/wp/v2/posts`
- Required fields: title, content, status
- Response fields: id, link, status

**Security Best Practices**:
- Use HTTPS only (WordPress requirement)
- Application Passwords for authentication
- Timeout handling for network requests
- No sensitive data logging

## Project Context Reference

**Project**: Infin8Content - AI-powered content generation SaaS
**Architecture**: Multi-tenant SaaS with Next.js + Supabase
**Pattern**: Service layer with database integration
**Goal**: Idempotent WordPress publishing for completed articles

## Story Completion Status

**Status**: ready-for-dev
**Dependencies**: All dependencies met
**Contracts**: All contracts validated
**Implementation Ready**: Yes

**Next Steps**:
1. Implement WordPress publishing service
2. Add comprehensive unit tests
3. Test idempotency behavior
4. Validate error handling
5. Integration test with WordPress API

## Dev Agent Record

### Agent Model Used

Cascade (Penguin Alpha) - Advanced development agent with comprehensive context analysis

### Completion Notes List

- Story context created with full epic analysis
- Technical specifications detailed and complete
- Dependencies verified and validated
- Implementation patterns established from previous stories
- Security requirements specified
- Testing requirements comprehensive

### File List

**New Files**:
- `lib/services/publishing/wordpress-publisher.ts` (WordPress publishing service - thin orchestration)
- `app/api/articles/publish/route.ts` (API endpoint - missing piece)
- `__tests__/services/publishing/wordpress-publisher.test.ts` (Unit tests for C.3 logic)

**Existing Files to Reuse**:
- `lib/services/wordpress-adapter.ts` (WordPress REST API client - production-ready)
- `components/articles/publish-to-wordpress-button.tsx` (UI component - production-ready)
- `__tests__/lib/services/wordpress-adapter.test.ts` (Comprehensive test suite - production-ready)

**Dependencies**:
- Story C-1: Article Assembly Service (completed)
- Story C-2: Publish References Table (completed)
- Story 5-1: WordPress Adapter and UI (completed - reuse)
