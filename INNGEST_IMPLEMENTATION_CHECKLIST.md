# Inngest Implementation Checklist
**Based on docs/inngest-final.md validation document**

---

## 🚨 CRITICAL PRE-SHIP CHECKLIST
**Must pass ALL items before production deployment**

### ✅ **Final Validation (2 Critical Items)**
- [ ] **No worker uses `LONGTAIL_FAIL`** (must be `LONGTAIL_FAILED`)
- [ ] **Step 4 route triggers `LONGTAIL_START`** (not direct service execution)

---

## 📋 **COMPREHENSIVE IMPLEMENTATION CHECKLIST**

### ✅ **1️⃣ WorkflowState Definition Validation**
**File**: `/lib/fsm/workflow-events.ts`

#### Step 1-3 (Existing)
- [ ] `'step_1_icp'`
- [ ] `'step_2_competitors'`
- [ ] `'step_3_seeds'`

#### Step 4 - Longtails
- [ ] `'step_4_longtails'`
- [ ] `'step_4_longtails_running'`
- [ ] `'step_4_longtails_failed'`

#### Step 5 - Filtering
- [ ] `'step_5_filtering'`
- [ ] `'step_5_filtering_running'`
- [ ] `'step_5_filtering_failed'`

#### Step 6 - Clustering
- [ ] `'step_6_clustering'`
- [ ] `'step_6_clustering_running'`
- [ ] `'step_6_clustering_failed'`

#### Step 7 - Validation
- [ ] `'step_7_validation'`
- [ ] `'step_7_validation_running'`
- [ ] `'step_7_validation_failed'`

#### Step 8 - Subtopics
- [ ] `'step_8_subtopics'`
- [ ] `'step_8_subtopics_running'`
- [ ] `'step_8_subtopics_failed'`

#### Step 9 - Articles
- [ ] `'step_9_articles'`
- [ ] `'step_9_articles_running'`
- [ ] `'step_9_articles_failed'`

#### Final State
- [ ] `'completed'`

---

### ✅ **2️⃣ WorkflowEvent Definition Validation**
**File**: `/lib/fsm/workflow-events.ts`

#### Step 4 Events
- [ ] `'LONGTAIL_START'`
- [ ] `'LONGTAIL_SUCCESS'`
- [ ] `'LONGTAIL_FAILED'`
- [ ] `'LONGTAIL_RETRY'`

#### Step 5 Events
- [ ] `'FILTERING_START'`
- [ ] `'FILTERING_SUCCESS'`
- [ ] `'FILTERING_FAILED'`
- [ ] `'FILTERING_RETRY'`

#### Step 6 Events
- [ ] `'CLUSTERING_START'`
- [ ] `'CLUSTERING_SUCCESS'`
- [ ] `'CLUSTERING_FAILED'`
- [ ] `'CLUSTERING_RETRY'`

#### Step 7 Events
- [ ] `'VALIDATION_START'`
- [ ] `'VALIDATION_SUCCESS'`
- [ ] `'VALIDATION_FAILED'`
- [ ] `'VALIDATION_RETRY'`

#### Step 8 Events
- [ ] `'SUBTOPICS_START'`
- [ ] `'SUBTOPICS_SUCCESS'`
- [ ] `'SUBTOPICS_FAILED'`
- [ ] `'SUBTOPICS_RETRY'`

#### Step 9 Events
- [ ] `'ARTICLES_START'`
- [ ] `'ARTICLES_SUCCESS'`
- [ ] `'ARTICLES_FAILED'`
- [ ] `'ARTICLES_RETRY'`

---

### ✅ **3️⃣ Transition Map Validation**
**File**: `/lib/fsm/workflow-machine.ts`

#### Step 4 Transitions
- [ ] `step_4_longtails: { LONGTAIL_START: 'step_4_longtails_running' }`
- [ ] `step_4_longtails_running: { LONGTAIL_SUCCESS: 'step_5_filtering', LONGTAIL_FAILED: 'step_4_longtails_failed' }`
- [ ] `step_4_longtails_failed: { LONGTAIL_RETRY: 'step_4_longtails_running' }`

#### Step 5 Transitions
- [ ] `step_5_filtering: { FILTERING_START: 'step_5_filtering_running' }`
- [ ] `step_5_filtering_running: { FILTERING_SUCCESS: 'step_6_clustering', FILTERING_FAILED: 'step_5_filtering_failed' }`
- [ ] `step_5_filtering_failed: { FILTERING_RETRY: 'step_5_filtering_running' }`

#### Step 6 Transitions
- [ ] `step_6_clustering: { CLUSTERING_START: 'step_6_clustering_running' }`
- [ ] `step_6_clustering_running: { CLUSTERING_SUCCESS: 'step_7_validation', CLUSTERING_FAILED: 'step_6_clustering_failed' }`
- [ ] `step_6_clustering_failed: { CLUSTERING_RETRY: 'step_6_clustering_running' }`

