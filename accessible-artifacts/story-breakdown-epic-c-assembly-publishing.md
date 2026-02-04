---
title: "Story Breakdown: Epic C - Assembly, Status & Publishing"
epic: "C"
prd_version: "1.0"
status: "READY FOR ARCHITECT"
date: "2026-02-04"
---

# 📖 Story Breakdown: Epic C – Assembly, Status & Publishing

**Epic:** C (Assembly, Status & Publishing)  
**PRD Version:** 1.0 (LOCKED)  
**Status:** Ready for Architect  
**Total Stories:** 4  
**Dependencies:** Epic B (pipeline must complete)

---

## Epic C Overview

**Purpose:** Implement article assembly (markdown + HTML), status tracking, and idempotent WordPress publishing.

**Scope:**
- Section assembly (combine all sections into final article)
- Markdown + HTML output
- Article status tracking (queued → completed)
- WordPress publishing integration (idempotent)
- Publish references table (prevent duplicates)

**Out of Scope:**
- Article queuing (Epic A/B responsibility)
- Media generation
- Multiple platform publishing (WordPress only for MVP)
- Draft publishing
- Automatic publishing (manual only)

---

## C-1: Article Assembly Service

**Story:** As a system, I need to assemble all completed sections into a final article so that the article is ready for publishing.

**Type:** Backend / Service  
**Complexity:** Medium  
**Effort:** 4 hours  
**Dependencies:** B-1

### Acceptance Criteria

1. **Given** all sections of an article are completed  
   **When** I call the assembly service  
   **Then** the system:
   - Loads all sections in order
   - Combines markdown content
   - Combines HTML content
   - Generates table of contents (from section headers)
   - Adds metadata (word count, reading time, etc.)

2. **And** the system persists final markdown to articles.content_markdown

3. **And** the system persists final HTML to articles.content_html

4. **And** the system updates articles.status = 'completed'

5. **And** the system calculates word count and reading time

6. **And** the system handles missing sections gracefully (error logging)

7. **And** assembly completes within 5 seconds

### Technical Specifications

**Service File:** `lib/services/article-generation/article-assembler.ts`

```typescript
export interface AssemblyInput {
  articleId: string
  sections: ArticleSection[]
}

export interface AssemblyOutput {
  markdown: string
  html: string
  wordCount: number
  readingTimeMinutes: number
  tableOfContents: {
    level: number
    header: string
    anchor: string
  }[]
}

export async function assembleArticle(
  input: AssemblyInput
): Promise<AssemblyOutput> {
  // Load all sections
  // Combine markdown
  // Combine HTML
  // Generate TOC
  // Calculate word count + reading time
  // Return assembly
}
```

**Assembly Logic:**
- Combine sections in order (section_order ASC)
- Add section headers as H2
- Add TOC at beginning
- Calculate word count (markdown)
- Calculate reading time (200 words/minute)
- Validate all sections present

**Markdown Format:**
```markdown
# {Article Title}

## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)

## Section 1
{section 1 content}

## Section 2
{section 2 content}
```

### Testing

- [ ] All sections combined in correct order
- [ ] Markdown generated correctly
- [ ] HTML generated correctly
- [ ] Table of contents generated
- [ ] Word count calculated correctly
- [ ] Reading time calculated correctly
- [ ] Metadata persisted to articles table
- [ ] Status updated to 'completed'
- [ ] Error handling for missing sections

---

## C-2: Publish References Table

**Story:** As a system, I need to track which articles have been published where so that I can prevent duplicate publishing.

**Type:** Infrastructure / Database  
**Complexity:** Low  
**Effort:** 2 hours  
**Dependencies:** None

### Acceptance Criteria

1. **Given** articles need to be published idempotently  
   **When** I create the publish_references table  
   **Then** the following columns exist:
   - `id` (UUID, primary key)
   - `article_id` (UUID, foreign key to articles)
   - `platform` (TEXT, e.g., "wordpress")
   - `platform_post_id` (TEXT, external ID from platform)
   - `platform_url` (TEXT, published URL)
   - `published_at` (TIMESTAMPTZ)
   - `created_at` (TIMESTAMPTZ)

2. **And** a unique constraint on (article_id, platform)

