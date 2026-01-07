# Story 4a.5: LLM Content Generation with OpenRouter Integration - Context

**Status:** ready-for-dev  
**Priority:** P0 (MVP - Core value delivery)  
**Epic:** Epic 4A - Article Generation Core

---

## Quick Summary

**User Story:**
As the system, I want to generate article content using LLMs via OpenRouter, so that I can create high-quality, SEO-optimized long-form content.

**Core Functionality:**
- Generate section content (300-800 words) using OpenRouter API with free models
- Integrate Tavily research citations naturally in content
- Validate content quality (word count, citations, headings, keyword, readability)
- Retry logic for API failures (3 attempts with exponential backoff)
- Track API costs per section ($0.00 for free models)
- Sequential section generation with progress tracking

---

## Acceptance Criteria (Condensed)

1. **Content Generation:**
   - Call OpenRouter API with comprehensive prompt (section topic, research, SERP insights, keyword, previous summaries)
   - Generate 300-800 words per section with proper heading structure (H2, H3)
   - Include citations naturally (not all at end) - minimum 1-2 per section
   - Optimize for keyword naturally (avoid keyword stuffing)

2. **Quality Validation:**
   - Word count within 10% variance of target
   - Citations properly formatted (markdown links)
   - Heading structure correct (H2/H3 present)
   - Keyword appears naturally
   - Readability score calculated (Flesch-Kincaid)
   - Regenerate if quality fails (1 retry)

3. **Error Handling:**
   - Retry on API failures (3 attempts, exponential backoff: 1s, 2s, 4s)
   - Handle 401 (no retry), 429 (retry), 500 (retry), network errors (retry)
   - Set section status to "failed" if retries exhausted
   - Preserve completed sections even if generation fails

4. **Cost Tracking:**
   - Track API costs per section in `api_costs` table
   - Cost: $0.00 per section (free models)
   - Track token usage for monitoring

---

## Critical Technical Requirements

### OpenRouter API Integration

**API Endpoint:** `https://openrouter.ai/api/v1/chat/completions`

**Authentication:**
```typescript
headers: {
  "Authorization": "Bearer {OPENROUTER_API_KEY}",
  "Content-Type": "application/json",
  "HTTP-Referer": "{your-site-url}", // Optional
  "X-Title": "{your-app-name}" // Optional
}
```

**Request Format:**
```typescript
{
  model: string, // e.g., "tns-standard/tns-standard-8-7.5-chimera"
  messages: Array<{
    role: "system" | "user" | "assistant",
    content: string
  }>,
  max_tokens: number, // ~2000 for section content
  temperature: number, // 0.7-0.9 for creative content
  top_p: number, // 0.9-1.0
  frequency_penalty: number, // 0.0-0.5
  presence_penalty: number // 0.0-0.5
}
```

**Model Selection (Free Models):**
- **Default:** `tns-standard/tns-standard-8-7.5-chimera` (primary choice)
- **Backup:** `meta-llama/llama-3bmo-v1-turbo` (fast inference)
- **High Quality:** `nvidia/nemotron-3-demo-70b` (larger model)
- **Fallback Chain:** TNS Standard → Llama 3BMo → Nemotron

**Response Format:**
```typescript
{
  id: string,
  model: string,
  choices: Array<{
    message: { role: "assistant", content: string },
    finish_reason: "stop" | "length" | "content_filter"
  }>,
  usage: {
    prompt_tokens: number,
    completion_tokens: number,
    total_tokens: number
  }
}
```

**Error Handling:**
- HTTP 401: Invalid API key → Log error, don't retry
- HTTP 429: Rate limit → Retry with exponential backoff (1s, 2s, 4s), max 3 attempts
- HTTP 500: Server error → Retry with exponential backoff
- Network errors → Retry with exponential backoff

**Cost:** $0.00 per section (all models are free via OpenRouter)

### Prompt Construction

**System Message:**
```
You are an expert SEO content writer creating a section for a long-form article.
Write engaging, informative content that naturally incorporates citations and optimizes for SEO.
Use proper heading structure (H2, H3) and maintain a professional yet conversational tone.
```

