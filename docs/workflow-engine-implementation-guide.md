# Workflow Engine Implementation Guide

**For:** Development Team  
**Date:** 2026-02-13 10:37 UTC+11  
**Status:** Production Ready  
**Migration:** ✅ Fixed and Validated

## Quick Start

### What You Need to Know

The AI Copilot now uses a **distributed-safe workflow engine** with:
- Atomic state transitions (no race conditions)
- Idempotency support (safe retries)
- Centralized state management (single source of truth)
- Deterministic testing (no flaky tests)

### Key Principle: Transition-First

**Always acquire the lock BEFORE doing expensive work:**

```typescript
// ❌ WRONG: Extract first, transition second
const keywords = await extractor.extract(request)
await transitionWorkflow(...) // Might fail, wasted work

// ✅ RIGHT: Transition first, extract only if you win
const result = await transitionWorkflow(...)
if (!result.success) return 409 // Lost race, no work done
const keywords = await extractor.extract(request) // Only winner does this
```

## Using the Workflow State Engine

### Basic Transition

```typescript
import { transitionWorkflow } from '@/lib/services/intent-engine/workflow-state-engine'

const result = await transitionWorkflow({
  workflowId: 'workflow-123',
  organizationId: 'org-456',
  fromStep: 2,
  toStep: 3,
  status: 'step_2_competitors',
  idempotencyKey: request.headers.get('Idempotency-Key') // Optional
})

if (!result.success) {
  return NextResponse.json(
    { error: 'STEP_TRANSITION_FAILED' },
    { status: 409 }
  )
}

// Only winner reaches here
console.log(`Transitioned to step ${result.workflow.current_step}`)
```

### Idempotency for Retries

Client sends request with idempotency key:

```typescript
// Client code
fetch('/api/workflow/step', {
  method: 'POST',
  headers: {
    'Idempotency-Key': crypto.randomUUID() // Same for retries
  },
  body: JSON.stringify({...})
})
```

Server automatically handles:
1. Checks if key was seen before
2. Returns cached result if yes
3. Executes transition if no
4. Stores key for future retries

## Adding a New Step

### Step 1: Define the Step Handler

```typescript
// app/api/intent/workflows/[workflow_id]/steps/my-step/route.ts

import { transitionWorkflow } from '@/lib/services/intent-engine/workflow-state-engine'

export async function POST(request: NextRequest, { params }) {
  const { workflow_id } = await params
  const workflowId = workflow_id
  let organizationId: string

  try {
    // Authenticate
    const user = await getCurrentUser()
    if (!user?.org_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    organizationId = user.org_id

    // Validate workflow exists
    const { data: workflow } = await supabase
      .from('intent_workflows')
      .select('current_step')
      .eq('id', workflowId)
      .eq('organization_id', organizationId)
      .single()

    if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // TRANSITION-FIRST: Acquire lock before side effects
    const idempotencyKey = request.headers.get('Idempotency-Key') || undefined
    const transitionResult = await transitionWorkflow({
      workflowId,
      organizationId,
      fromStep: 3,        // Current step
      toStep: 4,          // Next step
      status: 'step_3_seeds',
      idempotencyKey
    })

    if (!transitionResult.success) {
      return NextResponse.json(
        { error: 'STEP_TRANSITION_FAILED' },
        { status: 409 }
      )
    }

    // ONLY WINNER: Do expensive work here
    const result = await doExpensiveWork(workflowId)

    // Log and return
    await logActionAsync({...})
    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('Step error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Step 2: Update Database Schema (if needed)

```sql
-- supabase/migrations/YYYYMMDD_add_step_X_columns.sql
ALTER TABLE intent_workflows
ADD COLUMN step_X_completed_at TIMESTAMP,
ADD COLUMN step_X_error_message TEXT;
```

### Step 3: Add to E2E Tests

```typescript
// tests/e2e/workflow-step-X.test.ts

it('Step X executes correctly after Step Y', async () => {
  // Advance to Step Y first
  await advanceToStep(workflowId, Y)

  // Execute Step X
  const res = await fetch(
    `${BASE_URL}/api/intent/workflows/${workflowId}/steps/my-step`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify({...})
    }
  )

  expect(res.status).toBe(200)
  const workflow = await getWorkflow(workflowId)
  expect(workflow.current_step).toBe(4)
})

