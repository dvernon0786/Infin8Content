---
title: "Architecture Document: Infin8Content Complete System"
status: "ARCHITECT HANDOFF - LOCKED"
version: "1.0"
date: "2026-02-04"
author: "Winston (Architect Agent)"
validated_against:
  - "PRD v1.0 (LOCKED)"
  - "UX Specification (LOCKED)"
  - "Story Breakdown Epics A, B, C (LOCKED)"
  - "Perfect This is exactly.md (Source of Truth)"
---

# 🏗️ Architecture Document: Infin8Content Complete System

**Status:** ✅ ARCHITECT HANDOFF - LOCKED  
**Date:** 2026-02-04  
**Audience:** Development Team  
**Scope:** Epics A, B, C (Onboarding → Pipeline → Publishing)

---

## Executive Summary

Infin8Content is a **deterministic, multi-stage content generation platform** with three architectural phases:

1. **Epic A: Onboarding & Guards** (26 hours) - Configuration layer
2. **Epic B: Deterministic Pipeline** (26 hours) - Sequential article generation
3. **Epic C: Assembly & Publishing** (20 hours) - Final assembly and WordPress publishing

**Key Architectural Principle:**
> Server-side validation is authoritative. Guards are structural, not policy-based. Sequential execution is enforced, not suggested.

---

## System Architecture Overview

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ USER AUTHENTICATION & BILLING (Pre-existing, unchanged)         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ EPIC A: ONBOARDING & GUARDS (Configuration Phase)              │
│                                                                  │
│ Business → Competitors → Blog → Articles → Keywords → Integration│
│                                                                  │
│ Outcome: organizations.onboarding_completed = true              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ EPIC B: DETERMINISTIC PIPELINE (Generation Phase)              │
│                                                                  │
│ Article (queued)                                                │
│   ↓                                                              │
│ Planner Agent (structure authority)                             │
│   ↓                                                              │
│ Section Loop (sequential, strict order):                        │
│   ├─ Research Agent (Perplexity Sonar)                          │
│   ├─ Persist research                                           │
│   ├─ Content Writing Agent (OpenRouter)                         │
│   └─ Persist section content                                    │
│   ↓                                                              │
│ Outcome: article_sections all completed                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ EPIC C: ASSEMBLY & PUBLISHING (Publishing Phase)               │
│                                                                  │
│ Assembly: Combine all sections → markdown + HTML                │
│   ↓                                                              │
│ WordPress Publishing (idempotent via publish_references)        │
│   ↓                                                              │
│ Outcome: Article published, URL tracked                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Epic A – Onboarding System & Guards

### Purpose
Implement a 6-step onboarding wizard with server-side validation and hard route guards that prevent dashboard access until onboarding is complete.

### Data Model Extensions

#### Organizations Table (New Columns)

```sql
ALTER TABLE organizations
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN onboarding_version TEXT DEFAULT 'v1',
ADD COLUMN website_url TEXT,
ADD COLUMN business_description TEXT,
ADD COLUMN target_audiences TEXT[],
ADD COLUMN blog_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN content_defaults JSONB DEFAULT '{}'::jsonb,
ADD COLUMN keyword_settings JSONB DEFAULT '{}'::jsonb;

CREATE INDEX idx_organizations_onboarding_completed 
ON organizations(onboarding_completed);
```

#### Column Purposes (Non-Negotiable)

| Column | Purpose | Used By |
|--------|---------|---------|
| `onboarding_completed` | Hard gate before Intent workflows | Middleware, API guards |
| `website_url` | Primary AI research seed | Onboarding Agent, prompts |
| `business_description` | Used in **all** content prompts | Content Writing Agent |
| `target_audiences` | ICP seed (not final ICP) | Workflow initialization |
| `blog_config` | Sitemap, blog root, reference URLs | Blog analysis agents |
| `content_defaults` | Global article rules | Content Writing Agent |
| `keyword_settings` | Region + auto-generation rules | Keyword generation |

### Route Guards (Structural Enforcement)

#### Protected Routes (Redirect to `/onboarding/business`)
- `/dashboard`
- `/articles`
- `/keywords`
- `/intent/workflows/*`
- `/intent/*`

