# Story Context: 4a-2 Section-by-Section Architecture and Outline Generation

**Status:** ready-for-dev  
**Story Key:** `4a-2-section-by-section-architecture-and-outline-generation`  
**Priority:** P0 (MVP - Core differentiator)

---

## 🎯 Story Summary

**As the system**, I want to generate articles using a section-by-section architecture, **So that** I can create 3,000+ word articles that beat token limits and maintain quality.

**Core Value:** Enables long-form article generation (3,000+ words) by breaking content into manageable sections, preventing LLM context window overflow while maintaining coherence.

---

## ⚡ Critical Requirements

### Performance Constraints
- **Outline generation:** MUST complete in < 20 seconds (NFR-P1 breakdown)
- **Full article generation:** MUST complete in < 5 minutes (NFR-P1)
- **Section processing:** Sequential (NOT parallel) to maintain coherence

### Architecture Constraints
- **Sections processed:** Introduction → H2 sections (sequential) → Conclusion → FAQ
- **H3 subsections:** Generated within each H2 section
- **Token management:** Previous sections summarized (not full content) for context
- **Partial preservation:** Save sections incrementally, not only at completion

### Data Dependencies
- **Requires:** Story 4a-1 (article queuing) ✅ Complete
- **Requires:** Story 3-1 (keyword research data) ✅ Complete
- **Blocks:** Story 4a-3 (research per section), Story 4a-5 (LLM content), Story 4a-6 (progress tracking)

---

## 📋 Acceptance Criteria Quick Reference

### AC1: Outline Generation
- Generate outline with: Introduction, 5-10 H2 sections, 2-4 H3 per H2, Conclusion, FAQ (optional)
- Based on: Keyword research data + SERP analysis + content gaps
- Store in article record `outline` JSONB column
- Complete in < 20 seconds

### AC2: Section Processing
- Process sections independently: Introduction first, H2 sequentially, H3 within H2, Conclusion last, FAQ separately
- Fresh research per section (Tavily + DataForSEO) - Story 4a-3 dependency
- Token management ensures sections fit LLM context windows
- Maintain coherence (previous sections as context)

### AC3: Error Handling
- Retry failed sections: 3 attempts with exponential backoff (1s, 2s, 4s)
- On final failure: Set article status to "failed" with error details
- Preserve completed sections (partial article saved)
- Notify user via article status update

---

## 🗄️ Database Schema Changes

### New Columns on `articles` Table

```sql
-- Outline structure (JSONB)
outline JSONB

-- Generated sections array (JSONB)
sections JSONB

-- Progress tracking
current_section_index INTEGER DEFAULT 0
generation_started_at TIMESTAMP WITH TIME ZONE
generation_completed_at TIMESTAMP WITH TIME ZONE

-- Error tracking
error_details JSONB
outline_generation_duration_ms INTEGER
```

### Outline JSON Structure

```typescript
{
  introduction: { title: string, h3_subsections: string[] },
  h2_sections: Array<{
    title: string,
    h3_subsections: string[]
  }>,
  conclusion: { title: string },
  faq: { title: string, included: boolean } | null
}
```

### Sections JSON Structure

```typescript
Array<{
  section_type: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq',
  section_index: number, // Decimal for H3: 1.1, 1.2, etc.
  h2_index?: number, // For H3 sections
  h3_index?: number, // For H3 sections
  title: string,
  content: string,
  word_count: number,
  generated_at: string,
  research_sources?: Array<{ title: string, url: string }>,
  tokens_used?: number
}>
```

### New Table: `serp_analyses`

```sql
CREATE TABLE serp_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  cached_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_serp_analyses_cache_lookup 
  ON serp_analyses(organization_id, LOWER(keyword), cached_until);
```

### Indexes

```sql
CREATE INDEX idx_articles_outline ON articles USING GIN(outline);
CREATE INDEX idx_articles_sections ON articles USING GIN(sections);
CREATE INDEX idx_articles_current_section ON articles(current_section_index);
```

---

## 🏗️ Implementation Structure

### Files to Create

1. **Migration:** `supabase/migrations/YYYYMMDDHHMMSS_add_article_outline_columns.sql`
2. **Outline Service:** `lib/services/article-generation/outline-generator.ts`
3. **Section Processor:** `lib/services/article-generation/section-processor.ts`
4. **Token Utils:** `lib/utils/token-management.ts`
5. **SERP Service:** `lib/services/dataforseo/serp-analysis.ts`

### Files to Modify

1. **Worker Function:** `lib/inngest/functions/generate-article.ts` (extend existing stub)
2. **Database Types:** `lib/supabase/database.types.ts` (regenerate after migration)

---

## 🔧 Key Implementation Patterns

### Inngest Worker Pattern (from Story 4a-1)

```typescript
export const generateArticle = inngest.createFunction(
  { id: 'article/generate', concurrency: { limit: 50 } },
  { event: 'article/generate' },
  async ({ event, step }) => {
    const { articleId } = event.data
    const supabase = createServiceRoleClient()
    
    // Step 1: Load article and keyword research
    // Step 2: Generate outline (< 20s)
    // Step 3: Store outline
    // Step 4: Process sections sequentially
    // Step 5: Update status to "completed"
    // Step 6: Error handling with retries
  }
)
```

