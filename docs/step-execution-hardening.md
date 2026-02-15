# Step Execution Hardening - Production-Grade FSM

## 🎯 Critical Execution Pattern

Every step (1-9) MUST follow this exact pattern:

```typescript
// 1. Validate workflow.state == expected_state
if (workflow.state !== WorkflowState.step_X_expected) {
  return NextResponse.json(
    { error: `Invalid state. Expected: ${WorkflowState.step_X_expected}, Got: ${workflow.state}` },
    { status: 409 }
  );
}

// 2. Execute business logic (domain operations only)
const result = await executeStepLogic(workflowId, organizationId);

// 3. Persist domain data (never state)
await persistDomainData(workflowId, result);

// 4. advanceWorkflow(expected_state, next_state) - LAST operation
const transitionResult = await advanceWorkflow({
  workflowId,
  fromState: WorkflowState.step_X_expected,
  toState: WorkflowState.step_X_next,
  organizationId,
  userId
});

if (!transitionResult.success) {
  // Concurrent request won - work already done
  return NextResponse.json({ status: 'success', workflow: transitionResult.workflow });
}
```

## 🚨 FORBIDDEN PATTERNS

### ❌ NEVER Mutate State Before Writing Data
```typescript
// WRONG - state mutation before domain data
await advanceWorkflow(...);  // Advances state
await persistData(...);       // Fails → state advanced but no data
```

### ❌ NEVER Auto-Advance in GET Routes
```typescript
// WRONG - GET routes must be read-only
app.get('/workflows/:id', async (req, res) => {
  await advanceWorkflow(...);  // ❌ Side effects in GET
});
```

### ❌ NEVER Advance Twice
```typescript
// WRONG - double state mutation
await advanceWorkflow(...);  // First advance
await advanceWorkflow(...);  // Second advance - corrupt
```

### ❌ NEVER Advance Inside Retry Loops
```typescript
// WRONG - state mutation during retries
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    await executeLogic();
    await advanceWorkflow(...);  // ❌ Advances on each retry
    break;
  } catch (error) {
    // Continue retrying
  }
}
```

## ✅ CORRECT PATTERNS

### ✅ State Validation First
```typescript
// CORRECT - validate state before any operations
if (workflow.state !== expectedState) {
  return { error: 'Invalid state', status: 409 };
}
```

### ✅ Business Logic Before State
```typescript
// CORRECT - execute logic before state mutation
const result = await executeBusinessLogic();
if (result.success) {
  await advanceWorkflow(...);  // Only advance after success
}
```

### ✅ Domain Data Persistence
```typescript
// CORRECT - persist domain data separately from state
await persistKeywords(workflowId, keywords);
await persistClusters(workflowId, clusters);
await advanceWorkflow(...);  // State mutation last
```

### ✅ Concurrent Request Handling
```typescript
// CORRECT - handle race conditions gracefully
const transitionResult = await advanceWorkflow(...);
if (!transitionResult.success) {
  // Concurrent request won - work already done
  return { status: 'success', workflow: transitionResult.workflow };
}
```

## 📊 Step-by-Step Matrix

| Step | Expected State | Domain Data | Next State | Validation |
|------|----------------|-------------|------------|------------|
| 1 ICP | `step_1_icp` | `icp_data` | `step_2_competitors` | ✅ |
| 2 Competitors | `step_2_competitors` | `competitors` | `step_3_seeds` | ✅ |
| 3 Seeds | `step_3_seeds` | `seed_keywords` | `step_4_longtails` | ✅ |
| 4 Longtails | `step_4_longtails` | `longtail_keywords` | `step_5_filtering` | ✅ |
| 5 Filtering | `step_5_filtering` | `filtered_keywords` | `step_6_clustering` | ✅ |
| 6 Clustering | `step_6_clustering` | `topic_clusters` | `step_7_validation` | ✅ |
| 7 Validation | `step_7_validation` | `validated_clusters` | `step_8_subtopics` | ✅ |
| 8 Subtopics | `step_8_subtopics` | `subtopics` | `step_9_articles` | ✅ |
| 9 Articles | `step_9_articles` | `article_queue` | `COMPLETED` | ✅ |

## 🔒 Atomic Transaction Pattern

```typescript
// Each step should use this pattern
const supabase = createServiceRoleClient();

await supabase.rpc('advance_workflow_state', {
  p_workflow_id: workflowId,
  p_from_state: expectedState,
  p_to_state: nextState,
  p_organization_id: organizationId,
  p_user_id: userId
});
```

The stored procedure ensures:
- ✅ Atomic state transition
- ✅ Race condition protection
- ✅ Audit logging
- ✅ Legal transition validation

## 🧪 Testing Each Step

### Unit Test Pattern
```typescript
describe('Step X Execution', () => {
  it('should validate state before execution', async () => {
    const workflow = { state: 'wrong_state' };
    const result = await executeStep(workflow);
    expect(result.status).toBe(409);
  });
  
  it('should persist domain data before state transition', async () => {
    const workflow = { state: expectedState };
    await executeStep(workflow);
    
    // Verify domain data exists
    const domainData = await getDomainData(workflow.id);
    expect(domainData).toBeDefined();
    
    // Verify state advanced
    const updatedWorkflow = await getWorkflow(workflow.id);
    expect(updatedWorkflow.state).toBe(nextState);
  });
});
```

### Integration Test Pattern
```typescript
describe('Full Workflow Progression', () => {
  it('should execute steps 1-9 in sequence', async () => {
    const workflowId = await createWorkflow();
    
    for (let step = 1; step <= 9; step++) {
      await executeStep(workflowId, step);
      const workflow = await getWorkflow(workflowId);
      expect(workflow.state).toBe(getExpectedState(step));
    }
  });
});
```

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] All steps follow the exact execution pattern
- [ ] No state mutations before domain data persistence
- [ ] All GET routes are read-only
- [ ] Race condition handling implemented
- [ ] Comprehensive test coverage
- [ ] FSM validation script passes

### Post-deployment Verification
```sql
-- Run the validation script
\i supabase/migrations/20260215000011_validate_fsm_purity.sql

-- Verify state distribution
SELECT state, COUNT(*) FROM intent_workflows GROUP BY state ORDER BY state;

-- Check for any failed transitions
SELECT * FROM workflow_transition_audit WHERE transition_reason LIKE '%error%';
```

## 🏆 Success Criteria

When all steps follow this pattern:

1. **Deterministic**: Same input → same output every time
2. **Race-Safe**: Concurrent requests handled gracefully
3. **Atomic**: Either full success or full failure
4. **Auditable**: Every transition logged
5. **Debuggable**: Clear error states and recovery paths

This ensures step 1 → step 9 execution is **flawless and repeatable** in production.
