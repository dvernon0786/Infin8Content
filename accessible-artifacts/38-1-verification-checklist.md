# Story 38.1 Verification Checklist

**Date**: 2026-02-02  
**Status**: Ready for Verification  
**Purpose**: Authoritative verification that Story 38.1 ACs are satisfied

---

## Layer 1: Unit Tests - Planner Compiler (Critical Safety Gate)

### Test Command
```bash
pnpm test __tests__/agents/planner-compiler.test.ts
```

### Checklist

- [ ] **Rejects <2 research questions per section**
  - Input: Section with 1 research question
  - Expected: Throws "Insufficient research_questions"
  - Status: ✅ Implemented in test

- [ ] **Rejects <2 supporting points per section**
  - Input: Section with 1 supporting point
  - Expected: Throws "Insufficient supporting_points"
  - Status: ✅ Implemented in test

- [ ] **Rejects total words <2000**
  - Input: total_estimated_words = 1500
  - Expected: Throws "Must be between 2000-4000"
  - Status: ✅ Implemented in test

- [ ] **Rejects total words >4000**
  - Input: total_estimated_words = 5000
  - Expected: Throws "Must be between 2000-4000"
  - Status: ✅ Implemented in test

- [ ] **Injects section_id for every section**
  - Input: Valid planner output
  - Expected: Each section has UUID section_id
  - Status: ✅ Implemented in test

- [ ] **Injects sequential section_order**
  - Input: Valid planner output with 3 sections
  - Expected: section_order = [0, 1, 2]
  - Status: ✅ Implemented in test

- [ ] **Does NOT alter semantic content**
  - Input: Valid output with specific headers, questions, points
  - Expected: Output identical except for injected metadata
  - Status: ✅ Implemented in test

**Expected Result**: All tests pass ✅

---

## Layer 2: Unit Tests - Planner Agent

### Test Command
```bash
pnpm test __tests__/agents/planner-agent.test.ts
```

### Checklist

- [ ] **Returns valid JSON object**
  - Input: PlannerInput with subtopic, keyword, content_style, ICP
  - Expected: PlannerOutput with article_structure array
  - Status: ✅ Implemented in test

- [ ] **Does NOT inject section_id or section_order**
  - Input: Any valid planner input
  - Expected: Output has no section_id or section_order fields
  - Status: ✅ Implemented in test

- [ ] **Respects locked system prompt**
  - Input: Any planner input
  - Expected: System prompt unchanged from source
  - Status: ✅ Locked in planner-agent.ts

- [ ] **Handles malformed LLM response by throwing**
  - Input: LLM returns invalid JSON
  - Expected: Throws error with descriptive message
  - Status: ✅ Implemented in planner-agent.ts

**Expected Result**: All tests pass ✅

---

## Layer 3: Orchestration Test - End-to-End Flow

### Prerequisites

1. Workflow exists in `step_8_approval`
2. At least 1 keyword has:
   - `article_status = 'ready'`
   - `subtopics_status = 'complete'`
   - `subtopics` JSONB array populated

### Test Steps

#### Step 1: Trigger queue-articles endpoint
```bash
POST /api/intent/workflows/{workflow_id}/steps/queue-articles
```

#### Step 2: Verify articles created (immediate)
```sql
SELECT id, status, keyword
FROM articles
WHERE intent_workflow_id = '{workflow_id}'
ORDER BY created_at DESC;
```

**Expected**:
- [ ] Articles created with `status = 'queued'`
- [ ] One article per approved keyword
- [ ] All context fields populated

#### Step 3: Verify Inngest event triggered
**Expected**:
- [ ] `article.generate.planner` event sent
- [ ] Event payload includes article_id, workflow_id, keyword, subtopics, icp_context

#### Step 4: Wait for Inngest execution (30-60 seconds)

#### Step 5: Verify article_structure persisted
```sql
SELECT
  id,
  status,
  article_structure->>'article_title' as title,
  jsonb_array_length(article_structure->'article_structure') as section_count
FROM articles
WHERE intent_workflow_id = '{workflow_id}'
ORDER BY created_at DESC;
```

**Expected**:
- [ ] `status = 'planned'`
- [ ] `article_structure` is not null
- [ ] `article_structure.article_structure` is array with ≥2 sections

#### Step 6: Verify section metadata injected
```sql
SELECT
  article_structure->'article_structure'->>0->>'section_id' as section_id,
  article_structure->'article_structure'->>0->>'section_order' as section_order,
  article_structure->'article_structure'->>0->>'header' as header
FROM articles
WHERE intent_workflow_id = '{workflow_id}'
LIMIT 1;
```

**Expected**:
- [ ] `section_id` matches UUID pattern
- [ ] `section_order` = 0 for first section
- [ ] `header` is preserved from planner output

#### Step 7: Verify workflow status updated
```sql
SELECT status FROM intent_workflows WHERE id = '{workflow_id}';
```

**Expected**:
- [ ] `status = 'step_9_articles'`

**Overall Expected Result**: All steps pass ✅

---

## Layer 4: Regression Test - Idempotency

### Test Steps

#### Step 1: Call queue-articles again
```bash
POST /api/intent/workflows/{workflow_id}/steps/queue-articles
```