#### Allowed Routes Without Onboarding
- `/onboarding/*`
- `/billing`
- `/settings/profile`
- `/logout`

#### Guard Implementation

```typescript
// app/middleware.ts
export function middleware(request: NextRequest) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.redirect('/login')
  }
  
  const org = await getOrganization(user.org_id)
  
  if (!org.onboarding_completed) {
    return NextResponse.redirect('/onboarding/business')
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/articles/:path*',
    '/keywords/:path*',
    '/intent/:path*',
  ],
}
```

### API Endpoints (Epic A-3)

#### POST /api/onboarding/business
```typescript
Request: {
  website_url: string (required, valid URL)
  business_description: string (required, min 10 chars)
  target_audiences?: string[] (optional)
}

Response: {
  success: true
  data: { website_url, business_description, target_audiences }
}
```

#### POST /api/onboarding/competitors
```typescript
Request: {
  competitors: string[] (required, 3-7 URLs)
}

Response: {
  success: true
  data: { competitors: [{ url, domain }] }
}

Validation:
- Min 3 competitors
- Max 7 competitors
- Valid URLs only
- No duplicates
```

#### POST /api/onboarding/blog
```typescript
Request: {
  blog_root?: string (optional, valid URL)
  sitemap_url?: string (optional, valid URL)
  reference_articles?: string[] (optional, valid URLs)
}

Response: {
  success: true
  data: { blog_config }
}
```

#### POST /api/onboarding/content-defaults
```typescript
Request: {
  language: string (required)
  tone: string (required)
  internal_links: boolean (required)
  auto_publish: boolean (required)
  global_instructions?: string (optional)
}

Response: {
  success: true
  data: { content_defaults }
}
```

#### POST /api/onboarding/keyword-settings
```typescript
Request: {
  region: string (required)
  auto_generate: boolean (required)
  keyword_limits?: number (optional)
}

Response: {
  success: true
  data: { keyword_settings }
}
```

#### POST /api/onboarding/integration
```typescript
Request: {
  platform?: string (optional: wordpress, webflow, custom, none)
  credentials?: object (optional, platform-specific)
}

Response: {
  success: true
  data: { integration_config }
}
```

#### POST /api/onboarding/complete
```typescript
Request: {} (no body)

Response: {
  success: true
  data: { onboarding_completed: true }
}

Validation:
- website_url is not null
- business_description is not null
- target_audiences is not empty
- competitors table has 3-7 entries
- content_defaults is not empty
- keyword_settings is not empty
```

### Onboarding Agent (Epic A-5)

**Scope (Strict):**
- ✅ Read website
- ✅ Enrich business data
- ✅ Suggest audiences
- ✅ Normalize descriptions

**NOT Allowed:**
- ❌ Generate ICP documents
- ❌ Create workflows
- ❌ Generate keywords
- ❌ Write content

#### POST /api/onboarding/autocomplete-business
```typescript
Request: {
  website_url: string (required, valid URL)
  linkedin_url?: string (optional)
}

Process:
- Use Firecrawl or Perplexity Sonar
- Extract brand, services, tone
- Generate structured summary

Response: {
  success: true
  data: {
    business_name: string
    description: string
    target_audiences: string[]
    pain_points: string[]
    goals: string[]
  }
}
```

### UX Specification (Epic A-4)

#### 6-Step Wizard Flow

**STEP 1: Business**
- Website URL (required, with AI autocomplete)
- Business Name (required)
- Business Description (required, textarea)
- Target Audiences (optional, tag input)

**STEP 2: Competitors**
- Competitor URLs (tag input, 3-7 required)
- Validation: Min 3, max 7, valid URLs

**STEP 3: Blog Configuration**
- Blog Root URL (optional)
- Sitemap URL (optional)
- Best Performing Articles (optional, URL list)

**STEP 4: Article Rules (Global Settings)**
- Language (dropdown, required)
- Tone/Style (dropdown, required)
- Internal Links (toggle)
- Auto-Publish (toggle)
- Global Instructions (textarea, optional)

**STEP 5: Keyword Settings**
- Region (dropdown, required)
- Auto-Generate Keywords (toggle)
- Keyword Limits (optional, numeric)