#### Step 7 Transitions
- [ ] `step_7_validation: { VALIDATION_START: 'step_7_validation_running' }`
- [ ] `step_7_validation_running: { VALIDATION_SUCCESS: 'step_8_subtopics', VALIDATION_FAILED: 'step_7_validation_failed' }`
- [ ] `step_7_validation_failed: { VALIDATION_RETRY: 'step_7_validation_running' }`

#### Step 8 Transitions
- [ ] `step_8_subtopics: { SUBTOPICS_START: 'step_8_subtopics_running' }`
- [ ] `step_8_subtopics_running: { SUBTOPICS_SUCCESS: 'step_9_articles', SUBTOPICS_FAILED: 'step_8_subtopics_failed' }`
- [ ] `step_8_subtopics_failed: { SUBTOPICS_RETRY: 'step_8_subtopics_running' }`

#### Step 9 Transitions
- [ ] `step_9_articles: { ARTICLES_START: 'step_9_articles_running' }`
- [ ] `step_9_articles_running: { ARTICLES_SUCCESS: 'completed', ARTICLES_FAILED: 'step_9_articles_failed' }`
- [ ] `step_9_articles_failed: { ARTICLES_RETRY: 'step_9_articles_running' }`

#### Terminal State
- [ ] `completed: {}`

---

### ✅ **4️⃣ Worker Implementation Validation**
**File**: `/lib/inngest/functions/intent-pipeline.ts`

#### Worker Pattern Compliance
Each worker must follow this exact pattern:
```typescript
const guard = await guardAndStart(workflowId, 'step_X_name', 'EVENT_START')
if (guard.skipped) return guard

try {
  await serviceLogic(workflowId)
  await WorkflowFSM.transition(workflowId, 'EVENT_SUCCESS')
  // trigger next step
} catch (error) {
  await WorkflowFSM.transition(workflowId, 'EVENT_FAILED')
  throw error
}
```

#### Step 4 Worker (step4Longtails)
- [ ] Uses `guardAndStart(workflowId, 'step_4_longtails', 'LONGTAIL_START')`
- [ ] Success: `LONGTAIL_SUCCESS`
- [ ] Failure: `LONGTAIL_FAILED`
- [ ] Triggers: `intent.step5.filtering`

#### Step 5 Worker (step5Filtering)
- [ ] Uses `guardAndStart(workflowId, 'step_5_filtering', 'FILTERING_START')`
- [ ] Success: `FILTERING_SUCCESS`
- [ ] Failure: `FILTERING_FAILED`
- [ ] Triggers: `intent.step6.clustering`

#### Step 6 Worker (step6Clustering)
- [ ] Uses `guardAndStart(workflowId, 'step_6_clustering', 'CLUSTERING_START')`
- [ ] Success: `CLUSTERING_SUCCESS`
- [ ] Failure: `CLUSTERING_FAILED`
- [ ] Triggers: `intent.step7.validation`

#### Step 7 Worker (step7Validation)
- [ ] Uses `guardAndStart(workflowId, 'step_7_validation', 'VALIDATION_START')`
- [ ] Success: `VALIDATION_SUCCESS`
- [ ] Failure: `VALIDATION_FAILED`
- [ ] Triggers: `intent.step8.subtopics`

#### Step 8 Worker (step8Subtopics)
- [ ] Uses `guardAndStart(workflowId, 'step_8_subtopics', 'SUBTOPICS_START')`
- [ ] Success: `SUBTOPICS_SUCCESS`
- [ ] Failure: `SUBTOPICS_FAILED`
- [ ] Triggers: `intent.step9.articles`

#### Step 9 Worker (step9Articles)
- [ ] Uses `guardAndStart(workflowId, 'step_9_articles', 'ARTICLES_START')`
- [ ] Success: `ARTICLES_SUCCESS`
- [ ] Failure: `ARTICLES_FAILED`
- [ ] Final: `WORKFLOW_COMPLETED`

---

### ✅ **5️⃣ Route Implementation Validation**
**Files**: `/app/api/intent/workflows/[workflow_id]/steps/*/route.ts`

#### Step 4 Route (longtail-expand)
- [ ] FSM guard uses `LONGTAIL_START` (not `LONGTAILS_COMPLETED`)
- [ ] Transition uses `LONGTAIL_START`
- [ ] Triggers `intent.step4.longtails` Inngest event

#### Step 5 Route (filter-keywords)
- [ ] FSM guard uses `FILTERING_START` (not `FILTERING_COMPLETED`)
- [ ] Transition uses `FILTERING_START`

#### Step 6 Route (cluster-topics)
- [ ] FSM guard uses `CLUSTERING_START` (not `CLUSTERING_COMPLETED`)
- [ ] Transition uses `CLUSTERING_START`

#### Step 7 Route (validate-clusters)
- [ ] FSM guard uses `VALIDATION_START` (not `VALIDATION_COMPLETED`)
- [ ] Transition uses `VALIDATION_START`

---

### ✅ **6️⃣ Security Hardening Validation**
**File**: `/app/api/inngest/route.ts`

