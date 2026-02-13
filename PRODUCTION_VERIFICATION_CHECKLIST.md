# Production Verification Checklist

**Date:** 2026-02-14  
**Purpose:** Verify DataForSEO keyword extraction system is production-ready

## 🧪 Pre-Flight Checks

### Database Schema Verification
```sql
-- Run this query to verify all migrations applied
-- File: check-migration-status.sql

-- Expected: All missing_count = 0
| check_type                                         | missing_count |
| -------------------------------------------------- | ------------- |
| Missing metadata columns in keywords               | 0             |
| Missing audit columns in workflow_transition_audit | 0             |
| Missing competitor unique constraint               | 0             |
| Missing workflow_id in keywords                    | 0             |
| Missing keywords workflow unique constraint        | 0             |
```

### Service Restart
```bash
# Restart development server to refresh schema cache
npm run dev
```

## 🔬 End-to-End Test

### Test Scenario
1. **Create new workflow**
2. **Add competitors** (including additional ones via API)
3. **Run Step 2** - Competitor Analysis
4. **Verify Step 3** - Keyword Review

### Expected Logs
```
[CompetitorAnalyze] Found 1 workflow + 1 additional = 2 total competitors
[normalizeUrl] Normalized 'https://cloudmasonry.com' → 'cloudmasonry.com'
[DataForSEO DEBUG] Filtered 25 valid keywords from 25 total
[persistSeedKeywords] All 25 keywords are new for workflow
[CompetitorSeedExtractor] Created 25 seed keywords
[WorkflowAudit] SUCCESS
[CompetitorAnalyze] Successfully completed competitor analysis for workflow
```

### Expected Step 3 Results
```
25 keywords extracted from competitors
```

## 🛡️ Enterprise Safeguards Verification

### 1. URL Normalization
**Test:** Add competitors with different URL formats
```typescript
// These should all normalize to the same competitor
'https://cloudmasonry.com'
'http://cloudmasonry.com'  
'cloudmasonry.com/'
'www.cloudmasonry.com'
```

**Expected:** Only 1 competitor row created

### 2. Idempotent Operations
**Test:** Run Step 2 twice on same workflow
**Expected:** Second run should be rejected (workflow already completed)

### 3. Foreign Key Integrity
**Test:** Check all keywords have valid competitor_url_id
```sql
SELECT k.id, k.competitor_url_id, oc.id as competitor_exists
FROM keywords k
LEFT JOIN organization_competitors oc ON k.competitor_url_id = oc.id
WHERE oc.id IS NULL;
```

**Expected:** 0 rows

### 4. Workflow Isolation
**Test:** Verify keywords only belong to their workflow
```sql
SELECT workflow_id, COUNT(*) as keyword_count
FROM keywords
GROUP BY workflow_id
ORDER BY workflow_id;
```

**Expected:** Clean separation by workflow_id

## 🔍 Database Integrity Checks

### Keywords Table Validation
```sql
-- Check for required AI metadata columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'keywords' 
  AND column_name IN (
    'detected_language', 'is_foreign_language', 'main_intent', 'is_navigational',
    'foreign_intent', 'ai_suggested', 'user_selected', 'decision_confidence',
    'selection_source', 'selection_timestamp', 'workflow_id'
  )
ORDER BY column_name;

-- Verify unique constraint
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'keywords_workflow_unique';
```

### Audit Table Validation
```sql
-- Check audit columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'workflow_transition_audit' 
  AND column_name IN ('metadata', 'user_id')
ORDER BY column_name;

-- Verify audit logs are being created
SELECT COUNT(*) as audit_count, 
       new_state,
       transitioned_at::date as transition_date
FROM workflow_transition_audit
GROUP BY new_state, transitioned_at::date
ORDER BY transition_date DESC;
```

### Competitor Table Validation
```sql
-- Check unique constraint
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'organization_competitors_unique_org_url';

-- Verify URL normalization worked
SELECT url, domain, COUNT(*) as duplicate_count
FROM organization_competitors
GROUP BY url, domain
HAVING COUNT(*) > 1;
```

## 🚨 Error Scenarios to Test

### 1. Invalid Competitor URL
**Test:** Add malformed URL
**Expected:** Graceful error handling, continue processing other competitors

### 2. DataForSEO API Failure
**Test:** Mock API failure
**Expected:** Proper error logging, workflow transition to FAILED state

### 3. Database Constraint Violation
**Test:** Attempt to insert duplicate competitor
**Expected:** Upsert handles gracefully, no error

### 4. Audit Logging Failure
**Test:** Block audit table access
**Expected:** Workflow transition fails (hard failure enforced)

## 📊 Performance Benchmarks

### Expected Performance
- **Competitor Analysis:** < 10 seconds for 4 competitors
- **Keyword Extraction:** Up to 25 keywords per competitor
- **Database Operations:** < 1 second for upserts
- **Audit Logging:** < 100ms per transition

### Load Testing (Optional)
```bash
# Test with multiple concurrent workflows
for i in {1..5}; do
  # Create workflow and run Step 2
  # Monitor for race conditions
done
```

## ✅ Go/No-Go Decision

### Go Criteria (All Must Pass)
- [ ] Schema verification: All missing_count = 0
- [ ] End-to-end test: 25 keywords extracted and displayed
- [ ] URL normalization: No duplicate competitors
- [ ] FK integrity: 0 orphaned keyword records
- [ ] Workflow isolation: Clean separation by workflow_id
- [ ] Audit logging: Complete trail without errors
- [ ] Error handling: Graceful failure modes
- [ ] Performance: Within expected benchmarks

### No-Go Triggers
- Any missing_count > 0 in schema verification
- Step 3 shows 0 keywords
- Foreign key violations in logs
- Audit logging failures
- Race conditions in concurrent tests
- Performance > 2x expected benchmarks

## 🎯 Production Deployment Checklist

### Pre-Deployment
- [ ] All migrations applied to production database
- [ ] Schema verification query run in production
- [ ] Backup of production database taken
- [ ] Monitoring alerts configured for workflow failures
- [ ] Log aggregation configured for extraction errors

### Post-Deployment
- [ ] Monitor first 10 workflow executions
- [ ] Verify audit logs are being created
- [ ] Check for any schema cache errors
- [ ] Validate keyword persistence success rate
- [ ] Confirm Step 3 displays correct counts

## 📞 Emergency Rollback Plan

### If Issues Detected
1. **Stop new workflow creation**
2. **Rollback to previous commit**
3. **Verify database schema consistency**
4. **Resume workflow creation**
5. **Monitor for continued issues**

### Database Rollback (If Needed)
```sql
-- Remove added columns if necessary
-- Note: Only do this if data corruption detected
ALTER TABLE keywords DROP COLUMN IF EXISTS detected_language;
-- ... (other columns)
ALTER TABLE workflow_transition_audit DROP COLUMN IF EXISTS metadata;
ALTER TABLE workflow_transition_audit DROP COLUMN IF EXISTS user_id;
```

---

**Status:** Ready for production deployment upon successful completion of all verification checks.