**STEP 6: Integration**
- Platform Selection (dropdown: WordPress, Webflow, Custom, None)
- API Credentials (conditional, based on platform)

**STEP 7: Completion**
- Success message: "You're all set!"
- Primary CTA: "Create Your First Content Workflow"
- Secondary CTA: "Explore Settings" (optional)

#### Design System (Locked)

**Brand Colors:**
```css
--brand-electric-blue:    #217CEB    (Primary CTA, active step)
--brand-infinite-purple:  #4A42CC    (Accent)
--brand-deep-charcoal:    #2C2C2E    (Text/Primary)
--brand-soft-light-gray:  #F4F4F6    (Background)
--brand-white:            #FFFFFF    (Card backgrounds)
```

**Button Hierarchy:**
- **Primary:** Brand blue background, white text
- **Secondary:** Transparent, brand blue border
- **Disabled:** Neutral gray (#E5E5E7), no opacity tricks

**Stepper:**
- Horizontal, non-clickable progress indicator
- Completed: Brand blue + check icon
- Current: Brand blue + bold label
- Upcoming: Neutral gray

**Hard Rules:**
- ❌ No gradients in buttons
- ❌ No per-step color themes
- ❌ No emojis in onboarding
- ❌ No frontend-only validation

---

## Part 2: Epic B – Deterministic Article Pipeline

### Purpose
Implement a deterministic, section-by-section article generation pipeline that processes articles sequentially with no parallel execution.

### Data Model Extensions

#### Article Sections Table

```sql
CREATE TABLE article_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  section_order INTEGER NOT NULL,
  section_header TEXT NOT NULL,
  section_type TEXT NOT NULL,
  planner_payload JSONB NOT NULL,
  research_payload JSONB,
  content_markdown TEXT,
  content_html TEXT,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'researching', 'researched', 'writing', 'completed', 'failed')),
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (article_id, section_order)
);

CREATE INDEX idx_article_sections_article_id ON article_sections(article_id);
CREATE INDEX idx_article_sections_status ON article_sections(status);
```

### Sequential Orchestration (Inngest)

#### Workflow Structure

```typescript
export const articleGenerationPipeline = inngest.createFunction(
  { id: 'article-generation-pipeline' },
  { event: 'article/generation.started' },
  async ({ event, step }) => {
    const { articleId } = event.data

    // Load article and sections
    const article = await step.run('load-article', async () => {
      return loadArticle(articleId)
    })

    const sections = await step.run('load-sections', async () => {
      return loadArticleSections(articleId)
    })

    // Process each section sequentially
    for (const section of sections) {
      // Research step
      const research = await step.run(
        `research-section-${section.section_order}`,
        async () => {
          return runResearchAgent({
            sectionHeader: section.section_header,
            sectionType: section.section_type,
            priorSections: sections.slice(0, section.section_order - 1),
            organizationContext: article.organization,
          })
        }
      )

      // Persist research
      await step.run(`persist-research-${section.section_order}`, async () => {
        return persistResearch(section.id, research)
      })

      // Writing step
      const content = await step.run(
        `write-section-${section.section_order}`,
        async () => {
          return runContentWritingAgent({
            sectionHeader: section.section_header,
            sectionType: section.section_type,
            researchPayload: research,
            priorSections: sections.slice(0, section.section_order - 1),
            organizationDefaults: article.organization.content_defaults,
          })
        }
      )

      // Persist content
      await step.run(`persist-content-${section.section_order}`, async () => {
        return persistContent(section.id, content)
      })
    }

    // All sections complete
    await step.run('mark-article-complete', async () => {
      return markArticleComplete(articleId)
    })
  }
)
```

#### Retry Logic
- 3 attempts per step
- Exponential backoff: 2s, 4s, 8s
- Max timeout: 10 minutes per article
- If a step fails after 3 retries, stop pipeline and log error

### Research Agent Service (Epic B-2)

**Integration:** Perplexity Sonar  
**Fixed Prompt (Locked):**

```
You are a research assistant. Your task is to research the following section:

Section: {section_header}
Type: {section_type}

Context from prior sections:
{prior_sections_summary}

Organization context:
{organization_description}

Provide comprehensive research with:
1. Direct answers to the section topic
2. Current data and statistics
3. Expert perspectives
4. Actionable insights

Include citations for all claims.
Limit searches to 10 maximum.
```

**Constraints:**
- Max 10 searches per section
- Timeout: 30 seconds
- Return full answers + citations
- Never modify the fixed prompt

### Content Writing Agent Service (Epic B-3)

**Integration:** OpenRouter (Gemini 2.5 Flash with fallback chain)  
**Fixed Prompt (Locked):**

```
You are a content writer. Your task is to write the following section:

Section: {section_header}
Type: {section_type}

Research findings:
{research_results}

Prior sections (for context):
{prior_sections_markdown}

Organization guidelines:
- Tone: {tone}
- Language: {language}
- Include internal links: {internal_links}
- Global instructions: {global_instructions}

Write the section in markdown format:
1. Use clear, engaging language
2. Reference research findings
3. Maintain consistency with prior sections
4. Follow organization guidelines
5. No commentary or meta-text
```

**Constraints:**
- Timeout: 60 seconds
- Markdown output
- Convert to HTML
- Never modify the fixed prompt

### Article Status Tracking (Epic B-5)

#### GET /api/articles/{article_id}/progress

```typescript
Response: {
  success: true
  data: {
    article_id: string
    status: 'queued' | 'generating' | 'completed' | 'failed'
    progress_percent: number (0-100)
    sections_completed: number
    sections_total: number
    current_section: string | null
    estimated_completion_time: ISO8601 | null
    error_code: string | null
    error_message: string | null
  }
}
```

**Progress Calculation:**
- Progress % = (sections_completed / sections_total) * 100
- Estimated completion = current_time + (avg_time_per_section * remaining_sections)

---

## Part 3: Epic C – Assembly, Status & Publishing

### Purpose
Implement article assembly (markdown + HTML), status tracking, and idempotent WordPress publishing.

### Data Model Extensions

#### Publish References Table

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

### Article Assembly Service (Epic C-1)

**Service:** `lib/services/article-generation/article-assembler.ts`

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
  // Load all sections in order
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

### WordPress Publishing Service (Epic C-3)

**Service:** `lib/services/publishing/wordpress-publisher.ts`

#### Idempotency Logic

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
const response = await fetch(
  `${wordPressUrl}/wp-json/wp/v2/posts`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(username + ':' + password)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: title,
      content: contentHtml,
      status: 'publish'
    })
  }
)

