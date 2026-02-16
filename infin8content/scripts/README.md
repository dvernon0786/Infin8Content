# Workflow Test Harness

## Linear Workflow Progression Test

A deterministic integration test that validates the complete FSM state machine execution from `step_1_icp` through `completed`.

### Purpose

This harness provides surgical failure detection and precise diagnostics for:
- API response validation
- Database state transitions  
- FSM event correctness
- Idempotency verification
- Race condition detection

### Setup

Set environment variables:

```bash
export BASE_URL=http://localhost:3000
export TEST_EMAIL=your_test_user@email.com
export TEST_PASSWORD=your_password
```

### Usage

```bash
# Run the linear workflow test
npm run test:linear

# Or run directly
npx ts-node scripts/test-linear-workflow.ts
```

### What It Tests

The harness executes all 9 workflow steps in sequence:

1. **ICP Generation** → `step_2_competitors`
2. **Competitor Analysis** → `step_3_seeds`
3. **Seed Approval** → `step_4_longtails`
4. **Longtail Expansion** → `step_5_filtering`
5. **Keyword Filtering** → `step_6_clustering`
6. **Topic Clustering** → `step_7_validation`
7. **Cluster Validation** → `step_8_subtopics`
8. **Subtopic Approval** → `step_9_articles`
9. **Article Queuing** → `completed`

### Failure Diagnostics

When a step fails, the harness outputs:

```
❌ STATE MISMATCH at Competitors
Expected: step_3_seeds
Actual: step_2_competitors
Previous: step_2_competitors
Response: { error: "FSM transition failed" }
```

Or:

```
❌ API FAILED at ICP
Status: 409
Response: { error: "RACE_CONDITION" }
```

### Success Output

```
🎉 SUCCESS: Workflow reached completed state cleanly.
✅ All FSM transitions working correctly
```

### Integration

This test should be run:
- Before any FSM-related deployments
- After changes to workflow step endpoints
- As part of CI/CD pipeline validation
- When debugging state machine issues

### Architecture

- Creates fresh workflow for each test run
- Captures state before and after each step
- Validates exact state transitions
- Stops immediately on first failure
- Provides structured error reporting
- Exits with non-zero status code for CI integration