3. **And** RLS policies enforce organization isolation via articles table

4. **And** a migration file is created with rollback capability

### Technical Specifications

**Migration File:** `supabase/migrations/[timestamp]_add_publish_references_table.sql`

```sql
CREATE TABLE publish_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_post_id TEXT NOT NULL,
  platform_url TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (article_id, platform)
);

CREATE INDEX idx_publish_references_article_id ON publish_references(article_id);
CREATE INDEX idx_publish_references_platform ON publish_references(platform);
```

**Type Definitions:** `types/publishing.ts`
- Add `PublishReference` interface
- Add `PublishPlatform` enum

### Testing

- [ ] Migration applies cleanly
- [ ] Migration rolls back cleanly
- [ ] Unique constraint enforced
- [ ] RLS policies work correctly
- [ ] Indexes created for query performance

---

## C-3: WordPress Publishing Service

**Story:** As a system, I need to publish articles to WordPress idempotently so that users can publish with confidence.

**Type:** Backend / Integration  
**Complexity:** High  
**Effort:** 6 hours  
**Dependencies:** C-1, C-2

### Acceptance Criteria

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

### Technical Specifications

**Service File:** `lib/services/publishing/wordpress-publisher.ts`

```typescript
export interface WordPressPublishInput {
  articleId: string
  title: string
  contentHtml: string
  wordPressUrl: string
  apiUsername: string
  apiPassword: string
}

export interface WordPressPublishOutput {
  postId: string
  postUrl: string
  status: 'publish'
}

export async function publishToWordPress(
  input: WordPressPublishInput
): Promise<WordPressPublishOutput> {
  // Check publish_references for idempotency
  // If exists, return existing reference
  // If not, call WordPress API
  // Create publish_reference
  // Return result
}
```

**WordPress API Contract:**

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

**Idempotency Logic:**
```typescript
// Check if already published
const existing = await db
  .from('publish_references')
  .select('*')
  .eq('article_id', articleId)
  .eq('platform', 'wordpress')
  .single()

if (existing) {
  // Return existing reference (idempotent)
  return {
    postId: existing.platform_post_id,
    postUrl: existing.platform_url,
    status: 'publish'
  }
}

// Publish to WordPress
const response = await fetch(...)
const { id, link, status } = response.json()

// Create publish_reference
await db.from('publish_references').insert({
  article_id: articleId,
  platform: 'wordpress',
  platform_post_id: id,
  platform_url: link,
  published_at: new Date()
})

return { postId: id, postUrl: link, status }
```

**Error Handling:**
- Invalid credentials: 401 error
- Invalid URL: 400 error
- Network error: 500 error
- No auto-retry (user clicks retry button)
- Log all errors with context

### Testing

- [ ] Idempotency works (re-publish returns same URL)
- [ ] WordPress API called correctly
- [ ] Only title, content, status sent
- [ ] HTTP Basic Auth used
- [ ] HTTPS enforced
- [ ] 30-second timeout enforced
- [ ] publish_reference created
- [ ] Error handling works
- [ ] Logging works

---

## C-4: Publishing API Endpoint

**Story:** As a user, I need an API endpoint to publish articles to WordPress so that I can trigger publishing from the UI.

**Type:** Backend / API  
**Complexity:** Medium  
**Effort:** 4 hours  
**Dependencies:** C-3

### Acceptance Criteria

1. **Given** an article is ready to publish  
   **When** I call `POST /api/articles/{article_id}/publish`  
   **Then** the system:
   - Validates article exists and is completed
   - Validates organization has WordPress integration configured
   - Calls WordPress publishing service
   - Returns published URL
   - Returns 200 on success

2. **And** the endpoint requires authentication

3. **And** the endpoint enforces organization isolation

4. **And** the endpoint validates article status = 'completed'

5. **And** the endpoint returns 400 if article not completed

6. **And** the endpoint returns 403 if no WordPress integration

7. **And** the endpoint returns 500 if publishing fails

8. **And** the endpoint is idempotent (re-publish returns same URL)

### Technical Specifications

**Endpoint Contract:**