it('Step X is atomic under concurrency', async () => {
  // Run 3 parallel requests
  const results = await Promise.allSettled([
    executeStep(workflowId, authToken),
    executeStep(workflowId, authToken),
    executeStep(workflowId, authToken)
  ])

  // Verify: 1 success, 2 failures
  const successes = results.filter(r => r.status === 'fulfilled' && r.value.status === 200)
  const failures = results.filter(r => r.status === 'fulfilled' && r.value.status === 409)

  expect(successes.length).toBe(1)
  expect(failures.length).toBe(2)
})
```

## Common Patterns

### Pattern 1: Guard + Transition + Work

```typescript
// Validate step
if (workflow.current_step !== expectedStep) {
  return NextResponse.json({ error: 'INVALID_STEP_ORDER' }, { status: 400 })
}

// Transition first
const transitionResult = await transitionWorkflow({...})
if (!transitionResult.success) {
  return NextResponse.json({ error: 'STEP_TRANSITION_FAILED' }, { status: 409 })
}

// Only winner does work
const result = await doWork()
```

### Pattern 2: Idempotency with Retries

```typescript
// Client automatically retries with same Idempotency-Key
const idempotencyKey = request.headers.get('Idempotency-Key')

// Server checks if we've seen this key before
const transitionResult = await transitionWorkflow({
  ...,
  idempotencyKey // Automatic deduplication
})

// If retry: returns cached result
// If new: executes transition and caches result
```

### Pattern 3: Error Handling

```typescript
try {
  const result = await transitionWorkflow({...})
  if (!result.success) {
    // Another request won the race
    return NextResponse.json({ error: 'STEP_TRANSITION_FAILED' }, { status: 409 })
  }
  // Do work...
} catch (error) {
  // Unexpected error - don't transition
  console.error('Step error:', error)
  return NextResponse.json({ error: 'Internal error' }, { status: 500 })
}
```

## Testing Checklist

### For Each New Step

- [ ] Guard enforcement test (wrong step → 400)
- [ ] Successful transition test (correct step → 200)
- [ ] Immutability test (cannot run twice → 409)
- [ ] Concurrency test (3 parallel → 1 success, 2 failures)
- [ ] Idempotency test (same key → cached result)
- [ ] Error handling test (exception → 500)

### Before Deployment

- [ ] All E2E tests pass
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Concurrency test proves atomicity
- [ ] Database migrations applied
- [ ] RLS policies verified

## Debugging

### Check Workflow State

```typescript
import { getWorkflowState } from '@/lib/services/intent-engine/workflow-state-engine'

const state = await getWorkflowState(workflowId, organizationId)
console.log(`Workflow at step ${state.workflow.current_step}`)
```

### Check Idempotency Key

```sql
SELECT * FROM workflow_transitions
WHERE workflow_id = 'workflow-123'
ORDER BY created_at DESC;
```

### Check Transition History

```sql
SELECT workflow_id, from_step, to_step, status, created_at
FROM workflow_transitions
WHERE workflow_id = 'workflow-123'
ORDER BY created_at DESC;
```

## Performance Considerations

### Atomic Transitions
- Database-level lock: ~1-5ms
- No network latency
- Guaranteed atomicity

### Idempotency Lookup
- Index on (workflow_id, idempotency_key)
- ~1-2ms for cache hit
- Prevents duplicate work

### Concurrent Execution
- Only 1 request advances per step
- Others fail fast (409)
- No wasted computation

## Troubleshooting

### Issue: Step always returns 409

**Cause:** Workflow is not at expected step

**Fix:** Check workflow state:
```sql
SELECT current_step, status FROM intent_workflows WHERE id = 'workflow-123';
```

### Issue: Idempotency key not working

**Cause:** Missing header or wrong format

**Fix:** Ensure client sends:
```
Idempotency-Key: {uuid}
```

### Issue: Concurrency test fails

**Cause:** Database lock not working

**Fix:** Verify WHERE clause in transition:
```sql
UPDATE intent_workflows
SET current_step = 3
WHERE id = $1 AND current_step = 2
```

## References

- **State Engine:** `lib/services/intent-engine/workflow-state-engine.ts`
- **Architecture:** `docs/workflow-engine-architecture.md`
- **E2E Tests:** `tests/e2e/workflow-step1-step2.test.ts`
- **Database:** `supabase/migrations/20260213_add_workflow_transitions_idempotency.sql`
