# Story 38.1 → 38.2 Handoff: Producer–Consumer Contract

**Date**: 2026-02-02  
**Status**: ✅ **GOVERNANCE FREEZE - IMMUTABLE CONTRACT**  
**Scope**: Documents all durable producer guarantees from Story 38.1 (Planner) for Story 38.2 (Research/Progress Tracking)

---

## Executive Summary

Story 38.1 introduces a **deterministic, validated article structure** that becomes the foundation for all downstream work. This document freezes that contract to prevent regressions and enable safe consumption by Story 38.2 and beyond.

**Producer (Story 38.1)**: Planner Agent + Compiler  
**Consumer (Story 38.2)**: Research Agent + Progress Tracking  
**Boundary**: `articles.article_structure` (JSONB field)

---

## Producer Guarantees (Story 38.1)

### ✅ What Story 38.1 Produces

1. **Deterministic Article Structure**
   - Raw planner output is **always** compiled before persistence
   - Compiler validates all business rules (≥2 research questions, ≥2 supporting points, 2000-4000 words)
   - Invalid output is **rejected**, never patched
   - Metadata is **injected** (section_id, section_order)

2. **Immutable Semantics**
   - Article titles, section headers, research questions, supporting points are **never altered**
   - Only execution metadata is added
   - Content structure is preserved exactly as LLM generated

3. **Section-Level Execution Unit**
   - Each section is independently executable
   - Sections have unique identifiers (`section_id` as UUID)
   - Sections have deterministic ordering (`section_order` as 0-indexed integer)

4. **Guaranteed Article Statuses**
   - `queued`: Article created, awaiting planner execution
   - `planned`: Article structure successfully compiled and persisted
   - `planner_failed`: Planner or compiler failed; article is retryable
   - (Future: `research_in_progress`, `research_complete`, `writing_in_progress`, `written`, `published`)

5. **Failure Semantics**
   - If planner fails: article marked `planner_failed` with `error_details` containing error message and timestamp
   - Inngest automatically retries failed articles
   - Other articles continue processing (partial failure tolerance)

---

## Data Structures (Immutable Contract)

### Article Structure (Persisted to `articles.article_structure`)

```typescript
interface CompiledArticleStructure {
  article_title: string
  content_style: 'informative' | 'listicle'
  target_keyword: string
  semantic_keywords: string[]
  article_structure: Section[]
  total_estimated_words: number
}

interface Section {
  section_id: string                    // UUID, unique identifier
  section_order: number                 // 0-indexed, sequential
  section_type: 'intro' | 'main' | 'section' | 'conclusion'
  header: string
  supporting_points: string[]           // ≥2 items (validated)
  research_questions: string[]          // ≥2 items (validated)
  supporting_elements: string
  estimated_words: number
}
```

### Example: Compiled Article Structure

```json
{
  "article_title": "The Complete Guide to SEO Optimization in 2026",
  "content_style": "informative",
  "target_keyword": "SEO optimization",
  "semantic_keywords": [
    "search engine optimization",
    "on-page SEO",
    "technical SEO",
    "link building",
    "SEO best practices"
  ],
  "article_structure": [
    {
      "section_id": "550e8400-e29b-41d4-a716-446655440000",
      "section_order": 0,
      "section_type": "intro",
      "header": "Introduction: Why SEO Optimization Matters in 2026",
      "supporting_points": [
        "SEO drives 53% of all website traffic",
        "Algorithm changes require continuous optimization"
      ],
      "research_questions": [
        "What are the latest Google algorithm updates in 2026?",
        "How have user search behaviors changed?"
      ],
      "supporting_elements": "Statistics, industry trends",
      "estimated_words": 300
    },
    {
      "section_id": "550e8400-e29b-41d4-a716-446655440001",
      "section_order": 1,
      "section_type": "main",
      "header": "On-Page SEO: Optimizing Your Content",
      "supporting_points": [
        "Keyword placement in title, meta description, and headers",
        "Content structure and readability for both users and search engines"
      ],
      "research_questions": [
        "What is the optimal keyword density in 2026?",
        "How do search engines evaluate content quality?"
      ],
      "supporting_elements": "Examples, case studies",
      "estimated_words": 600
    },
    {
      "section_id": "550e8400-e29b-41d4-a716-446655440002",
      "section_order": 2,
      "section_type": "conclusion",
      "header": "Conclusion: Implementing Your SEO Strategy",
      "supporting_points": [
        "Create an action plan based on your current SEO audit",
        "Monitor performance and adjust tactics quarterly"
      ],
      "research_questions": [
        "What are the best SEO tools for 2026?",
        "How should businesses prioritize SEO improvements?"
      ],
      "supporting_elements": "Actionable checklist",
      "estimated_words": 200
    }
  ],
  "total_estimated_words": 2800
}
```

