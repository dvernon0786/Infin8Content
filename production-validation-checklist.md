# Production Validation Checklist

## Phase 1: SQL Function Verification

### Verify Function Exists
```sql
SELECT proname
FROM pg_proc
WHERE proname = 'record_usage_increment_and_complete_step';
```

### Test Step 1 ICP Generation
Run ICP generation once and verify:
- ✅ No UUID errors
- ✅ No boolean errors  
- ✅ Ledger row created once
- ✅ Workflow current_step = 2

## Phase 2: Audit Trigger Check

### Verify Triggers Not Blocking INSERT
```sql
SELECT tgname, pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgrelid = 'intent_audit_logs'::regclass;
```
Should show: BEFORE UPDATE OR DELETE (not INSERT)

## Phase 3: Real Concurrency Test

### Get Auth Token
1. Log into app in browser
2. DevTools → Application → Cookies  
3. Copy `sb-access-token`

### Run Concurrency Test
```bash
TOKEN="PASTE_TOKEN"

for i in {1..20}; do
  curl -X POST \
    http://localhost:3000/api/intent/workflows/63fc648d-1518-405a-8e17-05973c608c71/steps/competitor-analyze \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" &
done
wait
```

Expected: 1 success, 19 blocked

## Phase 4: Validation Queries

### State Must Be Completed
```sql
SELECT state FROM intent_workflows
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';
```
Expect: COMPETITOR_COMPLETED

### Keywords Must Exist
```sql
SELECT COUNT(*) FROM keywords
WHERE workflow_id = '63fc648d-1518-405a-8e17-05973c608c71';
```
Must be > 0

### No Duplicates
```sql
SELECT keyword, COUNT(*)
FROM keywords
WHERE workflow_id = '63fc648d-1518-405a-8e17-05973c608c71'
GROUP BY keyword
HAVING COUNT(*) > 1;
```
Must return zero rows

## Success Criteria
| Check | Must Be |
|-------|---------|
| Step 1 ICP works | ✅ |
| No UUID errors | ✅ |
| Only 1 processing winner | ✅ |
| No duplicate keywords | ✅ |
| State matches reality | ✅ |

If all pass: SHIP READY
