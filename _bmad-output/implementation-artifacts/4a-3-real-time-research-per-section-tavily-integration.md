# Story 4a.3: Real-Time Research Per Section (Tavily Integration)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the system,
I want to perform fresh Tavily research for each article section,
So that content includes current facts and citations for EEAT compliance.

## Acceptance Criteria

**Given** the system is generating a section (e.g., "Types of Running Shoes")
**When** research is needed for that section
**Then** the system calls Tavily API with a research query based on:
- Section topic/keyword
- Main keyword context
- Previous section content (for coherence)
**And** Tavily returns up to 20 sources with:
  - Source title
  - Source URL
  - Relevant excerpt
  - Publication date
**And** sources are ranked by relevance
**And** top 5-10 most relevant sources are selected for citation

**Given** Tavily research results are received
**When** the section is being written
**Then** citations are automatically included in the section content:
- In-text citations: "According to [Source Title](URL)..."
- Reference list at end of section (if applicable)
- Citations formatted correctly (author, title, URL, date when available)
**And** at least 1-2 citations are included per section
**And** citations are relevant to the section content
**And** citation URLs are valid and accessible

**Given** Tavily API returns an error for a section
**When** research fails
**Then** the system retries (3 attempts with exponential backoff)
**And** if retry succeeds, generation continues
**And** if retry fails, the section is generated without fresh research (uses cached data or general knowledge)
**And** a warning is logged: "Section generated without fresh Tavily research"
**And** the article status notes partial research failure

**Given** multiple sections need research
**When** the system processes sections
**Then** Tavily API calls are made sequentially (one per section)
**And** API costs are tracked per section (~$0.08 per query)
**And** total API costs are calculated and stored
**And** research results are cached for 24 hours (if same query repeated)

## Tasks / Subtasks

- [x] Task 1: Create Tavily API service integration (AC: Tavily API calls)
  - [x] Create `lib/services/tavily/tavily-client.ts` service file
  - [x] Implement Tavily API authentication (API key from environment)
  - [x] Implement `researchQuery()` function with query generation logic
  - [x] Handle API response parsing (extract sources, titles, URLs, excerpts, dates)
  - [x] Implement source ranking by relevance
  - [x] Select top 5-10 most relevant sources for citation
  - [x] Add error handling for API failures
- [x] Task 2: Integrate Tavily research into section processing (AC: Research per section)
  - [x] Modify `lib/services/article-generation/section-processor.ts`
  - [x] Add Tavily research call before section content generation
  - [x] Generate research query from section topic + keyword context + previous sections
  - [x] Pass research results to LLM content generation (Story 4a-5 dependency)
  - [x] Store research results in section metadata (`research_sources` field)
- [x] Task 3: Implement citation formatting and inclusion (AC: Citation formatting)
  - [x] Create citation formatting utility: `lib/utils/citation-formatter.ts`
  - [x] Format in-text citations: "According to [Source Title](URL)..."
  - [x] Format reference list at end of section
  - [x] Include author, title, URL, date when available
  - [x] Ensure at least 1-2 citations per section
  - [x] Validate citation URLs are accessible
- [x] Task 4: Implement research result caching (AC: 24-hour cache)
  - [x] Create `tavily_research_cache` table for caching research results
  - [x] Cache key: `organization_id + research_query` (normalized, case-insensitive)
  - [x] TTL: 24 hours (`cached_until` timestamp)
  - [x] Check cache before API call, store results after API call
  - [x] Handle cache invalidation (expired entries)
- [x] Task 5: Implement API cost tracking (AC: Cost tracking)
  - [x] Track Tavily API costs per section in `api_costs` table
  - [x] Cost per query: $0.08 (fixed rate)
  - [x] Track total costs per article (sum of all section costs)
  - [x] Store cost data in article metadata or separate tracking table
- [x] Task 6: Implement error handling and retry logic (AC: Error handling)
  - [x] Add retry mechanism with exponential backoff (1s, 2s, 4s delays)
  - [x] Max attempts: 3 per research query
  - [x] Graceful degradation: Continue without fresh research if retry fails
  - [x] Log warning: "Section generated without fresh Tavily research"
  - [x] Update article status to note partial research failure
  - [x] Preserve completed sections even if research fails