### Article Status Transitions

```
queued
  ↓ (Inngest: article.generate.planner)
planned (article_structure persisted)
  ↓ (Story 38.2: Research Agent)
research_in_progress (section-by-section research)
  ↓
research_complete (all sections researched)
  ↓ (Story 39.2: Writer Agent)
writing_in_progress (section-by-section writing)
  ↓
written (all sections written)
  ↓ (Manual approval)
published

FAILURE PATH:
queued → planner_failed (error_details populated)
  ↓ (Inngest retry)
queued (retry)
```

---

## Article Statuses: Complete Semantics

| Status | Meaning | Set By | Next State | Retryable |
|---|---|---|---|---|
| `queued` | Article created, awaiting planner | Story 38.1 (Queuing) | `planned` or `planner_failed` | Yes |
| `planned` | Article structure compiled and persisted | Story 38.1 (Planner) | `research_in_progress` | No |
| `planner_failed` | Planner or compiler failed | Story 38.1 (Error handler) | `queued` (retry) | Yes |
| `research_in_progress` | Research Agent processing sections | Story 38.2 (Research) | `research_complete` | Yes |
| `research_complete` | All sections researched | Story 38.2 (Research) | `writing_in_progress` | No |
| `writing_in_progress` | Writer Agent processing sections | Story 39.2 (Writer) | `written` | Yes |
| `written` | All sections written | Story 39.2 (Writer) | `published` | No |
| `published` | Article published | Manual approval | (final) | No |

---

## Section-Level Execution Model

### What This Means for Story 38.2 (Research Agent)

1. **Each section is independent**
   - Research Agent processes one section at a time
   - Sections can be researched in parallel (with concurrency limits)
   - Failure in one section does not block others

2. **Section Identity**
   - `section_id` is the unique identifier for tracking research progress
   - `section_order` determines logical reading order (not execution order)
   - Use `section_id` to store research results, not `section_order`

3. **Research Input per Section**
   - `header`: The section title to research
   - `research_questions`: Specific questions to answer
   - `target_keyword`: From parent article
   - `semantic_keywords`: From parent article

4. **Research Output per Section**
   - Research results stored in `articles.sections` table (new, Story 38.2)
   - Links back to article via `article_id`
   - Links back to section via `section_id`
   - Contains: sources, citations, key findings, statistics

---

## Forbidden Actions (Story 38.2 Must NOT Do)

### ❌ DO NOT Modify `article_structure`

```typescript
// FORBIDDEN
article.article_structure.article_structure[0].header = "New Header"
article.article_structure.total_estimated_words = 5000
```

**Why**: Breaks the contract. Headers and word counts are validated by the compiler.

### ❌ DO NOT Re-Run Planner

```typescript
// FORBIDDEN
const newPlannerOutput = await runPlannerAgent(input)
```

**Why**: Planner is Story 38.1's responsibility. Story 38.2 consumes, not produces.

### ❌ DO NOT Infer Missing Data

```typescript
// FORBIDDEN
if (!section.research_questions) {
  section.research_questions = ["Inferred question"]
}
```

**Why**: If data is missing, it's a failure. Treat it as such.

### ❌ DO NOT Reorder Sections

```typescript
// FORBIDDEN
const reordered = article.article_structure.article_structure.sort(...)
```

**Why**: `section_order` is deterministic. Reordering breaks the contract.

### ❌ DO NOT Skip Sections

```typescript
// FORBIDDEN
const sections = article.article_structure.article_structure.filter(s => s.estimated_words > 500)
```

**Why**: All sections must be researched. Skipping breaks completeness.

### ❌ DO NOT Modify Semantic Keywords

```typescript
// FORBIDDEN
article.article_structure.semantic_keywords.push("new keyword")
```

**Why**: Keywords are validated by the compiler. Story 38.2 reads, not writes.

---

## What Story 38.2 CAN Do

### ✅ Read and Process

```typescript
// ALLOWED
const sections = article.article_structure.article_structure
for (const section of sections) {
  const research = await researchSection(section)
  // Store research results in articles.sections table
}
```

### ✅ Track Progress

```typescript
// ALLOWED
article.status = 'research_in_progress'
article.updated_at = new Date()
// Update progress tracking table
```

### ✅ Store Research Results

```typescript
// ALLOWED
const researchResult = {
  article_id: article.id,
  section_id: section.section_id,
  research_data: {...},
  sources: [...],
  citations: [...]
}
// Insert into articles.sections table
```

### ✅ Handle Failures

