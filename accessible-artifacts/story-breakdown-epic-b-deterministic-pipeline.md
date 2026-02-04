---
title: "Story Breakdown: Epic B - Deterministic Article Pipeline"
epic: "B"
prd_version: "1.0"
status: "READY FOR ARCHITECT"
date: "2026-02-04"
---

# 📖 Story Breakdown: Epic B – Deterministic Article Pipeline

**Epic:** B (Deterministic Article Pipeline)  
**PRD Version:** 1.0 (LOCKED)  
**Status:** Ready for Architect  
**Total Stories:** 5  
**Dependencies:** Epic A (onboarding must be complete)

---

## Epic B Overview

**Purpose:** Implement a deterministic, section-by-section article generation pipeline that processes articles sequentially (Planner → Research → Content → Assembly) with no parallel execution.

**Scope:**
- Planner Agent (structure authority) - assumed complete
- Research Agent (Perplexity Sonar, fixed prompt, max 10 searches)
- Content Writing Agent (fixed prompt, section-by-section)
- Sequential orchestration (Inngest)
- Context accumulation (prior sections passed forward)

**Out of Scope:**
- Article queuing (Epic C)
- WordPress publishing (Epic C)
- Outline generation (assumed complete)
- Media generation
- Parallel section processing

---

## B-1: Article Sections Data Model

**Story:** As a system, I need to persist article sections with their research and content so that I can track progress and enable retries per section.

**Type:** Infrastructure / Database  
**Complexity:** Low  
**Effort:** 2 hours  
**Dependencies:** None

### Acceptance Criteria

1. **Given** articles need section-level tracking  
   **When** I create the article_sections table  
   **Then** the following columns exist:
   - `id` (UUID, primary key)
   - `article_id` (UUID, foreign key to articles)
   - `section_order` (INTEGER, 1-based)
   - `section_header` (TEXT, e.g., "Introduction")
   - `section_type` (TEXT, e.g., "body", "conclusion")
   - `planner_payload` (JSONB, structure from Planner Agent)
   - `research_payload` (JSONB, research results from Perplexity)
   - `content_markdown` (TEXT, generated markdown)
   - `content_html` (TEXT, rendered HTML)
   - `status` (TEXT, enum: pending, researching, researched, writing, completed, failed)
   - `error_details` (JSONB, error info if failed)
   - `created_at` (TIMESTAMPTZ)
   - `updated_at` (TIMESTAMPTZ)

2. **And** a unique constraint on (article_id, section_order)

3. **And** RLS policies enforce organization isolation via articles table

4. **And** a migration file is created with rollback capability

### Technical Specifications

**Migration File:** `supabase/migrations/[timestamp]_add_article_sections_table.sql`

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

**Type Definitions:** `types/article.ts`
- Add `ArticleSection` interface
- Add `SectionStatus` enum
- Add `PlannerPayload` interface
- Add `ResearchPayload` interface

### Testing

- [ ] Migration applies cleanly
- [ ] Migration rolls back cleanly
- [ ] Unique constraint enforced
- [ ] RLS policies work correctly
- [ ] Status enum enforced
- [ ] Indexes created for query performance

---

## B-2: Research Agent Service

**Story:** As a system, I need to call Perplexity Sonar to research each section so that content is grounded in current information.

**Type:** Backend / Integration  
**Complexity:** High  
**Effort:** 6 hours  
**Dependencies:** B-1

### Acceptance Criteria

1. **Given** a section needs research  
   **When** I call the Research Agent  
   **Then** the system calls Perplexity Sonar with:
   - Fixed prompt (locked, no variation)
   - Section header + context
   - Prior sections (for context)
   - Max 10 searches per section

2. **And** the system persists research results to article_sections.research_payload

3. **And** the system updates section status: pending → researching → researched

4. **And** the system includes full answers + citations in research_payload

5. **And** the system handles errors gracefully (retry logic, error logging)

6. **And** the system never modifies the fixed prompt