#### Step 2: Verify no duplicate articles
```sql
SELECT count(*) as article_count
FROM articles
WHERE intent_workflow_id = '{workflow_id}';
```

**Expected**:
- [ ] Count unchanged from previous test
- [ ] No new articles created

#### Step 3: Verify Planner not re-triggered
**Expected**:
- [ ] No new `article.generate.planner` events
- [ ] Existing articles reused

#### Step 4: Verify workflow status unchanged
```sql
SELECT status FROM intent_workflows WHERE id = '{workflow_id}';
```

**Expected**:
- [ ] `status = 'step_9_articles'` (unchanged)

**Overall Expected Result**: Idempotency verified ✅

---

## Layer 5: Failure-Path Test - Error Handling

### Test Setup

Simulate a planner failure by:
1. Mocking LLM to return invalid JSON, OR
2. Mocking Compiler to reject output

### Test Steps

#### Step 1: Trigger queue-articles with mocked failure
```bash
POST /api/intent/workflows/{workflow_id}/steps/queue-articles
```

#### Step 2: Verify article marked as planner_failed
```sql
SELECT
  id,
  status,
  error_details->>'error_message' as error_msg,
  error_details->>'stage' as stage
FROM articles
WHERE intent_workflow_id = '{workflow_id}'
AND status = 'planner_failed';
```

**Expected**:
- [ ] `status = 'planner_failed'`
- [ ] `error_details` contains error_message and timestamp
- [ ] `stage = 'planner'`

#### Step 3: Verify other articles continue processing
**Expected**:
- [ ] If multiple articles queued, non-failed ones proceed
- [ ] Workflow still advances to `step_9_articles`

#### Step 4: Verify Inngest retry triggered
**Expected**:
- [ ] Failed article eligible for Inngest retry
- [ ] Retry logic respects exponential backoff

**Overall Expected Result**: Failure handling verified ✅

---

## Acceptance Criteria Verification Matrix

| AC | Test Layer | Expected Result | Status |
|---|---|---|---|
| AC1: Articles created | Layer 3, Step 2 | Articles with status='queued' | ✅ |
| AC2: Fields populated | Layer 3, Step 2 | All context fields present | ✅ |
| AC3: Planner triggered | Layer 3, Step 3 | Event sent with full payload | ✅ |
| AC4: Output persisted | Layer 3, Step 5 | article_structure populated | ✅ |
| AC5: Workflow status | Layer 3, Step 7 | status = 'step_9_articles' | ✅ |
| AC6: Completes within 5min | Layer 3, Step 4 | Async execution (non-blocking) | ✅ |
| AC7: Failed articles retryable | Layer 5, Step 2 | status = 'planner_failed' + retry | ✅ |

---

## Critical Safety Gates

### Gate 1: Planner Compiler Validation (MUST PASS)
- [ ] Unit tests for compiler pass
- [ ] All validation rules enforced
- [ ] No semantic content altered

**Status**: ✅ Ready to test

### Gate 2: Orchestration Flow (MUST PASS)
- [ ] Articles created with queued status
- [ ] Inngest event triggered
- [ ] article_structure persisted to DB
- [ ] Workflow status updated

**Status**: ✅ Ready to test

### Gate 3: Idempotency (MUST PASS)
- [ ] No duplicate articles on re-run
- [ ] Planner not re-triggered
- [ ] Workflow status stable

**Status**: ✅ Ready to test

### Gate 4: Failure Handling (MUST PASS)
- [ ] Failed articles marked correctly
- [ ] Other articles continue
- [ ] Retry mechanism triggered

**Status**: ✅ Ready to test

---

## Test Execution Order

1. **Unit Tests First** (fast, deterministic)
   - Planner Compiler validation rules
   - Planner Agent contract
   - Expected: ~30 seconds

2. **Orchestration Test** (requires live DB)
   - End-to-end flow with real workflow
   - Expected: ~2 minutes

3. **Regression Test** (idempotency)
   - Re-run queue-articles
   - Expected: ~1 minute

4. **Failure-Path Test** (mocked failure)
   - Simulate planner error
   - Expected: ~1 minute

**Total Expected Time**: ~5 minutes

---

## Pass/Fail Criteria

### PASS (Story 38.1 Complete)
- ✅ All 4 layers pass
- ✅ All 7 ACs verified
- ✅ No regressions
- ✅ Failure handling confirmed

### FAIL (Requires Fixes)
- ❌ Any unit test fails → Fix Compiler/Agent
- ❌ Orchestration fails → Fix Inngest handler or DB schema
- ❌ Idempotency fails → Fix article queuing logic
- ❌ Failure handling fails → Fix error handling in handler

---

## Sign-Off

**Verification Status**: Ready to execute  
**Expected Outcome**: All tests pass, Story 38.1 complete  
**Next Step**: Run Layer 1 unit tests (Planner Compiler)

---

## Notes

- Tests are designed to be **deterministic** (no flakiness)
- Tests verify **contracts**, not implementation details
- Tests are **independent** (can run in any order)
- Tests provide **clear failure messages** for debugging
- All tests follow **BMAD verification principles**