const { id, link, status } = await response.json()

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

#### WordPress API Contract

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

**Hard Rules:**
- ❌ No categories/tags
- ❌ No featured_media
- ❌ No author changes
- ❌ No meta fields
- ❌ No draft publishing
- ✅ HTTPS only
- ✅ HTTP Basic Auth (Application Passwords)
- ✅ 30-second timeout

### Publishing API Endpoint (Epic C-4)

#### POST /api/articles/{article_id}/publish

```typescript
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

---

## Cross-Cutting Concerns

### Authentication & Authorization

**All endpoints require:**
- Valid JWT token
- Organization isolation (RLS)
- Proper role-based access

**Implementation:**
```typescript
const user = await getCurrentUser()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const org = await getOrganization(user.org_id)
if (!org) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Error Handling

**Standard Error Response:**
```typescript
{
  error: "ERROR_CODE",
  status: number,
  message: "Human-readable message",
  details?: object
}
```

**Error Codes:**
- `ONBOARDING_INCOMPLETE` (403)
- `ARTICLE_NOT_COMPLETED` (400)
- `NO_WORDPRESS_INTEGRATION` (403)
- `PUBLISHING_FAILED` (500)
- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)

### Audit Logging

**All critical operations logged:**
- Onboarding completion
- Article generation started/completed
- Publishing attempts
- Errors and failures

**Log Entry Structure:**
```typescript
{
  timestamp: ISO8601,
  organization_id: UUID,
  user_id: UUID,
  action: string,
  resource_id: UUID,
  status: 'success' | 'failure',
  details: object,
  error?: string
}
```

---

## Implementation Sequence

