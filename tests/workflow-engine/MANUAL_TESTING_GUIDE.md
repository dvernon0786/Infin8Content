# Manual Testing Guide - Workflow Engine Concurrent Validation

**Workflow ID:** `63fc648d-1518-405a-8e17-05973c608c71`  
**Organization ID:** `4b124ab6-0145-49a5-8821-0652e25f4544`

---

## Step 1: Reset Workflow State

Run this SQL query in your Supabase console to reset the workflow to `COMPETITOR_PENDING`:

```sql
-- Reset workflow state to COMPETITOR_PENDING
UPDATE intent_workflows
SET 
  state = 'COMPETITOR_PENDING',
  updated_at = NOW()
WHERE 
  id = '63fc648d-1518-405a-8e17-05973c608c71'
  AND organization_id = '4b124ab6-0145-49a5-8821-0652e25f4544';

-- Delete all keywords for fresh start
DELETE FROM keywords
WHERE 
  workflow_id = '63fc648d-1518-405a-8e17-05973c608c71'
  AND organization_id = '4b124ab6-0145-49a5-8821-0652e25f4544';

-- Verify reset
SELECT state, updated_at FROM intent_workflows
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';
```

**Expected Result:**
```
state: COMPETITOR_PENDING
updated_at: <current timestamp>
```

---

## Step 2: Get Authentication Token

**Get your Supabase service role key:**

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the **Service Role Key** (not the anon key)
4. Set it as an environment variable:

```bash
export SUPABASE_KEY="your-service-role-key-here"
```

Or add it to your `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

---

## Step 3: Start Local Services

**Terminal 1 - Start API Server:**
```bash
cd /home/dghost/Desktop/Infin8Content/infin8content
npm run dev
```

Wait for: `✓ Ready in XXXms`

---

## Step 4: Test 1 - Atomicity (3 Concurrent Calls)

**Important:** All curl requests require the `Authorization: Bearer $SUPABASE_KEY` header

**What it proves:** Only one request can win the transition, others get 409 conflict

**Important:** The API requires authentication. Use the service role key to bypass auth for testing.

**Terminal 2, 3, 4 - Fire 3 concurrent requests:**

```bash
# Set your Supabase service role key
export SUPABASE_KEY="your-service-role-key-here"

# Terminal 2
curl -X POST http://localhost:3000/api/intent/workflows/63fc648d-1518-405a-8e17-05973c608c71/steps/competitor-analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -w "\nStatus: %{http_code}\n" &

# Terminal 3 (same time)
curl -X POST http://localhost:3000/api/intent/workflows/63fc648d-1518-405a-8e17-05973c608c71/steps/competitor-analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -w "\nStatus: %{http_code}\n" &

# Terminal 4 (same time)
curl -X POST http://localhost:3000/api/intent/workflows/63fc648d-1518-405a-8e17-05973c608c71/steps/competitor-analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -w "\nStatus: %{http_code}\n" &

wait
```

**Alternative: Use curl with Supabase auth cookie**

If you have a valid session, you can use:
```bash
curl -X POST http://localhost:3000/api/intent/workflows/63fc648d-1518-405a-8e17-05973c608c71/steps/competitor-analyze \
  -H "Content-Type: application/json" \
  -b "sb-auth-token=your-session-token" \
  -w "\nStatus: %{http_code}\n"
```

**Expected Results:**
```
✅ 1 response: Status: 200 (success)
✅ 2 responses: Status: 409 (conflict)
✅ Final state: COMPETITOR_COMPLETED
✅ Keywords: inserted exactly once (no duplicates)
```

**Verify in Database:**
```sql
-- Check final state
SELECT state FROM intent_workflows
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';

-- Count keywords (should be > 0, no duplicates)
SELECT COUNT(*) as keyword_count, COUNT(DISTINCT keyword) as unique_keywords
FROM keywords
WHERE workflow_id = '63fc648d-1518-405a-8e17-05973c608c71';
```

---

## Step 4: Test 2 - State Purity (Check State During Processing)

**Reset workflow first:**
```sql
UPDATE intent_workflows
SET state = 'COMPETITOR_PENDING'
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';

DELETE FROM keywords
WHERE workflow_id = '63fc648d-1518-405a-8e17-05973c608c71';
```

**Terminal 2 - Start extraction:**
```bash
curl -X POST http://localhost:3000/api/intent/workflows/63fc648d-1518-405a-8e17-05973c608c71/steps/competitor-analyze \
  -H "Content-Type: application/json"