**User Message Structure:**
1. Section Context: Title, type, target word count
2. Research Sources: Tavily research with titles, URLs, excerpts
3. SERP Insights: Common topics, content gaps, heading patterns (if available)
4. Keyword Focus: Primary keyword, related keywords, SEO requirements
5. Previous Context: Summary of previous sections (~1,500 tokens)
6. Writing Requirements: Style, tone, target audience

**Token Budget:**
- System message: ~200 tokens
- Section context: ~300 tokens
- Research sources: ~1,000 tokens (5-10 sources)
- SERP insights: ~500 tokens (if available)
- Keyword focus: ~200 tokens
- Previous context: ~1,500 tokens
- Writing requirements: ~200 tokens
- **Total prompt:** ~3,900 tokens
- **Response budget:** ~2,000 tokens (for 300-800 word section)
- **Total context:** ~6,000 tokens (within free model context windows)

### Citation Integration

**In-Text Citations:**
- Format: `According to [Source Title](URL), ...`
- Format: `[Source Title](URL) reports that...`
- Place citations naturally within content (not all at end)
- Minimum 1-2 citations per section (aim for 2-3 for better EEAT)

**Reference List (Optional):**
```
## References
- [Source Title](URL) - Author Name (Date)
```

### Content Quality Validation

**Checks Required:**
1. Word count: Within 10% variance of target (e.g., 270-880 for 300-800 target)
2. Citations: At least 1-2 citations, properly formatted (markdown links)
3. Heading structure: H2/H3 headings present (for H2/H3 sections)
4. Keyword: Appears naturally (not forced, not keyword stuffing)
5. Readability: Flesch-Kincaid score calculated (target > 60)

**Quality Metrics Storage:**
```typescript
{
  word_count: number,
  citations_included: number,
  readability_score: number,
  keyword_density: number,
  quality_passed: boolean,
  quality_retry_count: number
}
```

**Regeneration:** If quality checks fail, regenerate section once (1 retry) before marking as failed

### Section Processor Integration

**File:** `lib/services/article-generation/section-processor.ts`

**Integration Point:** Replace `generateSectionContent()` function (line 422) with OpenRouter API call

**Flow:**
1. Load section from outline (section topic, title)
2. Load Tavily research results (already in `researchSources` parameter from Story 4a-3)
3. Load SERP analysis insights (if available, from Story 4a-4 - optional)
4. Construct comprehensive prompt (system + user messages)
5. Call OpenRouter API with prompt
6. Parse response (extract content, token usage, model used)
7. Validate content quality (word count, citations, headings, keyword, readability)
8. If quality fails: Regenerate (1 retry)
9. Integrate citations naturally in content (using citation formatter from Story 4a-3)
10. Store generated content in section metadata
11. Track API cost in `api_costs` table: `service: 'openrouter'`, `operation: 'section_generation'`, `cost: 0.00`
12. Update section metadata with quality metrics

### API Cost Tracking

**Pattern:** Follow Story 3-1 (DataForSEO cost tracking)

**Implementation:**
```typescript
await supabaseAdmin
  .from('api_costs' as any)
  .insert({
    organization_id: organizationId,
    service: 'openrouter',
    operation: 'section_generation',
    cost: 0.00, // Always $0.00 for free models
    metadata: {
      model: modelUsed,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens
    }
  })
```

**Use Service Role Client:** Bypass RLS for cost tracking inserts

---

## Key Patterns to Follow