```typescript
POST /api/articles/{article_id}/publish
Request: {} (no body)

Response (Success):
{
  "success": true
  "data": {
    "article_id": string
    "post_id": string
    "post_url": string
    "published_at": ISO8601
  }
}

Response (Article Not Completed):
{
  "error": "ARTICLE_NOT_COMPLETED"
  "status": 400
  "message": "Article must be completed before publishing"
}

Response (No WordPress Integration):
{
  "error": "NO_WORDPRESS_INTEGRATION"
  "status": 403
  "message": "WordPress integration not configured"
}

Response (Publishing Failed):
{
  "error": "PUBLISHING_FAILED"
  "status": 500
  "message": "Failed to publish to WordPress"
  "details": { ... }
}
```

**Implementation:**
- Load article
- Validate status = 'completed'
- Load organization WordPress config
- Call WordPress publishing service
- Return result

### Testing

- [ ] Endpoint requires authentication
- [ ] Endpoint enforces organization isolation
- [ ] Validates article status
- [ ] Validates WordPress integration
- [ ] Idempotency works
- [ ] Error handling works
- [ ] Logging works

---

## C-5: Article Status & Publishing UI

**Story:** As a user, I need to see article status and publish button so that I can publish articles when ready.

**Type:** Frontend / UI  
**Complexity:** Medium  
**Effort:** 4 hours  
**Dependencies:** C-4

### Acceptance Criteria

1. **Given** an article is being generated or completed  
   **When** I view the article detail page  
   **Then** I see:
   - Article title
   - Progress bar (if generating)
   - Status badge (queued, generating, completed, failed)
   - Sections list with status
   - Word count + reading time
   - Publish button (if completed)
   - Published URL (if published)

2. **And** the progress bar updates in real-time (via polling or websocket)

3. **And** the publish button is disabled until article is completed

4. **And** clicking publish shows loading state + spinner

5. **And** on success, show published URL + success message

6. **And** on error, show error message + retry button

7. **And** the UI is responsive (mobile-friendly)

### Technical Specifications

**Component:** `components/articles/ArticleDetail.tsx`

**State:**
- Article data (title, status, sections, etc.)
- Publishing state (idle, loading, success, error)
- Progress polling (every 2 seconds)

**UI Elements:**
- Article title (H1)
- Status badge (color-coded)
- Progress bar (if generating)
- Sections list (collapsible)
- Word count + reading time
- Publish button (disabled if not completed)
- Published URL (if published)
- Error message (if failed)

**Real-time Updates:**
- Poll `/api/articles/{article_id}/progress` every 2 seconds
- Update progress bar
- Update status badge
- Stop polling when completed

**Publishing Flow:**
1. User clicks "Publish to WordPress"
2. Button shows loading state
3. API call to `POST /api/articles/{article_id}/publish`
4. On success: show published URL + success message
5. On error: show error message + retry button

### Testing

- [ ] Article detail page renders
- [ ] Progress bar updates
- [ ] Status badge shows correct status
- [ ] Publish button disabled until completed
- [ ] Publishing works
- [ ] Error handling works
- [ ] Mobile responsive

---

## Epic C Summary

**Total Stories:** 5  
**Total Effort:** 20 hours  
**Dependencies:** Epic B (pipeline must complete)

**Story Order (Sequential):**
1. C-1: Article Assembly Service (4 hours)
2. C-2: Publish References Table (2 hours)
3. C-3: WordPress Publishing Service (6 hours)
4. C-4: Publishing API Endpoint (4 hours)
5. C-5: Article Status & Publishing UI (4 hours)

**Deliverables:**
- ✅ Article assembly (markdown + HTML)
- ✅ publish_references table
- ✅ WordPress publishing service (idempotent)
- ✅ Publishing API endpoint
- ✅ Article detail UI with publish button

**Success Criteria:**
- 100% articles assembled correctly
- 100% publishing is idempotent (no duplicates on retry)
- 100% users can publish with confidence
- 100% published URLs tracked
- 100% error handling graceful

**Constraints (Hard Rules):**
- ❌ No auto-retry (user retry only)
- ❌ No draft publishing
- ❌ No media upload
- ❌ No categories/tags
- ❌ No parallel publishing

---

**Epic C Status: READY FOR ARCHITECT**