## Dev Notes

### Quick Reference

**Critical Setup Steps:**
1. Obtain Tavily API key from Tavily dashboard
2. Add `TAVILY_API_KEY` to environment variables (`.env.local` for dev, Vercel for prod)
3. Install Tavily SDK (if available) or use REST API directly
4. Integrate research call into section processor (before LLM content generation)
5. Implement citation formatting and inclusion in section content

**Quick Reference Table:**

| Category | Details |
|----------|---------|
| **Tavily Service** | `lib/services/tavily/tavily-client.ts` |
| **Section Processor** | `lib/services/article-generation/section-processor.ts` (modify existing) |
| **Citation Formatter** | `lib/utils/citation-formatter.ts` |
| **Cache Table** | `tavily_research_cache` (new migration) |
| **Cost Tracking** | `api_costs` table (extend existing) |
| **Env Var** | `TAVILY_API_KEY` |
| **Cost per Query** | $0.08 (fixed) |
| **Cache TTL** | 24 hours |
| **Max Sources** | 20 per query, select top 5-10 |
| **Retry Attempts** | 3 with exponential backoff |

**Common Gotchas:**
- Research query generation must include section topic + keyword context + previous sections for coherence
- Citations must be formatted correctly for EEAT compliance (author, title, URL, date)
- Cache key must be normalized (case-insensitive, trimmed) to avoid duplicate cache entries
- API cost tracking must happen per section, not per article (for accurate billing)
- Graceful degradation: If Tavily fails, continue without fresh research (don't block article generation)
- Research results must be stored in section metadata for later reference and citation verification

### Epic Context

**Epic 4A: Article Generation Core**
- **User Outcome:** Users can generate long-form articles (3,000+ words) with AI using section-by-section architecture, automatic SEO optimization, and real-time progress tracking.
- **Dependencies:** Epic 3 (requires keyword research data) - Story 3-1 is complete
- **Success Metrics:**
  - < 5 minutes article generation (99th percentile) - NFR-P1 (North Star Metric)
  - 70%+ articles score > 60 on Flesch-Kincaid readability (NFR-DQ1)
  - 80%+ articles include 3+ citations (NFR-DQ2)

**This Story's Role:** Critical P0 story that enables EEAT compliance through real-time citations. This is a core differentiator vs competitors who use stale training data. Tavily provides current facts with proper citations, ensuring content meets Google's EEAT requirements.

**Story Dependencies:**
- **Requires:** Story 4a-1 (article queuing infrastructure) - ✅ Complete
- **Requires:** Story 4a-2 (section-by-section architecture) - ✅ Complete (section processor exists)
- **Blocks:** Story 4a-5 (LLM content generation - needs research results for citations)
- **Note:** Story 4a-5 will use research results from this story to include citations in generated content

### Technical Architecture Requirements

**Tavily API Integration:**
- **API Endpoint:** `https://api.tavily.com/search` (verify latest endpoint from Tavily documentation)
- **Authentication:** API key via `Authorization: Bearer {TAVILY_API_KEY}` header or query parameter
- **Request Format:**
  ```typescript
  {
    "query": string, // Research query (section topic + keyword context)
    "search_depth": "basic" | "advanced", // Use "advanced" for better results
    "include_answer": false, // We want sources, not AI answer
    "include_images": false, // Not needed for citations
    "include_raw_content": false, // We only need excerpts
    "max_results": 20, // Maximum sources per query
    "include_domains": [], // Optional: restrict to specific domains
    "exclude_domains": [] // Optional: exclude specific domains
  }
  ```
- **Response Format:**
  ```typescript
  {
    "query": string,
    "follow_up_questions": string[], // Not needed for our use case
    "response_time": number,
    "results": Array<{
      "title": string,
      "url": string,
      "content": string, // Excerpt/relevant content
      "score": number, // Relevance score (0-1)
      "published_date": string | null, // ISO date string or null
      "author": string | null // Author name or null
    }>
  }
  ```
- **Error Handling:**
  - HTTP 401: Invalid API key → Log error, don't retry
  - HTTP 429: Rate limit exceeded → Retry with exponential backoff (1s, 2s, 4s delays), max 3 attempts
  - HTTP 500: Server error → Retry with exponential backoff
  - Network errors → Retry with exponential backoff
- **Rate Limit Handling:**
  - Check Tavily documentation for specific rate limits (requests per minute/second)
  - Implement exponential backoff for rate limit errors (429 status)
  - If rate limit persists after retries, queue research request for later processing
  - Log rate limit events for monitoring and optimization
- **Cost:** $0.08 per query (fixed rate, regardless of results count)

**Research Query Generation:**
- **Query Components:**
  1. Section topic/title (primary focus)
  2. Main keyword context (for coherence)
  3. Previous section summaries (for context continuity)
- **Query Format:** Combine components into natural language query
  - Example: "Types of running shoes for marathons best practices 2024"
  - Example: "Cushioning technology in running shoes latest innovations"
- **Query Optimization:**
  - Include year (2024, 2025) for recent results
  - Include "best practices", "latest", "current" for fresh content
  - Keep query concise (50-100 characters max) to avoid API token limits and improve relevance
  - Remove stop words if needed for better results
  - Consider token limits: Very long queries may hit API limits or return less relevant results

**Citation Formatting:**
- **In-Text Citations:**
  - Format: `According to [Source Title](URL), ...`
  - Format: `[Source Title](URL) reports that...`
  - Format: `As noted in [Source Title](URL), ...`
  - Place citations naturally within section content (not all at end)
  - Minimum 1-2 citations per section (aim for 2-3 for better EEAT)
- **Reference List (Optional):**
  - Format at end of section:
    ```
    ## References
    - [Source Title](URL) - Author Name (Date)
    - [Source Title](URL) - Author Name (Date)
    ```
  - Include author and date when available
  - Sort by relevance (most relevant first)
- **Citation Validation:**
  - Validate URLs asynchronously with timeout (5 seconds max) - don't block section generation
  - Verify URLs are accessible (HTTP 200 response) but continue even if validation fails
  - Handle broken links gracefully (include citation but note if link fails)
  - Validate URL format (must be valid HTTP/HTTPS URL)
  - Log validation failures for monitoring but don't prevent citation inclusion

**Database Schema Extensions:**
- **New Table: `tavily_research_cache`**
  ```sql
  CREATE TABLE tavily_research_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    research_query TEXT NOT NULL, -- Normalized query (lowercase, trimmed)
    research_results JSONB NOT NULL, -- Full Tavily API response
    cached_until TIMESTAMP WITH TIME ZONE NOT NULL, -- TTL: 24 hours from created_at
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  CREATE INDEX idx_tavily_cache_lookup ON tavily_research_cache(organization_id, LOWER(research_query), cached_until);
  CREATE INDEX idx_tavily_cache_expiry ON tavily_research_cache(cached_until) WHERE cached_until < NOW();
  ```
- **Cache Cleanup:** Expired cache entries are automatically excluded by the partial index query. Consider periodic cleanup job (weekly) to remove old entries, or rely on PostgreSQL's automatic maintenance.
- **Extend `articles.sections` JSONB:**
  - **Note:** The `Section` interface in `lib/services/article-generation/section-processor.ts` (line 20) already defines `research_sources?: Array<{ title: string; url: string }>`. This field needs to be extended with additional properties.
  - Extend existing `research_sources` field to include:
    ```typescript
    {
      section_type: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq',
      section_index: number,
      title: string,
      content: string,
      word_count: number,
      generated_at: string,
      research_sources: Array<{ // EXTEND EXISTING FIELD
        title: string,
        url: string,
        excerpt: string, // NEW: Add excerpt from Tavily response
        published_date: string | null, // NEW: Add publication date
        author: string | null, // NEW: Add author if available
        relevance_score: number // NEW: Add relevance score from Tavily
      }>,
      citations_included: number, // NEW FIELD: count of citations in content
      research_query: string // NEW FIELD: query used for research
    }
    ```
- **Extend `api_costs` table (existing table from Story 3-1):**
  - **Table Schema:** `api_costs` table exists with columns: `id`, `organization_id`, `service`, `operation`, `cost`, `created_at`
  - **Tracking Pattern:** Follow exact pattern from Story 3-1 (`app/api/research/keywords/route.ts` lines 220-227)
  - **Example Implementation:**
    ```typescript
    await supabaseAdmin
      .from('api_costs' as any)
      .insert({
        organization_id: organizationId,
        service: 'tavily',
        operation: 'section_research', // Explicit operation value
        cost: 0.08, // $0.08 per query
      })
    ```
  - Track cost per section: $0.08 per query
  - Use service role client (`createServiceRoleClient()`) for inserts (bypasses RLS)

**Section Processor Integration:**
- **File:** `lib/services/article-generation/section-processor.ts` (modify existing)
- **Integration Point:** In `processSection()` function (line 32), before `generateSectionContent()` call (line 61)
- **Cache Key Normalization:** Normalize research query for cache lookup:
  ```typescript
  const normalizeQuery = (query: string): string => {
    return query.toLowerCase().trim().replace(/\s+/g, ' ')
  }
  ```
- **Flow:**
  1. Load section from outline (section topic, title)
  2. Generate research query (section topic + keyword + previous sections)
  3. Normalize query: `normalizeQuery(researchQuery)`
  4. Check cache: Query `tavily_research_cache` table (organization_id + normalized query + cached_until > NOW())
  5. If cache hit and not expired: Use cached results
  6. If cache miss or expired: Call Tavily API
  7. Store results in cache (24-hour TTL: `cached_until = NOW() + INTERVAL '24 hours'`)
  8. Select top 5-10 most relevant sources (by `score` field, descending)
  9. Pass research results to LLM content generation (Story 4a-5)
  10. Extend existing `research_sources` field in Section interface with additional properties (excerpt, published_date, author, relevance_score)
  11. Store research results in section metadata (`research_sources` field)
  12. Track API cost in `api_costs` table: `service: 'tavily'`, `operation: 'section_research'`, `cost: 0.08`

**Error Handling and Retry Logic:**
- **Retry Strategy:** Exponential backoff (1s, 2s, 4s delays), max 3 attempts per research query
- **Failure Handling:** If retry fails after 3 attempts: Log warning, continue without fresh research (use cached data if available), update article `error_details` JSONB with `research_failures` array, don't block article generation (graceful degradation)
- **Partial Failure Tracking:** Store in article `error_details` JSONB: `{ research_failures: [{ section_index, research_query, error_type, error_message, retry_attempts, failed_at }] }`

### Project Structure Notes

**New Files to Create:**
- `lib/services/tavily/tavily-client.ts` - Tavily API service client
- `lib/utils/citation-formatter.ts` - Citation formatting utilities
- `supabase/migrations/YYYYMMDDHHMMSS_add_tavily_research_cache.sql` - Cache table migration

**Files to Modify:**
- `lib/services/article-generation/section-processor.ts` - Add Tavily research integration
- `lib/inngest/functions/generate-article.ts` - May need updates for error handling
- `lib/supabase/database.types.ts` - Regenerate after migration

**Directory Structure Alignment:**
- Follow existing patterns from Story 3-1 (DataForSEO service structure)
- Services in `lib/services/` directory (create `tavily` subdirectory)
- Utilities in `lib/utils/` directory
- Migrations in `supabase/migrations/` directory

### Testing Requirements

**Unit Tests:**
- Test Tavily API client (mock API responses)
- Test research query generation (section topic + keyword + previous sections)
- Test citation formatting (in-text citations, reference lists)
- Test cache lookup and storage (24-hour TTL)
- Test source ranking and selection (top 5-10 by relevance)
- Test error handling and retry logic

**Integration Tests:**
- Test full flow: Section processing → Research query → Tavily API → Cache storage → Citation inclusion
- Test cache hit scenario (use cached results, don't call API)
- Test cache miss scenario (call API, store results)
- Test API cost tracking per section
- Test graceful degradation (continue without research if API fails)

**E2E Tests:**
- Test article generation includes Tavily research for each section
- Test citations are included in generated content
- Test research caching works correctly (24-hour TTL)
- Test error handling doesn't block article generation

**Test Files:**
- `tests/unit/services/tavily/tavily-client.test.ts`
- `tests/unit/utils/citation-formatter.test.ts`
- `tests/integration/article-generation/tavily-research.test.ts`
- `tests/e2e/article-generation/citations-included.spec.ts`

### Previous Story Intelligence

**Common Patterns Across Stories:**
- **Service Role Client:** Use `createServiceRoleClient()` for admin operations (cache, API costs) - bypasses RLS
- **Type Assertions:** Use `as any` with TODO comments until database types regenerated after migrations
- **Error Handling:** Retry with exponential backoff (1s, 2s, 4s), max 3 attempts, graceful degradation
- **Cache Keys:** Normalize (lowercase, trim, collapse whitespace) for consistent lookups

**Story 4a-2 (Section Processor):**
- **File:** `lib/services/article-generation/section-processor.ts` - `processSection()` function (line 32)
- **Section Interface:** Already defines `research_sources?: Array<{ title: string; url: string }>` (line 20) - extend this field
- **Integration Point:** Add Tavily research call before `generateSectionContent()` (line 61)
- **Metadata Storage:** Store in `sections` JSONB array, process sections sequentially

**Story 3-1 (API Cost Tracking Pattern):**
- **Reference:** `app/api/research/keywords/route.ts` lines 220-227
- **Pattern:** `service: 'tavily'`, `operation: 'section_research'`, `cost: 0.08`
- **Cache Pattern:** 24-hour TTL (vs 7-day for keyword research), normalized query lookup
- **Database Query:** Use `.single()` for single row queries, handle `PGRST116` error (no rows)

### Architecture Compliance

**Technology Stack:**
- **Framework:** Next.js 16.1.1 (App Router) - ✅ Already in use
- **Language:** TypeScript 5 - ✅ Already in use
- **Database:** Supabase PostgreSQL - ✅ Already in use
- **Queue System:** Inngest@^3.12.0 - ✅ Already configured (Story 4a-1)
- **External API:** Tavily API - ⚠️ New integration (API key required)

**Code Structure:**
- Inngest worker functions in `lib/inngest/functions/` directory
- Services in `lib/services/` directory (create `tavily` subdirectory)
- Utilities in `lib/utils/` directory
- API routes follow RESTful patterns (not applicable for this story - worker-based)

**Database Patterns:**
- JSONB for flexible schema (research results, section metadata)
- UUID primary keys
- `org_id` foreign key for multi-tenancy
- `created_at` and `updated_at` timestamps
- RLS policies for data isolation
- Indexes on foreign keys and frequently queried columns
- GIN indexes for JSONB columns (efficient queries)

**API Patterns:**
- Inngest event-driven architecture (not REST API)
- Worker functions process events asynchronously
- Status updates via database (not API responses)
- Error handling via status updates and logging
- External API calls from worker functions (Tavily API)

**Deployment Considerations:**
- **Platform:** Vercel (recommended for Next.js)
- **Inngest Workers:** Deploy via Inngest Cloud (workers auto-register via sync endpoint)
- **Environment Variables:**
  - **Production:** Configure in Vercel project settings → Environment Variables
  - **Development:** Use `.env.local` (gitignored)
  - **Required:** `TAVILY_API_KEY` (new), `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` (existing)
- **Local Development Setup:**
  - Run `npx inngest-cli dev` to start Inngest Dev Server
  - Workers sync automatically when dev server detects changes
  - Test workers locally before deploying
- **Production Deployment:**
  - Inngest sync endpoint (`/api/inngest/route.ts`) automatically registers workers
  - Workers execute in Inngest Cloud (not Vercel serverless functions)
  - Monitor worker execution in Inngest Dashboard
- **Performance Considerations:**
  - Tavily API calls: ~2-5 seconds per query (adds to section generation time)
  - Cache reduces API calls (24-hour TTL)
  - Sequential API calls (one per section) - don't parallelize (maintains coherence)
  - Total research time per article: ~5 queries × 3 seconds = ~15 seconds (acceptable for < 5min total)

### Library/Framework Requirements

**Tavily API:**
- **Documentation:** https://docs.tavily.com (verify latest API documentation)
- **Authentication:** API key via `Authorization: Bearer {TAVILY_API_KEY}` header
- **Rate Limits:** Check Tavily documentation for specific limits. Handle 429 errors with exponential backoff (1s, 2s, 4s), max 3 attempts. If rate limit persists, queue request for later processing.
- **Cost:** $0.08 per query (fixed rate)
- **SDK:** Check if Tavily provides Node.js SDK, otherwise use REST API with `fetch()` or `axios`

**Supabase:**
- Already configured
- Use existing client patterns (`lib/supabase/server.ts`)
- Regenerate types after migration
- Use service role client for admin operations

**Inngest:**
- Already installed (v3.12.0) from Story 4a-1
- Use `step` parameter for step-by-step execution
- Concurrency limit: 5 concurrent article generations (plan limit)
- Documentation: https://www.inngest.com/docs

### File Structure Requirements

**Migration File Naming:**
- Format: `YYYYMMDDHHMMSS_add_tavily_research_cache.sql`
- Example: `20260108120000_add_tavily_research_cache.sql`
- Place in: `supabase/migrations/`

**Service File Naming:**
- kebab-case for service files: `tavily-client.ts`
- PascalCase for exported classes/functions
- Descriptive names matching functionality

**Utility File Naming:**
- kebab-case for utility files: `citation-formatter.ts`
- Descriptive names matching functionality

### Implementation Checklist

**Pre-Implementation Setup:**
- [ ] Obtain Tavily API key from Tavily dashboard
- [ ] Add `TAVILY_API_KEY` to `.env.local` (development)
- [ ] Add `TAVILY_API_KEY` to Vercel project settings (production)
- [ ] Review Tavily API documentation for latest endpoint and authentication
- [ ] Review Story 4a-2 implementation (section processor pattern)
- [ ] Review Story 3-1 implementation (cache pattern, API cost tracking)

**Database Setup:**
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_tavily_research_cache.sql`
- [ ] Create `tavily_research_cache` table with all required columns
- [ ] Add indexes: `idx_tavily_cache_lookup`, `idx_tavily_cache_expiry`
- [ ] Add RLS policies for `tavily_research_cache` table (org members can read their org's cache)
- [ ] Test migration locally: `supabase db reset` or `supabase migration up`
- [ ] Regenerate database types: `supabase gen types typescript --project-id <id> > lib/supabase/database.types.ts`

**Tavily API Service:**
- [ ] Create `lib/services/tavily/tavily-client.ts`
- [ ] Implement Tavily API authentication (API key header)
- [ ] Implement `researchQuery()` function
- [ ] Implement research query generation (section topic + keyword + previous sections)
- [ ] Parse API response (extract sources, titles, URLs, excerpts, dates)
- [ ] Implement source ranking by relevance score
- [ ] Select top 5-10 most relevant sources
- [ ] Add error handling for API failures
- [ ] Test API integration with real Tavily API (use test API key)

**Section Processor Integration:**
- [ ] Modify `lib/services/article-generation/section-processor.ts` in `processSection()` function (before line 61)
- [ ] Implement cache key normalization function: `normalizeQuery(query: string): string`
- [ ] Add Tavily research call before `generateSectionContent()` call (line 61)
- [ ] Generate research query from section topic + keyword + previous sections (keep concise, 50-100 chars)
- [ ] Normalize query for cache lookup: `normalizeQuery(researchQuery)`
- [ ] Check cache before API call (query `tavily_research_cache` table with normalized query)
- [ ] Store research results in cache after API call (24-hour TTL: `cached_until = NOW() + INTERVAL '24 hours'`)
- [ ] Pass research results to LLM content generation (Story 4a-5 dependency - placeholder for now)
- [ ] Extend existing `research_sources` field in Section interface (line 20) with additional properties
- [ ] Store research results in section metadata (`research_sources` field with excerpt, published_date, author, relevance_score)
- [ ] Update section metadata with `citations_included` count and `research_query`

**Citation Formatting:**
- [ ] Create `lib/utils/citation-formatter.ts`
- [ ] Implement in-text citation formatting: "According to [Source Title](URL)..."
- [ ] Implement reference list formatting (optional, at end of section)
- [ ] Include author, title, URL, date when available
- [ ] Ensure at least 1-2 citations per section (aim for 2-3)
- [ ] Implement async URL validation with 5-second timeout (non-blocking)
- [ ] Validate citation URLs are accessible (HTTP 200 response) but continue even if validation fails
- [ ] Handle broken links gracefully (include citation but note if link fails)
- [ ] Log validation failures for monitoring but don't prevent citation inclusion

**API Cost Tracking:**
- [ ] Track Tavily API costs per section in `api_costs` table using service role client
- [ ] Use exact pattern from Story 3-1: `service: 'tavily'`, `operation: 'section_research'`, `cost: 0.08`
- [ ] Insert cost record after successful API call (before storing in cache)
- [ ] Track total costs per article (sum of all section costs) - calculate from `api_costs` table queries

**Error Handling and Retry Logic:**
- [ ] Implement retry mechanism with exponential backoff (1s, 2s, 4s delays)
- [ ] Max attempts: 3 per research query
- [ ] Graceful degradation: Continue without fresh research if retry fails
- [ ] Log warning: "Section generated without fresh Tavily research"
- [ ] Update article `error_details` with research failures
- [ ] Preserve completed sections even if research fails
- [ ] Test retry logic with simulated API failures

**Testing:**
- [ ] Unit tests: Tavily API client (mock API responses)
- [ ] Unit tests: Research query generation
- [ ] Unit tests: Citation formatting
- [ ] Unit tests: Cache lookup and storage
- [ ] Unit tests: Source ranking and selection
- [ ] Unit tests: Error handling and retry logic
- [ ] Integration tests: Full flow (section → research → cache → citation)
- [ ] Integration tests: Cache hit scenario
- [ ] Integration tests: Cache miss scenario
- [ ] Integration tests: API cost tracking
- [ ] Integration tests: Graceful degradation
- [ ] E2E tests: Article generation includes Tavily research
- [ ] E2E tests: Citations included in generated content
- [ ] E2E tests: Research caching works correctly

**Post-Implementation:**
- [ ] Remove type assertions (`as any`) after database type regeneration
- [ ] Verify citations are included in generated content (at least 1-2 per section)
- [ ] Verify research caching works correctly (24-hour TTL)
- [ ] Verify API cost tracking is accurate ($0.08 per query)
- [ ] Verify error handling doesn't block article generation
- [ ] Performance test: Research adds ~15 seconds per article (acceptable for < 5min total)
- [ ] Verify citation URLs are accessible (HTTP 200 response)

### References

- **Epic 4A Details:** `_bmad-output/epics.md` (lines 2357-2412)
- **Story 4a-1:** `_bmad-output/implementation-artifacts/4a-1-article-generation-initiation-and-queue-setup.md`
- **Story 4a-2:** `_bmad-output/implementation-artifacts/4a-2-section-by-section-architecture-and-outline-generation.md`
- **Story 3-1:** `_bmad-output/implementation-artifacts/3-1-keyword-research-interface-and-dataforseo-integration.md`
- **Architecture:** `_bmad-output/architecture.md`
- **PRD:** `_bmad-output/prd.md` (Tavily integration requirements, lines 48-52, 1182-1183)
- **Database Schema:** `infin8content/supabase/migrations/20260108082354_add_article_outline_columns.sql`
- **Section Processor:** `infin8content/lib/services/article-generation/section-processor.ts`
- **Inngest Worker:** `infin8content/lib/inngest/functions/generate-article.ts`
- **Tavily API Documentation:** https://docs.tavily.com (verify latest)
- **UX Design:** `_bmad-output/ux-design-specification.md` (citation requirements)

## Dev Agent Record

### Agent Model Used

Composer (Cursor AI)

### Debug Log References

- Tavily API integration tests pass (10/10 tests)
- Section processor tests pass with graceful degradation for cache lookup failures (expected in test mocks)
- All error handling paths tested and working correctly

### Completion Notes List

**Task 1: Tavily API Service Integration**
- Created `lib/services/tavily/tavily-client.ts` with full API integration
- Implemented authentication via `TAVILY_API_KEY` environment variable
- Implemented `researchQuery()` function with retry logic (exponential backoff: 1s, 2s, 4s delays, max 3 attempts)
- Source ranking by relevance score (descending order)
- Selects top 5-10 most relevant sources automatically
- Comprehensive error handling for API failures (401, 429, 500, network errors)
- All unit tests passing (10/10)

**Task 2: Section Processor Integration**
- Modified `lib/services/article-generation/section-processor.ts` to integrate Tavily research
- Extended `Section` interface to include extended `research_sources` field with excerpt, published_date, author, relevance_score
- Added `citations_included` and `research_query` fields to Section interface
- Research query generation from section topic + keyword + previous sections (concise, 50-100 chars)
- Cache lookup before API call (normalized query, 24-hour TTL)
- Research results stored in section metadata
- Research sources passed to `generateSectionContent()` for Story 4a-5 citation inclusion
- Graceful degradation: Continues without fresh research if API fails (logs warning, updates article error_details)

**Task 3: Citation Formatting**
- Created `lib/utils/citation-formatter.ts` with comprehensive citation utilities
- In-text citation formatting: "According to [Source Title](URL)..."
- Reference list formatting with author and date when available
- URL validation with 5-second timeout (non-blocking)
- Citation formatting ready for Story 4a-5 to use when generating content

**Task 4: Research Result Caching**
- Created migration: `supabase/migrations/20260108092044_add_tavily_research_cache.sql`
- Cache table with normalized query lookup (case-insensitive, trimmed)
- 24-hour TTL (`cached_until` timestamp)
- Composite index for efficient cache lookups
- Partial index for expired cache entries (cleanup)
- RLS policies for organization-level access control
- Cache check before API call, store after successful API call

**Task 5: API Cost Tracking**
- Integrated API cost tracking in section processor
- Tracks costs per section: `service: 'tavily'`, `operation: 'section_research'`, `cost: 0.08`
- Uses service role client for inserts (bypasses RLS)
- Cost tracking failures don't block article generation (graceful degradation)

**Task 6: Error Handling and Retry Logic**
- Retry logic implemented in Tavily client (exponential backoff, max 3 attempts)
- Graceful degradation: Continues without fresh research if retry fails
- Warning logged: "Section generated without fresh Tavily research"
- Article `error_details` JSONB updated with research failures array
- Completed sections preserved even if research fails

**Code Review Fixes Applied (2025-01-08):**
- Added unique constraint on `tavily_research_cache` table (organization_id, research_query) for upsert operations
- Fixed cache lookup query to use `.ilike()` for case-insensitive matching to optimize index usage
- Fixed research query generation to include previous sections context (extracts key terms from summaries)
- Added partial index `idx_tavily_cache_expiry` for efficient expired cache cleanup
- Created integration tests: `tests/integration/article-generation/tavily-research.test.ts`
- Created citation formatter unit tests: `tests/unit/utils/citation-formatter.test.ts`
- All HIGH and MEDIUM severity issues from code review resolved

**Code Review Fixes Applied (2026-01-09):**
- Fixed integration tests failing due to Story 4a-5 dependencies
- Added missing mocks: `estimateTokens` in token-management mock
- Added OpenRouter client mock (`generateContent`)
- Added content-quality utils mocks (`validateContentQuality`, `countCitations`)
- Added citation-formatter mock (`formatCitationsForMarkdown`)
- Updated `validateContentQuality` mock to return proper structure (`passed`, `metrics`, `errors`)
- All 10 integration tests now passing (10/10)
- All 44 tests passing total (Tavily client: 10, Citation formatter: 24, Integration: 10)

### File List

**New Files Created:**
- `lib/services/tavily/tavily-client.ts` - Tavily API service client
- `lib/utils/citation-formatter.ts` - Citation formatting utilities
- `supabase/migrations/20260108092044_add_tavily_research_cache.sql` - Cache table migration (with unique constraint and partial index)
- `tests/unit/services/tavily/tavily-client.test.ts` - Tavily client unit tests
- `tests/integration/article-generation/tavily-research.test.ts` - Tavily research integration tests
- `tests/unit/utils/citation-formatter.test.ts` - Citation formatter unit tests

**Files Modified:**
- `lib/services/article-generation/section-processor.ts` - Integrated Tavily research, extended Section interface, added cache lookup (with ilike for index matching), research query generation (includes previous sections), API cost tracking, error handling
- `_bmad-output/sprint-status.yaml` - Updated story status to "in-progress" then "review"

