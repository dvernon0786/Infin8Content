# Story 34.3: Harden ICP Generation with Automatic Retry & Failure Recovery

**Status:** backlog

---

## Story Classification

* **Type:** Producer enhancement (internal to Story 34.1)
* **Epic:** Epic 34 – Intent Validation – ICP & Competitive Analysis
* **Tier:** Tier 2 (Reliability & resilience)

---

## Business Intent

Increase the reliability of ICP generation by automatically retrying transient failures (timeouts, rate limits, temporary API errors), ensuring that short-lived external issues do not permanently block workflow progress.

This story **does not introduce a new workflow step** and **does not change workflow sequencing**.

---

## Story

As a content manager,
I want ICP generation to automatically retry when transient failures occur,
So that temporary external API issues do not prevent me from completing onboarding.

---

## Scope Definition

### In Scope

* Automatic retries for ICP generation inside the existing producer
* Retry tracking per workflow
* Exponential backoff with limits
* Clear terminal failure handling after retries are exhausted
* Analytics and audit visibility into retries and final failure

### Explicitly Out of Scope

* No new workflow steps
* No new workflow statuses
* No consumer semantics
* No separate retry API endpoint
* No UI-driven retry logic (retry occurs server-side)
* No long-term job scheduling or background queues

---

## Producer Dependency Check

* **Producer Story:** Story 34.1 – Generate ICP Document via Perplexity AI
* **Status:** Completed ✅

**Blocking Decision:** **ALLOWED**

This story enhances the existing ICP producer and does not depend on downstream steps.

---

## Acceptance Criteria

1. **Given** ICP generation is triggered
   **When** the OpenRouter / Perplexity call fails with a retryable error
   **Then** the system automatically retries ICP generation using exponential backoff

2. **And** retryable errors are limited to:

   * Network timeouts
   * Rate limits (429)
   * Temporary API failures (5xx)

3. **And** non-retryable errors (4xx, auth, validation) immediately stop execution

4. **And** the system performs **at most 3 total attempts** (initial + 2 retries)

5. **And** the workflow records:

   * `retry_count` 
   * `last_error_message` 

6. **And** if ICP generation succeeds on a retry:

   * Workflow proceeds normally to `step_1_icp` 
   * Retry metadata remains available for audit

7. **And** if all retry attempts fail:

   * ICP generation is marked failed via error metadata
   * Workflow remains at `step_1_icp` 
   * User may re-trigger ICP generation manually via the existing endpoint

8. **And** analytics events are emitted for:

   * Each retry attempt
   * Final failure after retries exhausted

---

## Technical Requirements

### Retry Ownership

* Retry logic lives **inside the ICP producer**
* Implemented within `icp-generator.ts` 
* No retry orchestration exists outside the producer boundary

---

### Retry Policy (Defaults)

```ts
interface RetryPolicy {
  maxAttempts: number        // 3 (initial + 2 retries)
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

### intent_workflows (minimal, state-safe)

```sql
ALTER TABLE intent_workflows
ADD COLUMN retry_count INTEGER DEFAULT 0,
ADD COLUMN step_1_icp_last_error_message TEXT;
```

> No retry history arrays or attempt logs stored on the workflow row.

---

## Observability & Analytics

### Events Emitted

**Retry Attempt**

```ts
{
  event_type: 'workflow_step_retried',
  step: 'step_1_icp',
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
  step: 'step_1_icp',
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
  POST /api/intent/workflows/{workflow_id}/steps/icp-generate
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

* `lib/services/intent-engine/icp-generator.ts` 
* `app/api/intent/workflows/[workflow_id]/steps/icp-generate/route.ts` 

### New

* `lib/services/intent-engine/retry-utils.ts` (pure retry helpers)

### Database

* `supabase/migrations/20260131_add_icp_retry_metadata.sql` 

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
* Does not introduce new workflow states
* Keeps ICP generation as a single, hardened producer
* Safe to ship without downstream refactors
