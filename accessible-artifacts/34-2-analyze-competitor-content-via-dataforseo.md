# Story 34.2: Extract Seed Keywords from Competitor URLs via DataForSEO

**Status:** ready-for-dev

---

## Story

As a content manager,
I want to analyze competitor websites and extract a small, high-quality set of **seed keywords** from each competitor domain,
So that these seed keywords can be expanded into long-tail keywords and subtopics in later steps of the keyword generation pipeline.

---

## Story Classification

* **Type:** Producer (creates seed keyword records)
* **Epic:** 34 – Intent Validation – ICP & Competitive Analysis
* **Tier:** Tier 1 (foundational keyword pipeline step)

---

## Business Intent

Establish the **starting point of the keyword engine** by extracting a limited number of authoritative, high-volume **seed keywords per competitor URL**, forming the hubs of the hub-and-spoke SEO model.

This step intentionally **does not** generate long-tail keywords, subtopics, or content.

---

## Producer Dependency Check

**Epic 34.1 Status:** COMPLETED ✅

* ICP generation is complete
* Organization context is available
* Competitor URLs are configured and stored

**Blocking Decision:** **ALLOWED**

---

## Acceptance Criteria

1. **Given** ICP generation is complete
   **And** competitors have been configured for the organization
   **When** I trigger competitor analysis (Step 2)
   **Then** the system loads active competitor URLs for the organization

2. **And** for each competitor URL, the system calls the DataForSEO
   `keywords_for_site` API endpoint

3. **And** the system extracts **up to 3 seed keywords per competitor**, ordered by highest search volume

4. **And** for each extracted seed keyword, the system creates a record in the `keywords` table with:

   * seed_keyword
   * search_volume
   * competition_level
   * keyword_difficulty
   * competitor_url_id
   * organization_id

5. **And** all created seed keywords are marked with:

   * `longtail_status = 'not_started'` 
   * `subtopics_status = 'not_started'` 
   * `article_status = 'not_started'` 

6. **And** the workflow status updates to `step_2_competitors` 

7. **And** the step is marked as completed with a timestamp

---

## Explicit Non-Goals (Out of Scope)

This story **must not**:

* Generate long-tail keywords
* Generate subtopics
* Store keyword data inside workflow JSON fields
* Perform content planning or article generation
* Emit UI events

These are handled by downstream stories.

---

## Technical Requirements

### API Endpoint

**Endpoint:**
`POST /api/intent/workflows/{workflow_id}/steps/competitor-analyze` 

**Request:**

```ts
{
  workflow_id: string // UUID
}
```

**Response:**

```ts
{
  success: boolean
  data: {
    seed_keywords_created: number
    step_2_competitor_completed_at: string
  }
  error?: string
}
```

---

### DataForSEO Endpoint

**URL:**
https://docs.dataforseo.com/v3/dataforseo_labs/google/keywords_for_site/live/

**Endpoint:**
`POST /v3/dataforseo_labs/google/keywords_for_site/live`

This is the exact endpoint described in the Product & Stack Overview for:
* Competitor URL → Seed Keywords
* Outrank-style onboarding
* Hub-and-spoke SEO model
* "Seed keywords first" philosophy

### Request Constraints

* One request per competitor URL
* Limit results to **top 3 keywords**
* Order by `search_volume DESC` 
* Use organization default location and language

### Retry & Timeout

* Retry: up to 3 attempts (2s, 4s, 8s backoff)
* Timeout: hard stop at 10 minutes total
* Rate limits respected via batching and delay

---

## Database Behavior (Doc-Compliant)

### Tables Used

* `competitors` – source URLs
* `keywords` – seed keyword records

### No Workflow JSON Storage

❌ Do not store keyword data in `intent_workflows` 
✅ Persist normalized keyword rows only

---

## Keyword Record Structure

```ts
{
  id: UUID
  organization_id: UUID
  competitor_url_id: UUID
  seed_keyword: string
  keyword: string // same as seed_keyword at this stage
  search_volume: number
  competition_level: 'low' | 'medium' | 'high'
  competition_index: number
  keyword_difficulty: number
  cpc?: number
  longtail_status: 'not_started'
  subtopics_status: 'not_started'
  article_status: 'not_started'
  created_at
  updated_at
}
```

---

## Workflow State Management

* **Success**

  * Update workflow status → `step_2_competitors` 
  * Set `step_2_competitor_completed_at` 

* **Failure**

  * Store `step_2_competitor_error_message` 
  * Leave workflow status at `step_1_icp` 

---

## Error Handling Rules

* If one competitor fails → continue with others
* If all competitors fail → fail the step
* If no competitors exist → fail with explicit error
* Partial success is allowed and logged

---

## Audit Logging

```ts
logActionAsync({
  orgId,
  userId,
  action: 'workflow.competitor_seed_keywords.started',
  details: {
    workflow_id,
    competitor_count,
    max_seeds_per_competitor: 3
  }
})
```

On completion:

```ts
action: 'workflow.competitor_seed_keywords.completed'
```

---

## Architecture Compliance

### Patterns Followed

* Intent Engine workflow step pattern
* Normalized Supabase data model
* Producer-only responsibility
* Hub-and-spoke SEO pipeline

### File Structure

```
lib/services/intent-engine/
  └── competitor-seed-extractor.ts (NEW)

app/api/intent/workflows/[workflow_id]/steps/
  └── competitor-analyze/route.ts

__tests__/
  ├── services/intent-engine/competitor-seed-extractor.test.ts
  └── api/intent/workflows/competitor-analyze.test.ts
```

---

## Testing Requirements

### Unit Tests

* Competitor loading
* DataForSEO request formatting
* Seed keyword limiting (max 3)
* Keyword persistence
* Retry and timeout logic

### Integration Tests

* End-to-end step execution
* Workflow state transition
* Database inserts
* Idempotent overwrite behavior

---

## Idempotency Definition

Re-running this step:

* Deletes or overwrites existing seed keywords for the same competitor URLs
* Does not create duplicates
* Produces a clean, deterministic seed set per run

---

## Completion Notes

* Fully compliant with Product & Stack Overview
* Matches Outrank-style keyword engine
* Establishes clean foundation for longtail and subtopic stories
* Safe to implement without downstream refactors