### OpenRouter Service Pattern
```typescript
// lib/services/openrouter/openrouter-client.ts
export async function generateContent(params: {
  sectionTitle: string,
  sectionType: string,
  targetWordCount: number,
  researchSources: TavilySource[],
  serpInsights?: SerpInsights,
  keyword: string,
  relatedKeywords: string[],
  previousSummaries: string,
  writingStyle: string,
  targetAudience: string
}): Promise<{
  content: string,
  model: string,
  usage: { prompt_tokens: number, completion_tokens: number, total_tokens: number }
}> {
  // Model selection with fallback chain
  const models = [
    'tns-standard/tns-standard-8-7.5-chimera',
    'meta-llama/llama-3bmo-v1-turbo',
    'nvidia/nemotron-3-demo-70b'
  ]
  
  // Construct prompt
  const systemMessage = `...`
  const userMessage = `...`
  
  // Retry logic with exponential backoff
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: models[attempt % models.length],
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key')
        }
        if (response.status === 429) {
          // Rate limit - wait and retry
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
          continue
        }
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: data.usage
      }
    } catch (error) {
      if (attempt === 2) throw error
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
}
```

### Quality Validation Pattern
```typescript
// lib/utils/content-quality.ts
import { calculateReadability } from 'textstat' // or similar library

export function validateContentQuality(
  content: string,
  targetWordCount: number,
  keyword: string
): {
  passed: boolean,
  metrics: {
    word_count: number,
    citations_included: number,
    readability_score: number,
    keyword_density: number
  }
} {
  const wordCount = content.split(/\s+/).length
  const wordCountVariance = Math.abs(wordCount - targetWordCount) / targetWordCount
  
  // Extract citations (markdown links)
  const citationRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const citations = content.match(citationRegex) || []
  
  // Check heading structure
  const hasH2 = /^##\s+.+$/m.test(content)
  const hasH3 = /^###\s+.+$/m.test(content)
  
  // Calculate keyword density
  const keywordMatches = content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []
  const keywordDensity = keywordMatches.length / wordCount
  
  // Calculate readability
  const readabilityScore = calculateReadability(content)
  
  const passed = 
    wordCountVariance <= 0.1 && // Within 10% variance
    citations.length >= 1 && // At least 1 citation
    (hasH2 || hasH3) && // Has headings
    keywordDensity > 0 && keywordDensity < 0.05 && // Natural keyword density
    readabilityScore > 60 // Readability target
  
  return {
    passed,
    metrics: {
      word_count: wordCount,
      citations_included: citations.length,
      readability_score: readabilityScore,
      keyword_density: keywordDensity
    }
  }
}
```

### Citation Integration Pattern
```typescript
// Reuse from Story 4a-3: lib/utils/citation-formatter.ts
import { formatCitations } from '@/lib/utils/citation-formatter'

// In section processor:
const contentWithCitations = formatCitations(
  generatedContent,
  researchSources,
  { style: 'natural', includeReferenceList: true }
)
```

### Error Handling Pattern
```typescript
try {
  const generatedContent = await generateContent(...)
  const quality = validateContentQuality(generatedContent.content, targetWordCount, keyword)
  
  if (!quality.passed) {
    // Retry once
    const retryContent = await generateContent(...)
    const retryQuality = validateContentQuality(retryContent.content, targetWordCount, keyword)
    
    if (!retryQuality.passed) {
      throw new Error('Content quality validation failed after retry')
    }
    return retryContent
  }
  
  return generatedContent
} catch (error) {
  // Update article error_details
  await updateArticleErrorDetails(articleId, sectionIndex, error)
  throw error
}
```

---

## Existing Infrastructure to Reuse

### From Story 4a-3 (Tavily Research)
- ✅ `lib/utils/citation-formatter.ts` - Citation formatting utilities
- ✅ `lib/services/tavily/tavily-client.ts` - Research source structure (`TavilySource`)
- ✅ Research sources already available in `processSection()` function

### From Story 4a-2 (Section Processor)
- ✅ `lib/services/article-generation/section-processor.ts` - Section processing infrastructure
- ✅ `generateSectionContent()` placeholder function (line 422) - Replace with OpenRouter call
- ✅ Section metadata structure (`Section` interface)
- ✅ Token management utilities (`summarizeSections`, `fitInContextWindow`)

### From Story 3-1 (API Cost Tracking)
- ✅ `api_costs` table structure
- ✅ Service role client pattern for cost tracking
- ✅ Cost tracking function pattern

### From Story 4a-1 (Article Queue)
- ✅ Inngest worker infrastructure (`lib/inngest/functions/generate-article.ts`)
- ✅ Article status tracking
- ✅ Error details JSONB field