```

**Terminal 3 - Check state during processing (within 1-2 seconds):**
```bash
# Run this query while extraction is running
SELECT state FROM intent_workflows
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';
```

**Expected Results:**
```
✅ During processing: state = COMPETITOR_PROCESSING
✅ After completion: state = COMPETITOR_COMPLETED
✅ Never: COMPLETED before work done
✅ Never: State jumps (always sequential)
```

---

## Step 5: Test 3 - Failure Handling

**Reset workflow:**
```sql
UPDATE intent_workflows
SET state = 'COMPETITOR_PENDING'
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';

DELETE FROM keywords
WHERE workflow_id = '63fc648d-1518-405a-8e17-05973c608c71';
```

**Terminal 2 - Call endpoint (will fail due to no competitors):**
```bash
curl -X POST http://localhost:3000/api/intent/workflows/63fc648d-1518-405a-8e17-05973c608c71/steps/competitor-analyze \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"
```

**Expected Results:**
```
✅ Status: 400 (error response)
✅ Final state: COMPETITOR_PENDING (no transition on error)
✅ Keywords: 0 (no partial insertion)
```

**Verify in Database:**
```sql
SELECT state FROM intent_workflows
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';

SELECT COUNT(*) FROM keywords
WHERE workflow_id = '63fc648d-1518-405a-8e17-05973c608c71';
```

---

## Step 6: Test 4 - Concurrency Safety (20 Concurrent Calls)

**Reset workflow:**
```sql
UPDATE intent_workflows
SET state = 'COMPETITOR_PENDING'
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';

DELETE FROM keywords
WHERE workflow_id = '63fc648d-1518-405a-8e17-05973c608c71';
```

**Terminal 2 - Fire 20 concurrent requests:**
```bash
# Set your Supabase service role key
export SUPABASE_KEY="your-service-role-key-here"

for i in {1..20}; do
  curl -X POST http://localhost:3000/api/intent/workflows/63fc648d-1518-405a-8e17-05973c608c71/steps/competitor-analyze \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -w "Request $i: %{http_code}\n" &
done
wait
```

**Expected Results:**
```
✅ 1 response: Status: 200 (success)
✅ 19 responses: Status: 409 (conflict)
✅ Final state: COMPETITOR_COMPLETED
✅ Keywords: inserted exactly once (no duplicates)
```

**Verify in Database:**
```sql
SELECT state FROM intent_workflows
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';

SELECT COUNT(*) as keyword_count, COUNT(DISTINCT keyword) as unique_keywords
FROM keywords
WHERE workflow_id = '63fc648d-1518-405a-8e17-05973c608c71';
```

---

## Summary: What to Report

After running all tests, report:

### Test 1: Atomicity (3 concurrent)
- [ ] 1 success (200)
- [ ] 2 conflicts (409)
- [ ] Final state: COMPETITOR_COMPLETED
- [ ] Keywords: > 0, no duplicates

### Test 2: State Purity
- [ ] State during processing: COMPETITOR_PROCESSING
- [ ] State after completion: COMPETITOR_COMPLETED
- [ ] No state jumps

### Test 3: Failure Handling
- [ ] Error response (400)
- [ ] Final state: COMPETITOR_PENDING (no transition)
- [ ] Keywords: 0

### Test 4: Concurrency Safety (20 concurrent)
- [ ] 1 success (200)
- [ ] 19 conflicts (409)
- [ ] Final state: COMPETITOR_COMPLETED
- [ ] Keywords: > 0, no duplicates

---

## Success Criteria

**✅ SHIP if:**
- All 4 tests pass
- 1 winner, N-1 conflicts under concurrency
- No duplicate keywords
- State reflects reality

**❌ FIX if:**
- Multiple successes = race condition
- Duplicate keywords = atomicity broken
- State corruption = purity broken
- Failure handling broken = no recovery path

---

## Debugging Commands

**Check current state:**
```sql
SELECT id, state, updated_at FROM intent_workflows
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';
```

**Check keywords:**
```sql
SELECT keyword, created_at FROM keywords
WHERE workflow_id = '63fc648d-1518-405a-8e17-05973c608c71'
ORDER BY created_at DESC;
```

**Check API logs:**
```bash
# Terminal 1 (where API is running)
# Look for [TransitionEngine] and [CompetitorAnalyze] logs
```

**Reset for next test:**
```sql
UPDATE intent_workflows SET state = 'COMPETITOR_PENDING' WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';
DELETE FROM keywords WHERE workflow_id = '63fc648d-1518-405a-8e17-05973c608c71';
```