### Phase 1: Foundation (Epic A) – 1-2 weeks
1. A-1: Data Model Extensions (2h)
2. A-2: Onboarding Guard Middleware (4h)
3. A-3: Onboarding API Endpoints (6h)
4. A-4: Onboarding UI Components (8h)
5. A-5: Onboarding Agent (4h)
6. A-6: Onboarding Validator (2h)

**Validation:**
- Users can complete onboarding
- Dashboard is protected
- Workflows cannot be created without onboarding

### Phase 2: Pipeline (Epic B) – 1-2 weeks
1. B-1: Article Sections Data Model (2h)
2. B-2: Research Agent Service (6h)
3. B-3: Content Writing Agent Service (6h)
4. B-4: Sequential Orchestration (Inngest) (8h)
5. B-5: Article Status Tracking (4h)

**Validation:**
- Articles generate sequentially
- Sections receive prior context
- Progress tracking works
- No parallel execution

### Phase 3: Publishing (Epic C) – 1 week
1. C-1: Article Assembly Service (4h)
2. C-2: Publish References Table (2h)
3. C-3: WordPress Publishing Service (6h)
4. C-4: Publishing API Endpoint (4h)
5. C-5: Article Status & Publishing UI (4h)

**Validation:**
- Articles assemble correctly
- Publishing is idempotent
- Published URLs tracked
- Users can publish with confidence

---

## Testing Strategy

### Unit Tests
- Validation schemas
- Guard logic
- API endpoints
- Service functions
- Orchestration steps

### Integration Tests
- Onboarding flow end-to-end
- Section processing
- Article assembly
- Publishing flow

### E2E Tests
- User completes onboarding, accesses dashboard
- Article generates sequentially
- Article publishes to WordPress

### Security Tests
- Auth enforcement
- Organization isolation
- RLS policies
- API guard validation

---

## Success Criteria

### Onboarding (Epic A)
- ✅ 100% of users complete onboarding
- ✅ 0% bypass attempts succeed
- ✅ <2 minutes average onboarding time

### Article Generation (Epic B)
- ✅ 100% of articles complete without errors
- ✅ 100% of sections receive prior context
- ✅ 0% parallel execution incidents
- ✅ <10 minutes per article generation time

### Publishing (Epic C)
- ✅ 100% of articles publish successfully
- ✅ 0% duplicate posts
- ✅ 100% idempotency on retry
- ✅ <30 seconds per publish operation

---

## Hard Constraints (Non-Negotiable)

### Onboarding
- ❌ No skipping steps
- ❌ No frontend-only validation
- ❌ No onboarding state in workflow
- ❌ No partial onboarding

### Article Generation
- ❌ No batch writing
- ❌ No parallel sections
- ❌ No shortcut generation
- ❌ No prompt modification
- ❌ No skipping sections

### Publishing
- ❌ No auto-retry (user retry only)
- ❌ No draft publishing
- ❌ No media upload
- ❌ No categories/tags
- ❌ No parallel publishing

---

## Handoff Checklist

- ✅ UX specification locked (screen-by-screen flows)
- ✅ PRD v1.0 locked (no changes)
- ✅ Story breakdown complete (15 stories, 72 hours)
- ✅ Dependencies mapped (clear execution order)
- ✅ Success criteria defined (measurable outcomes)
- ✅ Risk mitigation planned (guard enforcement, idempotency)
- ✅ Testing strategy defined (unit, integration, E2E)
- ✅ Architecture handoff points identified
- ✅ Data model finalized
- ✅ API contracts locked
- ✅ Orchestration design complete

---

## Next Steps for Development Team

1. **Review** all three story breakdown documents
2. **Implement** Phase 1 (Epic A) following sequential order
3. **Validate** onboarding completion before proceeding to Phase 2
4. **Implement** Phase 2 (Epic B) with strict sequential enforcement
5. **Implement** Phase 3 (Epic C) with idempotency verification
6. **Test** each phase thoroughly before moving to next
7. **Deploy** to staging, then production

---

**Architecture Document Status: LOCKED & READY FOR IMPLEMENTATION ✅**

All architectural decisions are final. No changes without explicit architect approval.