7. **And** research completes within 30 seconds per section

### Technical Specifications

**Service File:** `lib/services/article-generation/research-agent.ts`

```typescript
export interface ResearchAgentInput {
  sectionHeader: string
  sectionType: string
  priorSections: ArticleSection[]
  organizationContext: OrganizationConfig
}

export interface ResearchAgentOutput {
  queries: string[]
  results: {
    query: string
    answer: string
    citations: string[]
  }[]
  totalSearches: number
}

export async function runResearchAgent(
  input: ResearchAgentInput
): Promise<ResearchAgentOutput> {
  // Call Perplexity Sonar with fixed prompt
  // Max 10 searches
  // Return research results with citations
}
```

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

**Perplexity Integration:**
- Use Perplexity Sonar API
- Fixed prompt (no variation)
- Max 10 searches per section
- Return full answers + citations
- Timeout: 30 seconds

### Testing

- [ ] Research Agent calls Perplexity correctly
- [ ] Fixed prompt is never modified
- [ ] Max 10 searches enforced
- [ ] Research results persisted correctly
- [ ] Section status updated (pending → researching → researched)
- [ ] Citations included in results
- [ ] Error handling works (retries, logging)
- [ ] Timeout enforced (30 seconds)

---

## B-3: Content Writing Agent Service

**Story:** As a system, I need to call an LLM to write each section based on research so that content is high-quality and coherent.

**Type:** Backend / Integration  
**Complexity:** High  
**Effort:** 6 hours  
**Dependencies:** B-2

### Acceptance Criteria

1. **Given** a section has been researched  
   **When** I call the Content Writing Agent  
   **Then** the system calls an LLM with:
   - Fixed prompt (locked, no variation)
   - Section header + type
   - Research results
   - Prior sections (for context)
   - Organization content defaults

2. **And** the system generates markdown content for the section

3. **And** the system persists content to article_sections.content_markdown

4. **And** the system converts markdown to HTML and persists to content_html

5. **And** the system updates section status: researched → writing → completed

6. **And** the system includes prior sections in context (for coherence)

7. **And** the system never modifies the fixed prompt

8. **And** content generation completes within 60 seconds per section

### Technical Specifications

**Service File:** `lib/services/article-generation/content-writing-agent.ts`

```typescript
export interface ContentWritingAgentInput {
  sectionHeader: string
  sectionType: string
  researchPayload: ResearchPayload
  priorSections: ArticleSection[]
  organizationDefaults: ContentDefaults
}

export interface ContentWritingAgentOutput {
  markdown: string
  html: string
  wordCount: number
}

export async function runContentWritingAgent(
  input: ContentWritingAgentInput
): Promise<ContentWritingAgentOutput> {
  // Call LLM with fixed prompt
  // Generate markdown
  // Convert to HTML
  // Return content
}
```

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

**LLM Integration:**
- Use OpenRouter (existing integration)
- Fixed prompt (no variation)
- Model: Gemini 2.5 Flash (with fallback chain)
- Timeout: 60 seconds
- Markdown output

**HTML Conversion:**
- Use markdown-to-html library
- Sanitize output
- Preserve formatting

### Testing

- [ ] Content Writing Agent calls LLM correctly
- [ ] Fixed prompt is never modified
- [ ] Markdown generated correctly
- [ ] HTML conversion works
- [ ] Prior sections included in context
- [ ] Section status updated (researched → writing → completed)
- [ ] Organization defaults applied
- [ ] Error handling works
- [ ] Timeout enforced (60 seconds)

---

## B-4: Sequential Orchestration (Inngest)

**Story:** As a system, I need to orchestrate the pipeline sequentially so that sections are processed one at a time in order.

**Type:** Backend / Orchestration  
**Complexity:** High  
**Effort:** 8 hours  
**Dependencies:** B-1, B-2, B-3

### Acceptance Criteria

