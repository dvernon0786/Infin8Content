# Story 34.4: Handle Competitor Analysis Failures with Retry

Status: review

## Story

As a system,
I want to retry competitor analysis if the DataForSEO API call fails,
So that transient failures don't block the workflow.

## Acceptance Criteria

1. **Given** competitor analysis is triggered
   **When** the DataForSEO API call fails with a retryable error
   **Then** the system automatically retries competitor analysis using exponential backoff

2. **And** retryable errors are limited to:
   - Network timeouts
   - Rate limits (HTTP 429)
   - Temporary API failures (HTTP 5xx)

3. **And** non-retryable errors (HTTP 4xx, authentication, validation) immediately stop execution

4. **And** the system performs **at most 4 total attempts** (initial + 3 retries)

5. **And** the workflow records:
   - `step_2_competitors_retry_count`
   - `step_2_competitors_last_error_message`

6. **And** if competitor analysis succeeds on a retry:
   - Workflow proceeds normally to `step_2_competitors`
   - Retry metadata remains available for audit

7. **And** if all retry attempts fail:
   - Competitor analysis is marked failed via error metadata
   - Workflow remains at `step_1_icp`
   - User may re-trigger competitor analysis manually via the existing endpoint

8. **And** analytics events are emitted for:
   - Each retry attempt
   - Final failure after retries exhausted

## Tasks / Subtasks

- [x] Task 1: Implement retry logic in competitor-seed-extractor.ts (AC: 1, 2, 3, 4)
  - [x] Subtask 1.1: Add retry policy configuration for 4 total attempts
  - [x] Subtask 1.2: Integrate retry-utils.ts functions for error classification
  - [x] Subtask 1.3: Implement exponential backoff with max delay cap
  - [x] Subtask 1.4: Add retry count and error message tracking
- [x] Task 2: Update database schema for retry metadata (AC: 5)
  - [x] Subtask 2.1: Create migration for step_2_competitors_retry_count column
  - [x] Subtask 2.2: Create migration for step_2_competitors_last_error_message column
- [x] Task 3: Enhance workflow status management (AC: 6, 7)
  - [x] Subtask 3.1: Update updateWorkflowStatus to handle retry metadata
  - [x] Subtask 3.2: Ensure workflow stays at step_1_icp on final failure
  - [x] Subtask 3.3: Preserve retry metadata on successful retry
- [x] Task 4: Implement analytics event emission (AC: 8)
  - [x] Subtask 4.1: Emit workflow_step_retried events for each retry
  - [x] Subtask 4.2: Emit workflow_step_failed events on final failure
  - [x] Subtask 4.3: Include retry metadata in analytics payloads

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Multi-Tenant Architecture**: Row Level Security (RLS) policies enforce organization isolation. All database operations must include organization_id filters.

**Event-Driven Design**: Asynchronous processing with Inngest workflows. Retry logic must be contained within the producer boundary to maintain workflow state machine integrity.

**Security-First**: Authentication patterns use getCurrentUser() for API routes. Database operations use service role client with proper RLS enforcement.

**Error Handling Patterns**: Follow established retry-utils.ts patterns from Story 34.3. Use exponential backoff with configurable max attempts and delays.

### Source Tree Components to Touch

**Core Service Files**:
- `lib/services/intent-engine/competitor-seed-extractor.ts` - Main implementation (already has basic retry, needs enhancement)
- `lib/services/intent-engine/retry-utils.ts` - Reuse existing utilities (already implemented in Story 34.3)

**API Endpoint**:
- `app/api/intent/workflows/[workflow_id]/steps/competitor-analyze/route.ts` - Update to handle retry metadata

**Database Migration**:
- `supabase/migrations/20260131_add_competitor_retry_metadata.sql` - New migration for retry columns

**Analytics Integration**:
- `lib/services/analytics/event-emitter.ts` - Emit retry and failure events

### Testing Standards Summary

**Unit Tests**: Test retry decision logic, error classification, backoff calculation, retry count enforcement. Target >95% coverage.

**Integration Tests**: Test successful retry after transient failure, terminal failure after max attempts, workflow state stability, analytics events emission.

**Error Scenarios**: Test network timeouts, rate limits (HTTP 429), server errors (HTTP 5xx), client errors (HTTP 4xx), authentication failures.

### Project Structure Notes

**Alignment with Unified Project Structure**:
- Service layer: `lib/services/intent-engine/` - Correct location for intent engine services
- API routes: `app/api/intent/workflows/[workflow_id]/steps/` - Follows established pattern
- Database migrations: `supabase/migrations/` - Standard location with timestamp prefix
- Analytics: `lib/services/analytics/` - Centralized event emission

**Detected Conflicts or Variances**:
- Current competitor-seed-extractor.ts has inline retry logic (lines 186-296) that should be refactored to use retry-utils.ts
- Existing retry uses 3 attempts, story requires 4 attempts - need to update policy
- Current retry delays are [2000, 4000, 8000], need to use exponential backoff formula from retry-utils.ts

### References

