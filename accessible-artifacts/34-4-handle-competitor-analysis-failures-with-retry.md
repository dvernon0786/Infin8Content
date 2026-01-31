# Story 34.4: Harden Competitor Analysis with Automatic Retry & Failure Recovery

Status: ready-for-dev

---

## Story Classification

* **Type:** Producer enhancement (internal to Story 34.2)
* **Epic:** Epic 34 – Intent Validation – ICP & Competitive Analysis
* **Tier:** Tier 2 (Reliability & resilience)

---

## Business Intent

Increase the reliability of competitor analysis by automatically retrying transient failures (timeouts, rate limits, temporary API errors), ensuring that short-lived external issues do not permanently block workflow progress.

This story does not introduce a new workflow step and does not change workflow sequencing.

---

## Story

As a content manager,
I want competitor analysis to automatically retry when transient failures occur,
So that temporary external API issues do not prevent me from completing onboarding.

---

## Scope Definition

### In Scope

* Automatic retries for competitor analysis inside the existing producer
* Step-scoped retry tracking per workflow
* Exponential backoff with upper bounds
* Clear terminal failure handling after retries are exhausted
* Analytics and audit visibility into retries and final failure

### Explicitly Out of Scope

* No new workflow steps
* No new workflow statuses
* No consumer semantics
* No separate retry API endpoint
* No UI-driven retry logic
* No background job schedulers or queues

---

## Producer Dependency Check

* **Producer Story:** Story 34.2 – Extract Seed Keywords from Competitor URLs via DataForSEO
* **Status:** Completed ✅

**Blocking Decision:** **ALLOWED**

This story enhances the existing competitor analysis producer and does not depend on downstream steps.

---

## Acceptance Criteria

1. **Given** competitor analysis is triggered
   **When** the DataForSEO API call fails with a retryable error
   **Then** the system automatically retries competitor analysis using exponential backoff

2. **And** retryable errors are limited to:

   * Network timeouts
   * Rate limits (HTTP 429)
   * Temporary API failures (HTTP 5xx)

3. **And** non-retryable errors (HTTP 4xx, authentication, validation) immediately stop execution

4. **And** the system performs **at most 4 total attempts** (initial + 3 retries)

5. **And** the workflow records:

   * `step_2_competitors_retry_count`
   * `step_2_competitors_last_error_message`

6. **And** if competitor analysis succeeds on a retry:

   * Workflow proceeds normally to `step_2_competitors`
   * Retry metadata remains available for audit

7. **And** if all retry attempts fail:

   * Competitor analysis is marked failed via error metadata
   * Workflow remains at `step_1_icp`
   * User may re-trigger competitor analysis manually via the existing endpoint

8. **And** analytics events are emitted for:

   * Each retry attempt
   * Final failure after retries exhausted

---

## Technical Requirements

### Retry Ownership

* Retry logic lives **inside the competitor analysis producer**
* Implemented within `competitor-seed-extractor.ts`
* No retry orchestration exists outside the producer boundary

---

### Retry Policy (Defaults)

```ts
interface RetryPolicy {
  maxAttempts: number        // 4 (initial + 3 retries)
  initialDelayMs: number     // 1000
  backoffMultiplier: number  // 2
  maxDelayMs: number         // 30000
}
```

### Backoff Logic

```ts
delay = min(
  initialDelayMs * (backoffMultiplier ** attemptNumber),
  maxDelayMs
)
```

---

### Error Classification

**Retryable**

* Timeout / network failure
* HTTP 429
* HTTP 5xx

**Non-Retryable**

* HTTP 400 / 422 (invalid input)
* HTTP 401 / 403 (auth)
* Schema / validation errors

---

## Database Changes

### intent_workflows (step-scoped, collision-safe)

```sql
ALTER TABLE intent_workflows
ADD COLUMN step_2_competitors_retry_count INTEGER DEFAULT 0,
ADD COLUMN step_2_competitors_last_error_message TEXT;
```

> No retry history arrays or attempt logs stored on the workflow row.

---

## Observability & Analytics

### Events Emitted

**Retry Attempt**

```ts
{
  event_type: 'workflow_step_retried',
  step: 'step_2_competitors',
  workflow_id,
  organization_id,
  attempt_number,
  error_type,
  delay_before_retry_ms,
  timestamp
}
```

**Terminal Failure**

```ts
{
  event_type: 'workflow_step_failed',
  step: 'step_2_competitors',
  workflow_id,
  organization_id,
  total_attempts,
  final_error_message,
  timestamp
}
```

---

## API Behavior

* **Endpoint remains unchanged:**

  ```
  POST /api/intent/workflows/{workflow_id}/steps/competitor-analyze
  ```

* Retries are transparent to the caller

* Response includes retry metadata if applicable

* Manual re-trigger uses the same endpoint

---

## Architecture Compliance

### Principles Respected

* Producer owns its own resilience
* Workflow state machine remains unchanged
* No new terminal workflow states
* No consumer misuse
* No cross-step coupling

---

## File Changes

### Modified

* `lib/services/intent-engine/competitor-seed-extractor.ts`
* `app/api/intent/workflows/[workflow_id]/steps/competitor-analyze/route.ts`

### Reused

* `lib/services/intent-engine/retry-utils.ts` (from Story 34.3)

### Database

* `supabase/migrations/20260131_add_competitor_retry_metadata.sql`

---

## Testing Requirements

### Unit Tests

* Retry decision logic
* Error classification
* Backoff calculation
* Retry count enforcement

### Integration Tests

* Successful retry after transient failure
* Terminal failure after max attempts
* Workflow state remains stable
* Analytics events emitted correctly

---

## Completion Notes

* Fully aligned with Product & Stack Overview
* Correct terminal failure semantics
* Step-scoped retry metadata avoids schema collisions
* Reuses proven retry utilities from Story 34.3
* Safe to ship without downstream refactors

---

---

## Contracts Required

* **C1:** Database schema changes (intent_workflows table columns)
* **C2/C4/C5:** API endpoint modification (competitor analysis route)
* **Terminal State:** Analytics events for retry attempts and failures
* **UI Boundary:** No UI events (internal producer enhancement)
* **Analytics:** Retry attempt and terminal failure events

---

## Contracts Modified

* **intent_workflows table:** Added retry tracking columns
* **competitor-seed-extractor.ts:** Enhanced with retry logic
* **competitor-analyze route:** Updated to handle retry metadata

---

## Contracts Guaranteed

* **No UI events:** ✅ Internal producer enhancement only
* **No intermediate analytics:** ✅ Only terminal state events
* **No state mutation outside producer:** ✅ Retry logic contained within producer
* **Idempotency:** ✅ Retry metadata is additive, non-destructive
* **Retry rules:** ✅ Exponential backoff with max attempts enforced

---

## Producer Dependency Check

* **Producer Story:** Story 34.2 – Extract Seed Keywords from Competitor URLs via DataForSEO
* **Status:** Completed ✅

**Blocking Decision:** **ALLOWED**

This story enhances the existing competitor analysis producer and does not depend on downstream steps.

---

## Completion Notes

* Fully aligned with Product & Stack Overview
* Correct terminal failure semantics
* Step-scoped retry metadata avoids schema collisions
* Reuses proven retry utilities from Story 34.3
* Safe to ship without downstream refactors

---

✅ **Final Status**

Story 34.4 is now architecture-compliant and ready for development.
