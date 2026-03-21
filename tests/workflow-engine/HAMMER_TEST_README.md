# Workflow Engine Hammer Test - Real Concurrent Validation

This directory contains real concurrent database tests that prove atomicity, state purity, and concurrency safety.

**These are NOT architectural tests.** These are hammer tests against a running system.

---

## Prerequisites

You need:

1. **Supabase instance running** (local or remote)
2. **API server running** on `http://localhost:3000`
3. **Environment variables set:**
   ```bash
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   API_URL=http://localhost:3000
   ```

---

## Running the Tests

### Option 1: Run All Tests

```bash
cd /home/dghost/Desktop/Infin8Content
npm run test:hammer
```

### Option 2: Run Individual Tests

```bash
# Test 1: Atomicity (3 concurrent calls)
curl -X POST http://localhost:3000/api/intent/workflows/<workflow_id>/steps/competitor-analyze &
curl -X POST http://localhost:3000/api/intent/workflows/<workflow_id>/steps/competitor-analyze &
curl -X POST http://localhost:3000/api/intent/workflows/<workflow_id>/steps/competitor-analyze &
wait

# Expected: 1 success (200), 2 conflicts (409)
```

### Option 3: Manual Concurrent Test (20 calls)

```bash
# Create a workflow in COMPETITOR_PENDING state first
# Then run:

for i in {1..20}; do
  curl -X POST http://localhost:3000/api/intent/workflows/<workflow_id>/steps/competitor-analyze \
    -H "Content-Type: application/json" &
done
wait

# Expected: 1 success (200), 19 conflicts (409)
# Check database:
# - Final state should be COMPETITOR_COMPLETED
# - Keywords should be inserted exactly once
```

---

## What Each Test Validates

### Test 1: Atomicity (3 Concurrent Calls)
**What it proves:** Database-level atomicity with WHERE clause locking

**Expected result:**
```
✅ 1 success (200)
✅ 2 conflicts (409)
✅ Final state: COMPETITOR_COMPLETED
✅ Keywords: inserted exactly once (no duplicates)
```

**If it fails:**
- 2 successes = race condition exists
- Duplicate keywords = atomicity broken
- State stuck in PROCESSING = purity broken

---

### Test 2: State Purity (Check State During Processing)
**What it proves:** State reflects reality (not premature completion)

**Expected result:**
```
✅ During processing: state = COMPETITOR_PROCESSING
✅ After completion: state = COMPETITOR_COMPLETED
✅ Never: COMPLETED before work done
✅ Never: FAILED after success
```

**If it fails:**
- State jumps to COMPLETED before work = purity broken
- State shows FAILED after success = state lies

---

### Test 3: Failure Handling (Force Extractor Error)
**What it proves:** Proper error handling without partial state corruption

**Expected result:**
```
✅ Error response (400 or 500)
✅ Final state: COMPETITOR_FAILED
✅ Keywords: 0 (no partial insertion)
✅ Retry works: FAILED → PROCESSING → COMPLETED
```

**If it fails:**
- Keywords inserted despite error = partial corruption
- State not FAILED = error handling broken
- Retry doesn't work = no recovery path

---

### Test 4: Concurrency Safety (20 Concurrent Calls)
**What it proves:** Real concurrency under database pressure

**Expected result:**
```
✅ 1 success (200)
✅ 19 conflicts (409)
✅ Final state: COMPETITOR_COMPLETED
✅ Keywords: inserted exactly once
✅ No race conditions
```

**If it fails:**
- 2+ successes = race condition exists
- Duplicate keywords = concurrency broken
- State corruption = atomicity failed

---

## Interpreting Results

### ✅ All Tests Pass

```
🚀 ALL TESTS PASSED - READY FOR PRODUCTION
```

You can ship. The workflow engine is proven safe under real concurrency.

### ❌ Some Tests Fail

```
❌ SOME TESTS FAILED - FIX BEFORE SHIPPING
```

Do NOT ship. The engine has a real bug. Fix the root cause:

- **Atomicity fails** → Fix WHERE clause or transaction isolation
- **State purity fails** → Fix transition ordering (side effects before state change)
- **Concurrency fails** → Fix database locking mechanism
- **Failure handling fails** → Fix error recovery path

---

## Real-World Scenarios Tested

### Scenario 1: Two Users Hit Same Workflow Simultaneously
**Result:** Only one processes, other gets 409. No duplicate work.

### Scenario 2: Server Crashes During Processing
**Result:** State remains PROCESSING. Manual recovery required. No silent corruption.

### Scenario 3: Network Timeout During Extraction
**Result:** State transitions to FAILED. Retry available. No half-state.

### Scenario 4: 20 Concurrent Requests (Load Test)
**Result:** Exactly 1 wins. 19 fail gracefully. Final state correct.

---

## Debugging Failed Tests

If a test fails, check:

1. **Database state:**
   ```sql
   SELECT id, state, created_at, updated_at FROM intent_workflows WHERE id = '<workflow_id>';
   SELECT COUNT(*) FROM keywords WHERE workflow_id = '<workflow_id>';
   ```

2. **API logs:**
   ```bash
   tail -f /var/log/api.log | grep competitor-analyze
   ```

3. **Supabase logs:**
   Check Supabase dashboard for transaction errors or RLS violations

4. **Network:**
   ```bash
   curl -v http://localhost:3000/api/intent/workflows/<id>/steps/competitor-analyze
   ```

---

## Final Verdict

**You can ship when:**

✔ Test 1: 1 winner, 2 conflicts, correct final state  
✔ Test 2: State reflects reality (PROCESSING during, COMPLETED after)  
✔ Test 3: Failure leaves clean FAILED state  
✔ Test 4: 1 winner, 19 conflicts under 20 concurrent calls  

**If all four hold under real database pressure, the workflow engine is production-ready.**

No more architecture reasoning. Just raw concurrent database proof.