**Story Foundation**: [Source: accessible-artifacts/epics.md#Epic-34]
**Previous Pattern**: [Source: infin8content/lib/services/intent-engine/retry-utils.ts] - Story 34.3 implementation
**Current Implementation**: [Source: infin8content/lib/services/intent-engine/competitor-seed-extractor.ts] - Lines 186-296
**Retry Utilities**: [Source: infin8content/lib/stripe/retry.ts] - General retry patterns
**Architecture**: [Source: docs/architecture.md] - Multi-tenant and event-driven patterns

## Dev Agent Record

### Agent Model Used

Cascade (SWE-1.5) with comprehensive context analysis

### Debug Log References

### Completion Notes List

✅ **Task 1 - Retry Logic Implementation**: 
- Replaced inline retry logic with retry-utils.ts integration
- Updated retry policy from 3 to 4 total attempts (initial + 3 retries)
- Implemented exponential backoff with 30s max delay cap
- Added proper error classification for retryable vs non-retryable errors
- Integrated analytics event emission for retry tracking

✅ **Task 2 - Database Schema**: 
- Created migration 20260131_add_competitor_retry_metadata.sql
- Added step_2_competitors_retry_count INTEGER column
- Added step_2_competitors_last_error_message TEXT column
- Included performance indexes and documentation comments

✅ **Task 3 - Workflow Status Management**: 
- Enhanced updateWorkflowStatus() to handle retry metadata
- Added updateWorkflowRetryMetadata() for real-time retry tracking
- Ensured workflow stays at step_1_icp on final failure
- Preserved retry metadata on successful completion

✅ **Task 4 - Analytics Event Emission**: 
- Integrated with existing event-emitter.ts from Story 34.3
- Emit workflow_step_retried events with full retry metadata
- Emit workflow_step_failed events on terminal failure
- All events include organization_id, workflow_id, and retry details

### File List

- `lib/services/intent-engine/competitor-seed-extractor.ts` - Enhanced with retry logic
- `lib/services/intent-engine/retry-utils.ts` - Reused retry utilities from Story 34.3
- `lib/services/intent-engine/__tests__/competitor-seed-extractor.test.ts` - Unit tests for retry logic
- `supabase/migrations/20260131_add_competitor_retry_metadata.sql` - Database schema changes
- `app/api/intent/workflows/[workflow_id]/steps/competitor-analyze/route.ts` - API endpoint updates with analytics integration
- `lib/services/analytics/event-emitter.ts` - Analytics event emission (reused)

## Technical Implementation Details

### Retry Policy Configuration

```typescript
const COMPETITOR_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 4,        // initial + 3 retries
  initialDelayMs: 1000,  // 1 second
  backoffMultiplier: 2,  // exponential
  maxDelayMs: 30000      // 30 second cap
}
```

### Database Schema Changes

```sql
ALTER TABLE intent_workflows
ADD COLUMN step_2_competitors_retry_count INTEGER DEFAULT 0,
ADD COLUMN step_2_competitors_last_error_message TEXT;
```

### Error Classification

**Retryable Errors**:
- Network timeouts (ETIMEDOUT, ENOTFOUND)
- HTTP 429 (rate limits) - honor Retry-After header if present
- HTTP 5xx (server errors)

**Non-Retryable Errors**:
- HTTP 400/422 (invalid input)
- HTTP 401/403 (authentication)
- Schema/validation errors
- DataForSEO API errors (status_code !== 20000)

### Analytics Events

**Retry Attempt Event**:
```typescript
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

**Terminal Failure Event**:
```typescript
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

### Integration Points

**Reuse Story 34.3 Components**:
- `retry-utils.ts` functions: `isRetryableError()`, `calculateBackoffDelay()`, `sleep()`, `classifyErrorType()`
- Error classification logic already proven in ICP generation retry

**Enhance Existing Implementation**:
- Replace inline retry logic in `extractKeywordsFromCompetitor()` (lines 186-296)
- Update `updateWorkflowStatus()` to handle retry metadata
- Add analytics event emission in retry loop

**Workflow State Management**:
- Maintain workflow at `step_1_icp` during retries
- Only advance to `step_2_competitors` on successful completion
- Preserve retry metadata for audit trail

### Performance Considerations

- Retry attempts add latency: max additional delay = 1s + 2s + 4s + 8s = 15s
- Rate limit handling respects Retry-After header when provided
- Timeout management prevents indefinite blocking
- Database operations are idempotent and safe for retry

### Security Considerations

- All database operations include organization_id filtering
- Service role client used for backend operations
- Error messages sanitized before storage (no credential leakage)
- Retry metadata stored in workflow row (proper RLS scope)

## Architecture Compliance

### Producer Pattern
- Retry logic contained within competitor analysis producer
- No cross-step coupling or external orchestration
- Workflow state machine unchanged
- Terminal failure semantics preserved

### Contract Compliance
- No UI events (internal producer enhancement)
- Terminal state analytics only
- No state mutation outside producer boundary
- Idempotent retry metadata (additive, non-destructive)
- Exponential backoff with max attempts enforced

### Multi-Tenant Safety
- Organization isolation maintained throughout retry process
- Retry metadata scoped to workflow row
- No cross-organization data leakage
- RLS policies enforced on all database operations