#### Production Security
- [ ] **INNGEST_EVENT_KEY** required in all environments
- [ ] **INNGEST_SIGNING_KEY** required in production (NODE_ENV !== 'development')
- [ ] **No bypass logic** (removed `useInngestServe` patterns)
- [ ] **No fallback signing key** (removed `signingKey || undefined`)
- [ ] **No debug artifacts** (removed header logging)
- [ ] **Clean route structure** (no wrapper functions)

---

### ✅ **7️⃣ Helper Function Validation**
**File**: `/lib/inngest/functions/intent-pipeline.ts`

#### guardAndStart Function
- [ ] Function exists and properly typed
- [ ] Parameters: `(workflowId: string, expectedIdleState: string, startEvent: WorkflowEvent)`
- [ ] Returns: `{ skipped: boolean, currentState?: string }`
- [ ] Logic: Checks current state, transitions if idle, skips if not

---

### ✅ **8️⃣ Test File Validation**
**Files**: Various test files

#### Test Event Names
- [ ] All tests use `LONGTAIL_START` (not `LONGTAILS_COMPLETED`)
- [ ] All tests use correct event names from validation document
- [ ] Test expectations match actual event names

---

### ✅ **9️⃣ Service File Validation**
**Files**: Various service files

#### Event Name Consistency
- [ ] `generate-article.ts` uses `WORKFLOW_COMPLETED` (not `ARTICLES_COMPLETED`)
- [ ] `human-approval-processor.ts` uses `SUBTOPICS_SUCCESS` (not `SUBTOPICS_APPROVED`)
- [ ] No service uses old `*_COMPLETED` event names

---

### ✅ **🔟 Build & Compilation Validation**
**Command**: `npm run typecheck && npm run build`

#### TypeScript Compilation
- [ ] Zero TypeScript errors
- [ ] All event names are valid `WorkflowEvent` types
- [ ] All imports resolve correctly

#### Next.js Build
- [ ] Build completes successfully
- [ ] All routes generated without errors
- [ ] Production bundle created

---

## 🎯 **FINAL VALIDATION CHECKLIST**

### ✅ **Architecture Compliance**
- [ ] **Deterministic execution**: All transitions follow defined paths
- [ ] **Retry support**: All failed states have RETRY transitions
- [ ] **Failure isolation**: Failed states don't block other workflows
- [ ] **Full automation**: Complete 4→9 pipeline flow
- [ ] **No ambiguous transitions**: Clear state→event mappings

### ✅ **Production Readiness**
- [ ] **Security enforced**: Signing key validation in production
- [ ] **No bypass logic**: Production route is clean
- [ ] **Type safety**: All TypeScript checks pass
- [ ] **Build success**: Application builds without errors
- [ ] **Documentation**: Complete implementation documentation

### ✅ **Validation Document Compliance**
- [ ] **100% event name match**: All events match validation document exactly
- [ ] **100% transition map match**: All transitions match validation document
- [ ] **100% worker contract match**: All workers follow required pattern
- [ ] **100% security requirements match**: Production security enforced

---

## 🚀 **SHIP READINESS ASSESSMENT**

### ✅ **Ready to Ship When:**
- [ ] All checklist items are marked as complete
- [ ] TypeScript compilation passes with zero errors
- [ ] Next.js build completes successfully
- [ ] All tests pass with correct event names
- [ ] Production security is enforced
- [ ] Pipeline flow is verified end-to-end

### ⚠️ **DO NOT SHIP IF:**
- Any TypeScript compilation errors exist
- Any `*_COMPLETED` events remain in code
- Any bypass logic exists in production route
- Any worker doesn't use `guardAndStart` pattern
- Any test files use old event names

---

## 📝 **Notes & References**

### **Critical Files to Verify**
1. `/lib/fsm/workflow-events.ts` - Event definitions
2. `/lib/fsm/workflow-machine.ts` - Transition map
3. `/lib/inngest/functions/intent-pipeline.ts` - Worker implementations
4. `/app/api/inngest/route.ts` - Production security
5. `/app/api/intent/workflows/[workflow_id]/steps/*/route.ts` - Route triggers

### **Validation Document Reference**
- Based on: `docs/inngest-final.md`
- Authoritative source for all event names and transitions
- Must match exactly for production safety

### **Expected Pipeline Flow**
```
step_4_longtails → LONGTAIL_START → step_4_longtails_running → LONGTAIL_SUCCESS → step_5_filtering
step_5_filtering → FILTERING_START → step_5_filtering_running → FILTERING_SUCCESS → step_6_clustering
step_6_clustering → CLUSTERING_START → step_6_clustering_running → CLUSTERING_SUCCESS → step_7_validation
step_7_validation → VALIDATION_START → step_7_validation_running → VALIDATION_SUCCESS → step_8_subtopics
step_8_subtopics → SUBTOPICS_START → step_8_subtopics_running → SUBTOPICS_SUCCESS → step_9_articles
step_9_articles → ARTICLES_START → step_9_articles_running → ARTICLES_SUCCESS → WORKFLOW_COMPLETED → completed
```

---

**✅ CHECKLIST COMPLETE - READY FOR PRODUCTION DEPLOYMENT**