---

## File Structure

**New Files:**
```
lib/services/openrouter/openrouter-client.ts    # OpenRouter API service client
lib/utils/content-quality.ts                    # Content quality validation utilities
```

**Files to Modify:**
```
lib/services/article-generation/section-processor.ts  # Replace generateSectionContent() placeholder
lib/inngest/functions/generate-article.ts           # May need updates for error handling
```

**Environment Variables:**
```
OPENROUTER_API_KEY=<your-api-key>  # Required: Add to .env.local and Vercel
```

---

## Critical Implementation Notes

### Setup Steps
1. Obtain OpenRouter API key from OpenRouter dashboard
2. Add `OPENROUTER_API_KEY` to `.env.local` (dev) and Vercel (prod)
3. Install readability library: `npm install textstat` (or similar)
4. Create OpenRouter service client
5. Replace `generateSectionContent()` placeholder in section-processor.ts
6. Integrate citation formatting from Story 4a-3
7. Implement quality validation
8. Test with real OpenRouter API

### Common Gotchas
- **Prompt Construction:** Must include all context: research, SERP insights, previous summaries, keyword focus
- **Token Limits:** Each section must fit within context window (account for prompt + research + previous summaries + new content)
- **Citations:** Must be integrated naturally in content, not all at end (better EEAT compliance)
- **Quality Validation:** Must happen before storing section (regenerate if fails)
- **API Cost Tracking:** Must happen per section, not per article (for accurate billing)
- **Model Selection:** Default to TNS Standard (free), implement fallback chain for availability
- **Previous Summaries:** Must be concise (~1,500 tokens) to fit within context window
- **Free Models:** May have rate limits - implement exponential backoff and fallback chain
- **Model Availability:** May vary - always have backup models ready

### Performance Considerations
- OpenRouter API calls: ~5-15 seconds per section
- Sequential API calls (one per section) - don't parallelize (maintains coherence)
- Total generation time per article: ~5 sections × 10 seconds = ~50 seconds (acceptable for < 5min total)
- Quality validation adds ~1-2 seconds per section (readability calculation)

### Testing Requirements
- Unit tests: OpenRouter client, quality validation, citation formatting
- Integration tests: Full flow (section → OpenRouter → quality → citation)
- Integration tests: Quality retry scenario
- Integration tests: API cost tracking
- Integration tests: Error handling doesn't block article generation
- E2E tests: Article generation includes OpenRouter content
- E2E tests: Citations included in generated content
- E2E tests: Content quality meets requirements

---

## Dependencies

**Previous Stories:**
- Story 4a-1: Article queuing infrastructure ✅ Complete
- Story 4a-2: Section-by-section architecture ✅ Complete (section processor exists)
- Story 4a-3: Tavily research integration ✅ Complete (research sources available)
- Story 4a-4: SERP analysis (optional - enhances content but not required)

**Next Stories:**
- Story 4a-6: Real-time progress tracking (needs actual content generation to track)

---

## Quick Reference

**OpenRouter Service:** `lib/services/openrouter/openrouter-client.ts`  
**Section Processor:** `lib/services/article-generation/section-processor.ts` (modify existing)  
**Citation Formatter:** `lib/utils/citation-formatter.ts` (reuse from Story 4a-3)  
**Quality Validator:** `lib/utils/content-quality.ts`  
**Cost Tracking:** `api_costs` table (extend existing)  
**Env Var:** `OPENROUTER_API_KEY`  
**Cost per Section:** $0.00 (free models)  
**Retry Attempts:** 3 with exponential backoff (1s, 2s, 4s)  
**Quality Retry:** 1 retry if quality checks fail  
**Model Default:** `tns-standard/tns-standard-8-7.5-chimera`  
**Fallback Models:** `meta-llama/llama-3bmo-v1-turbo`, `nvidia/nemotron-3-demo-70b`

---

*This context file provides essential information for implementing Story 4a.5. For complete details, see the full story file: `4a-5-llm-content-generation-with-openrouter-integration.md`*