1. **Given** an article is queued for generation  
   **When** the pipeline starts  
   **Then** sections are processed sequentially:
   - Section 1: Research → Write → Persist
   - Section 2: Research → Write → Persist
   - Section 3: Research → Write → Persist
   - (etc.)

2. **And** no sections are processed in parallel

3. **And** each section receives prior sections as context

4. **And** if a section fails, the pipeline stops and logs error

5. **And** the article status is updated after each section completes

6. **And** the pipeline is orchestrated via Inngest

7. **And** the pipeline has a maximum timeout of 10 minutes per article

8. **And** retry logic is applied per section (3 attempts, exponential backoff)

### Technical Specifications

**Inngest Workflow:** `lib/inngest/workflows/article-generation-pipeline.ts`

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

**Retry Logic:**
- 3 attempts per step
- Exponential backoff: 2s, 4s, 8s
- Max timeout: 10 minutes per article

**Error Handling:**
- If a step fails after 3 retries, stop pipeline
- Log error with section details
- Update article status to "failed"
- Persist error details to article_sections.error_details

### Testing

- [ ] Sections processed sequentially (no parallelism)
- [ ] Prior sections passed as context
- [ ] Retry logic works (3 attempts, exponential backoff)
- [ ] Pipeline stops on failure
- [ ] Article status updated correctly
- [ ] Error details logged
- [ ] Timeout enforced (10 minutes)
- [ ] Inngest workflow executes correctly

---

## B-5: Article Status Tracking

**Story:** As a user, I need to see real-time progress of article generation so that I know when articles will be ready.

**Type:** Backend / API  
**Complexity:** Medium  
**Effort:** 4 hours  
**Dependencies:** B-1, B-4

### Acceptance Criteria

1. **Given** an article is being generated  
   **When** I query the article status  
   **Then** the system returns:
   - Article status (queued, generating, completed, failed)
   - Progress percentage (based on completed sections)
   - Sections completed / total sections
   - Current section being processed
   - Estimated completion time
   - Error details (if failed)

2. **And** the endpoint is `GET /api/articles/{article_id}/progress`

3. **And** the endpoint requires authentication

4. **And** the endpoint enforces organization isolation

5. **And** the endpoint returns 200 with progress data

6. **And** the endpoint returns 404 if article not found

### Technical Specifications

**Endpoint Contract:**

```typescript
GET /api/articles/{article_id}/progress
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

**Implementation:**
- Query article_sections table
- Count completed sections
- Calculate progress
- Return response

### Testing

- [ ] Endpoint requires authentication
- [ ] Endpoint enforces organization isolation
- [ ] Progress percentage calculated correctly
- [ ] Estimated completion time calculated correctly
- [ ] Error details returned if failed
- [ ] Returns 404 if article not found
- [ ] Real-time updates work

---

## Epic B Summary

**Total Stories:** 5  
**Total Effort:** 26 hours  
**Dependencies:** Epic A (onboarding must be complete)

**Story Order (Sequential):**
1. B-1: Article Sections Data Model (2 hours)
2. B-2: Research Agent Service (6 hours)
3. B-3: Content Writing Agent Service (6 hours)
4. B-4: Sequential Orchestration (Inngest) (8 hours)
5. B-5: Article Status Tracking (4 hours)

**Deliverables:**
- ✅ article_sections table
- ✅ Research Agent (Perplexity Sonar)
- ✅ Content Writing Agent (OpenRouter)
- ✅ Inngest orchestration (sequential, no parallelism)
- ✅ Progress tracking API

**Success Criteria:**
- 100% sections processed sequentially (no parallel execution)
- 100% prior sections passed as context
- 100% fixed prompts never modified
- 100% articles complete without narrative drift
- 100% retry logic works (3 attempts per section)
- 100% progress tracking accurate

**Constraints (Hard Rules):**
- ❌ No batch writing
- ❌ No parallel sections
- ❌ No shortcut generation
- ❌ No prompt modification
- ❌ No skipping sections

---

**Epic B Status: READY FOR ARCHITECT**