### Keyword Research Access Pattern (from Story 3-1)

```typescript
// Query keyword_researches table
const { data: keywordResearch } = await supabase
  .from('keyword_researches')
  .select('*')
  .eq('organization_id', organizationId)
  .ilike('keyword', keyword)
  .single()

// Handle cache miss: use keyword only if research doesn't exist
```

### DataForSEO SERP API Pattern

```typescript
// Endpoint: https://api.dataforseo.com/v3/serp/google/organic/live
// Method: POST
// Auth: HTTP Basic Auth (DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD)

const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify([{
    keyword: string,
    location_code: 2840, // United States
    language_code: 'en',
    depth: 10 // Top 10 results
  }])
})
```

### Token Management Pattern

```typescript
// Use tiktoken library for accurate token counting
import { encoding_for_model } from 'tiktoken'

// Token budget per section: ~6,000 tokens
// Breakdown: Prompt (~500) + Research (~1,000) + Previous Summaries (~1,500) + New Section (~3,000)

// Summarize previous sections (not full content)
function summarizeSections(sections: Section[], maxTokens: number): string {
  // Extract key points, maintain keyword focus, preserve section titles
  // Use LLM summarization or extractive summarization
}
```

### Section Indexing Strategy

```
Introduction: section_index = 0
H2 Section 1: section_index = 1, h2_index = 1
  H3 Subsection 1.1: section_index = 1.1, h2_index = 1, h3_index = 1
  H3 Subsection 1.2: section_index = 1.2, h2_index = 1, h3_index = 2
H2 Section 2: section_index = 2, h2_index = 2
Conclusion: section_index = N (where N = number of H2 sections + 1)
FAQ: section_index = N+1 (if included)
```

### Retry Logic Pattern

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  const delays = [1000, 2000, 4000] // Exponential backoff
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delays[attempt]))
    }
  }
  throw new Error('Max retries exceeded')
}
```

---

## 🚨 Critical Gotchas

1. **Outline generation timing:** MUST complete in < 20 seconds - optimize SERP caching, reduce LLM prompt size
2. **Sequential processing:** Sections MUST be processed sequentially (not parallel) to maintain coherence
3. **Token management:** Previous sections MUST be summarized, not included in full - critical for context window limits
4. **Partial preservation:** Save sections incrementally as they complete, not only at final completion
5. **SERP caching:** Use `serp_analyses` table with 7-day TTL (organization_id + keyword cache key)
6. **Section indexing:** Use decimal indices (1.1, 1.2) for H3 subsections under H2 sections
7. **OpenRouter placeholder:** Must match future API interface exactly (same params, same return type) - Story 4a-5 dependency

---

## 🔗 Dependencies & Integration Points

### External APIs
- **DataForSEO SERP API:** `/v3/serp/google/organic/live` (already configured from Story 3-1)
- **OpenRouter API:** Placeholder for now (Story 4a-5 will implement)

### Database Tables
- `articles` (extend existing from Story 4a-1)
- `keyword_researches` (query for keyword research data)
- `serp_analyses` (new table for SERP analysis caching)
- `organizations` (for multi-tenancy)

### Environment Variables
- `DATAFORSEO_LOGIN` (already configured)
- `DATAFORSEO_PASSWORD` (already configured)
- `OPENROUTER_API_KEY` (future - Story 4a-5)

---

## 📚 Reference Files

- **Full Story:** `_bmad-output/implementation-artifacts/4a-2-section-by-section-architecture-and-outline-generation.md`
- **Epic Details:** `_bmad-output/epics.md` (lines 2303-2354)
- **Story 4a-1:** `_bmad-output/implementation-artifacts/4a-1-article-generation-initiation-and-queue-setup.md`
- **Story 3-1:** `_bmad-output/implementation-artifacts/3-1-keyword-research-interface-and-dataforseo-integration.md`
- **Existing Worker:** `lib/inngest/functions/generate-article.ts`
- **Database Schema:** `infin8content/supabase/migrations/20260108004437_add_articles_table.sql`

---

## ✅ Implementation Checklist

### Database Setup
- [ ] Create migration file with outline/sections columns
- [ ] Create `serp_analyses` table
- [ ] Add indexes (GIN for JSONB, regular for current_section_index)
- [ ] Test migration locally
- [ ] Regenerate database types

### Core Services
- [ ] Implement outline generator (with placeholder LLM)
- [ ] Implement section processor (state machine)
- [ ] Implement token management utilities
- [ ] Implement SERP analysis service (with caching)

### Worker Integration
- [ ] Extend Inngest worker with full generation flow
- [ ] Implement retry logic with exponential backoff
- [ ] Implement partial article preservation
- [ ] Test full generation flow end-to-end

### Testing
- [ ] Unit tests for outline generation
- [ ] Unit tests for section processing
- [ ] Unit tests for token management
- [ ] Integration tests for full flow
- [ ] Performance tests (outline < 20s, full < 5min)

---

**Last Updated:** 2026-01-08  
**Created by:** Scrum Master Agent  
**For:** Story 4a-2 Implementation