```typescript
// ALLOWED
if (researchFailed) {
  article.status = 'research_failed'
  article.error_details = { error_message, failed_at, stage: 'research' }
}
```

---

## Guardrails: Enforcing the Contract

### Unit Test: Verify Compiler Output Shape

```typescript
it('compiled article_structure must have all required fields', () => {
  const compiled = compilePlannerOutput(mockPlannerOutput)
  
  expect(compiled).toHaveProperty('article_title')
  expect(compiled).toHaveProperty('article_structure')
  expect(compiled.article_structure).toBeInstanceOf(Array)
  
  compiled.article_structure.forEach(section => {
    expect(section).toHaveProperty('section_id')
    expect(section).toHaveProperty('section_order')
    expect(section.research_questions.length).toBeGreaterThanOrEqual(2)
    expect(section.supporting_points.length).toBeGreaterThanOrEqual(2)
  })
})
```

### Integration Test: Verify Persistence

```typescript
it('persisted article_structure must match compiled output', async () => {
  const article = await supabase
    .from('articles')
    .select('article_structure')
    .eq('id', articleId)
    .single()
  
  expect(article.data.article_structure).toEqual(compiledOutput)
})
```

### Regression Test: Prevent Planner Re-Run

```typescript
it('Story 38.2 must NOT call runPlannerAgent', () => {
  const source = fs.readFileSync('lib/agents/research-agent.ts', 'utf-8')
  expect(source).not.toContain('runPlannerAgent')
})
```

---

## Failure Scenarios and Recovery

### Scenario 1: Planner Fails

**What Happens**:
1. Planner Agent throws error
2. Inngest catches error, marks article as `planner_failed`
3. `error_details` populated with error message and timestamp
4. Inngest automatically retries (exponential backoff)

**Story 38.2 Responsibility**: None. Wait for retry or manual intervention.

### Scenario 2: Compiler Rejects Output

**What Happens**:
1. Compiler throws error (e.g., "Insufficient research_questions")
2. Inngest catches error, marks article as `planner_failed`
3. Article remains in `planner_failed` state until retry

**Story 38.2 Responsibility**: None. Do not attempt to patch.

### Scenario 3: Research Fails for One Section

**What Happens**:
1. Story 38.2 Research Agent fails on section
2. Story 38.2 marks article as `research_failed`
3. Other sections continue (partial failure tolerance)
4. Manual intervention or retry needed

**Story 38.2 Responsibility**: Mark article status, store error details, enable retry.

---

## Key Metrics and Monitoring

### For Story 38.1 (Planner)

- **Planner success rate**: % of articles reaching `planned` status
- **Compiler rejection rate**: % of planner outputs rejected by compiler
- **Average article structure size**: Sections per article, words per article
- **Planner latency**: Time from `queued` to `planned`

### For Story 38.2 (Research)

- **Research success rate**: % of articles reaching `research_complete`
- **Section research latency**: Time per section
- **Research failure rate**: % of sections failing research
- **Retry success rate**: % of retried articles succeeding

---

## Testing Requirements for Story 38.2

### Must Test

1. ✅ Read `article_structure` without modification
2. ✅ Process sections in `section_order` (or parallel with concurrency)
3. ✅ Store research results with `section_id` linkage
4. ✅ Handle missing or invalid `article_structure` gracefully
5. ✅ Update article status to `research_in_progress` and `research_complete`
6. ✅ Mark articles as `research_failed` on error
7. ✅ Enable retry for failed articles

### Must NOT Test

1. ❌ Modifying `article_structure`
2. ❌ Re-running planner
3. ❌ Reordering sections
4. ❌ Skipping sections
5. ❌ Inferring missing data

---

## Summary: The Contract

| Aspect | Story 38.1 (Producer) | Story 38.2 (Consumer) |
|---|---|---|
| **Produces** | Validated `article_structure` | Research results per section |
| **Consumes** | Approved subtopics | `article_structure` |
| **Boundary** | `articles.article_structure` | `articles.sections` (new table) |
| **Responsibility** | Planner + Compiler | Research Agent + Progress tracking |
| **Guarantees** | Deterministic, validated, immutable | Read-only access, section-level processing |
| **Forbidden** | (N/A) | Modify structure, re-run planner, infer data |

---

## Sign-Off

**Document Status**: ✅ **IMMUTABLE CONTRACT FROZEN**  
**Effective Date**: 2026-02-02  
**Valid Until**: Story 38.2 completion or explicit contract revision

**Story 38.2 Developers**: This document is your authoritative reference. Treat `article_structure` as read-only. Any modifications require a new story and explicit contract revision.

**Governance**: BMAD compliance enforced. Producer–consumer boundary is non-negotiable.

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-02  
**Next Review**: After Story 38.2 implementation
