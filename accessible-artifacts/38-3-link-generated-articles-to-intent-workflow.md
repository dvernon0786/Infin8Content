# Story 38-3: Link Generated Articles to Intent Workflow

**Status**: done  
**Date Created**: 2026-02-03  
**Epic**: 38 – Article Generation & Workflow Completion  
**Story ID**: 38.3

---

## Story Classification

- **Type**: Producer (article-workflow linking service)
- **Tier**: Tier 1 (foundational workflow completion step)
- **Epic**: 38 – Article Generation & Workflow Completion

---

## Business Intent

Establish bidirectional links between generated articles and their originating intent workflow, enabling complete traceability from keyword research through article generation while maintaining workflow state integrity and providing comprehensive audit trails.

---

## User Story

**As a** content manager,  
**I want to** link generated articles back to their intent workflow with full traceability,  
**So that** I can track the complete journey from keyword research to published articles and maintain workflow state integrity.

---

## Acceptance Criteria

1. **Given** articles are completed (status = 'completed' or 'published')  
   **When** the linking process runs  
   **Then** each article is linked to its originating intent workflow

2. **And** the workflow maintains a count of linked articles for progress tracking

3. **And** bidirectional references are established (articles → workflow, workflow → articles)

4. **And** the linking process is idempotent and can be re-run safely

5. **And** all linking actions are logged to the audit trail

6. **And** workflow state updates to reflect completion of article generation phase

---

## Contracts Required

### C1: API Endpoint
- **Endpoint**: `POST /api/intent/workflows/{workflow_id}/steps/link-articles`
- **Authentication**: Required (user must own workflow)
- **Authorization**: Organization isolation via RLS
- **Request**: Empty body (workflow_id from path)
- **Response**: Summary of linking results with counts and status

### C2/C4/C5: Database Operations
- **Read**: `articles` table (completed articles, workflow_id, subtopic_id)
- **Read**: `intent_workflows` table (workflow context, organization_id)
- **Write**: `articles` table (update workflow_link_status, linked_at)
- **Write**: `intent_workflows` table (update article_link_count, workflow status)
- **Write**: `intent_audit_logs` table (linking actions and results)

### Terminal State
- **Workflow State**: Updates to `step_10_completed` (final state)
- **Article States**: `workflow_link_status = 'linked'`, `linked_at` timestamp
- **Link Counts**: `article_link_count` updated in workflow record
- **Audit Trail**: Complete log of all linking actions

### UI Boundary
- **No UI events emitted** (backend-only linking process)
- **Status updates** via existing workflow tracking mechanisms
- **Progress visibility** through workflow status endpoint

### Analytics
- **No intermediate analytics** (only terminal state tracking)
- **Audit logging**: `workflow.articles.linked` events for each article
- **Summary events**: `workflow.article_linking.completed` for batch completion

---

## Contracts Modified

None (uses existing tables and fields, adds new fields only)

---

## Contracts Guaranteed

✅ **No UI events emitted** - Backend-only linking process  
✅ **No intermediate analytics** - Only audit logs for linking actions  
✅ **State mutation limited to producer** - Articles and workflow tables only  
✅ **Idempotency** - Re-running skips already linked articles, no duplicates  
✅ **Retry rules** - 3 attempts with exponential backoff (2s, 4s, 8s) for transient failures

---

## Producer Dependency Check

- **Epic 34 Status**: COMPLETED ✅
- **Epic 35 Status**: COMPLETED ✅
- **Epic 36 Status**: COMPLETED ✅
- **Epic 37 Status**: COMPLETED ✅
- **Story 38.1 Status**: COMPLETED ✅ (articles queued for generation)
- **Story 38.2 Status**: COMPLETED ✅ (progress tracking available)
- **Blocking Decision**: **ALLOWED** ✅

All upstream stories completed. Articles exist and are being generated with progress tracking.

---

## Technical Requirements

### API Endpoint Specification
```
POST /api/intent/workflows/{workflow_id}/steps/link-articles
```

**Request Parameters:**
- `workflow_id` (path): UUID of intent workflow

**Response Schema:**
```typescript
{
  workflow_id: UUID,
  linking_status: 'in_progress' | 'completed' | 'failed',
  total_articles: number,
  linked_articles: number,
  already_linked: number,
  failed_articles: number,
  workflow_status: string,
  processing_time_seconds: number,
  details: {
    linked_article_ids: UUID[],
    failed_article_ids: UUID[],
    skipped_article_ids: UUID[]
  }
}
```

### Database Schema Requirements

**articles table** (new fields to add):
```sql
ALTER TABLE articles ADD COLUMN workflow_link_status TEXT DEFAULT 'not_linked';
ALTER TABLE articles ADD COLUMN linked_at TIMESTAMP WITH TIME ZONE;
-- workflow_link_status values: 'not_linked', 'linking', 'linked', 'failed'
```

**intent_workflows table** (new fields to add):
```sql
ALTER TABLE intent_workflows ADD COLUMN article_link_count INTEGER DEFAULT 0;
ALTER TABLE intent_workflows ADD COLUMN article_linking_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE intent_workflows ADD COLUMN article_linking_completed_at TIMESTAMP WITH TIME ZONE;
```

### Service Layer Implementation

**File**: `lib/services/intent-engine/article-workflow-linker.ts`

**Core Functions:**
- `linkArticlesToWorkflow(workflowId)` - Main linking process
- `getCompletedArticlesForWorkflow(workflowId)` - Fetch articles ready for linking
- `linkSingleArticle(articleId, workflowId)` - Link individual article
- `updateWorkflowLinkCounts(workflowId, counts)` - Update workflow statistics
- `validateWorkflowForLinking(workflowId)` - Verify workflow is ready for linking
- `logLinkingAction(workflowId, articleId, action, details)` - Audit logging

### API Route Implementation

**File**: `app/api/intent/workflows/[workflow_id]/steps/link-articles/route.ts`

**Responsibilities:**
- Validate authentication and authorization
- Verify workflow is ready for linking (step_9_articles)
- Call article-workflow linker service
- Handle errors gracefully with partial success support
- Log audit events for all linking actions
- Return comprehensive linking results

### Linking Logic

**Eligibility Criteria:**
- Article status must be 'completed' or 'published'
- Article workflow_link_status must be 'not_linked'
- Article must belong to the specified workflow_id
- Workflow must be at step_9_articles state

**Linking Process:**
1. Fetch all eligible articles for workflow
2. Process articles in batches (10 per batch for performance)
3. For each article:
   - Update workflow_link_status to 'linking'
   - Establish bidirectional reference
   - Set linked_at timestamp
   - Update workflow_link_status to 'linked'
4. Update workflow article_link_count
5. Update workflow status to step_10_completed
6. Log all actions to audit trail

**Error Handling:**
- Individual article failures don't stop the process
- Failed articles marked with workflow_link_status = 'failed'
- Comprehensive error details logged
- Partial success responses with full breakdown

### Performance Requirements

- **Processing Time**: < 30 seconds for 100 articles
- **Batch Size**: 10 articles per database transaction
- **Database Optimization**: Index on (workflow_id, status, workflow_link_status)
- **Concurrent Processing**: Support multiple workflows simultaneously

### Audit Logging

**Audit Events:**
- `workflow.articles.linking.started` - When linking process begins
- `workflow.article.linked` - For each successfully linked article
- `workflow.article.link_failed` - For each failed linking attempt
- `workflow.articles.linking.completed` - When entire process completes

**Audit Fields:**
- `actor_id`: User ID who triggered linking
- `workflow_id`: Workflow being processed
- `article_id`: Individual article being linked
- `linking_result`: Success/failure status
- `error_details`: Failure information if applicable
- `processing_time`: Time taken for linking operation

---

## Implementation Notes

### Architecture Patterns

1. **Batch Processing**: Process articles in batches for performance
2. **Idempotent Design**: Safe to re-run, skips already linked articles
3. **Partial Success**: Individual failures don't stop entire process
4. **Bidirectional Links**: Both articles and workflows maintain references
5. **Audit Trail**: Complete logging of all linking actions

### Integration Points

1. **Story 38.1**: Consumes articles created by queue service
2. **Story 38.2**: Works with progress tracking data
3. **Article Generation Pipeline**: Links completed articles back to workflow
4. **Audit System**: Logs all linking actions for compliance
5. **Workflow Engine**: Updates final workflow state

### Data Flow

```
User Trigger
  ↓
POST /api/intent/workflows/{id}/steps/link-articles
  ↓
Validate Auth + Authorization
  ↓
Check Workflow State (step_9_articles)
  ↓
Fetch Completed Articles for Workflow
  ↓
Process Articles in Batches
  ↓
Update Article workflow_link_status + linked_at
  ↓
Update Workflow article_link_count + status
  ↓
Log All Actions to Audit Trail
  ↓
Return Linking Summary
```

### Testing Strategy

**Unit Tests** (`__tests__/services/intent-engine/article-workflow-linker.test.ts`):
- Article eligibility validation
- Batch processing logic
- Workflow count updates
- Error handling scenarios
- Idempotency verification

**Integration Tests** (`__tests__/api/intent/workflows/link-articles.test.ts`):
- Full API flow with authentication
- Workflow state validation
- Batch processing with multiple articles
- Partial success scenarios
- Audit logging verification

**E2E Tests** (separate story - 39.6):
- Dashboard integration
- Workflow completion visualization
- Error recovery scenarios

### Known Limitations

1. **Performance**: Large workflows (1000+ articles) may take longer
2. **Concurrent Generation**: Articles still generating won't be linked
3. **Manual Overrides**: No manual unlink/relink capability (future enhancement)
4. **Historical Data**: Only links articles generated after workflow system

---

## Tasks & Subtasks

### Task 1: Create Database Migration
- [ ] 1.1 Create migration for articles table new fields
- [ ] 1.2 Create migration for intent_workflows table new fields
- [ ] 1.3 Add database indexes for performance optimization
- [ ] 1.4 Test migration and rollback procedures

### Task 2: Create Article-Workflow Linker Service
- [ ] 2.1 Create `lib/services/intent-engine/article-workflow-linker.ts`
- [ ] 2.2 Implement `linkArticlesToWorkflow(workflowId)` main function
- [ ] 2.3 Implement `getCompletedArticlesForWorkflow(workflowId)` function
- [ ] 2.4 Implement `linkSingleArticle(articleId, workflowId)` function
- [ ] 2.5 Implement `updateWorkflowLinkCounts(workflowId, counts)` function
- [ ] 2.6 Implement `validateWorkflowForLinking(workflowId)` function
- [ ] 2.7 Implement `logLinkingAction(workflowId, articleId, action, details)` function

### Task 3: Create API Endpoint
- [ ] 3.1 Create `app/api/intent/workflows/[workflow_id]/steps/link-articles/route.ts`
- [ ] 3.2 Implement authentication and authorization validation
- [ ] 3.3 Implement workflow state validation (step_9_articles required)
- [ ] 3.4 Implement article-workflow linker service integration
- [ ] 3.5 Implement batch processing with error isolation
- [ ] 3.6 Implement comprehensive audit logging
- [ ] 3.7 Implement response formatting with detailed results

### Task 4: Add Audit Actions
- [ ] 4.1 Update `types/audit.ts` with article linking audit actions
- [ ] 4.2 Add `WORKFLOW_ARTICLES_LINKING_STARTED` action
- [ ] 4.3 Add `WORKFLOW_ARTICLE_LINKED` action
- [ ] 4.4 Add `WORKFLOW_ARTICLE_LINK_FAILED` action
- [ ] 4.5 Add `WORKFLOW_ARTICLES_LINKING_COMPLETED` action

### Task 5: Create Unit Tests
- [ ] 5.1 Create `__tests__/services/intent-engine/article-workflow-linker.test.ts`
- [ ] 5.2 Test article eligibility validation
- [ ] 5.3 Test batch processing logic
- [ ] 5.4 Test workflow count updates
- [ ] 5.5 Test error handling scenarios
- [ ] 5.6 Test idempotency verification
- [ ] 5.7 Test audit logging functionality

### Task 6: Create Integration Tests  
- [ ] 6.1 Create `__tests__/api/intent/workflows/link-articles.test.ts`
- [ ] 6.2 Test full API flow with authentication
- [ ] 6.3 Test workflow state validation
- [ ] 6.4 Test batch processing with multiple articles
- [ ] 6.5 Test partial success scenarios
- [ ] 6.6 Test audit logging verification
- [ ] 6.7 Test error scenarios and recovery

### Task 7: Update Documentation
- [ ] 7.1 Update `docs/api-contracts.md` with article linking endpoint documentation
- [ ] 7.2 Update `docs/development-guide.md` with article linking patterns
- [ ] 7.3 Update story status in sprint-status.yaml to "ready-for-dev"

---

## Files to be Created

1. `lib/services/intent-engine/article-workflow-linker.ts` - Core service
2. `app/api/intent/workflows/[workflow_id]/steps/link-articles/route.ts` - API endpoint
3. `__tests__/services/intent-engine/article-workflow-linker.test.ts` - Unit tests
4. `__tests__/api/intent/workflows/link-articles.test.ts` - Integration tests
5. `supabase/migrations/[timestamp]_add_article_workflow_linking_fields.sql` - Database migration

---

## Files to be Modified

1. `types/audit.ts` - Add article linking audit actions
2. `docs/api-contracts.md` - Document article linking endpoint
3. `docs/development-guide.md` - Add article linking patterns
4. `accessible-artifacts/sprint-status.yaml` - Update story status to ready-for-dev

---

## Dependencies

### External Services
- Supabase Postgres (articles, intent_workflows tables)
- Inngest (article generation completion events)

### Internal Services
- Authentication service (getCurrentUser)
- Authorization service (RLS policies)
- Audit logging service (logActionAsync)

### Previous Stories
- Story 38.1 (Queue Approved Subtopics) - COMPLETED ✅
- Story 38.2 (Track Article Generation Progress) - COMPLETED ✅
- Story 37.4 (Audit Trail) - COMPLETED ✅

---

## Priority & Effort

- **Priority**: High
- **Story Points**: 8
- **Target Sprint**: Current sprint
- **Estimated Implementation Time**: 6-8 hours

---

## Success Criteria

✅ All completed articles are linked to their workflow  
✅ Workflow state updates to final completion state  
✅ Bidirectional references established and maintained  
✅ Linking process is idempotent and re-runnable  
✅ All linking actions logged to audit trail  
✅ Partial success handling for individual article failures  
✅ Performance requirements met (<30s for 100 articles)  
✅ Tests cover happy path and error scenarios  
✅ Documentation complete and accurate

---

## Out of Scope

- Manual unlink/relink operations (future enhancement)
- Historical article linking for pre-workflow articles
- Real-time linking during article generation
- Bulk unlink operations
- Linking validation rules beyond basic eligibility
- Workflow state rollback after linking

---

## Related Stories

- **Story 38.1**: Queue Approved Subtopics for Article Generation (COMPLETED)
- **Story 38.2**: Track Article Generation Progress (COMPLETED)
- **Story 39.6**: Create Workflow Status Dashboard (backlog)
- **Story 37.4**: Maintain Complete Audit Trail (COMPLETED)

---

## Architecture Compliance

✅ Follows existing Intent Engine patterns  
✅ Respects organization isolation (RLS)  
✅ No UI events emitted (backend-only)  
✅ Proper error handling and logging  
✅ Idempotent design with safe re-runs  
✅ Audit trail integration  
✅ Performance optimized (batch processing)  
✅ Partial success support

---

## Blocking Decision

**ALLOWED** ✅

All dependencies met. Stories 38.1 and 38.2 completed with articles in pipeline and progress tracking available. Ready for development.

---

## Validation Summary

**Status**: ✅ **APPROVED - READY FOR DEVELOPMENT**  
**Date**: 2026-02-03  
**Validator**: SM Agent (Bob)  

### Validation Results

✅ **Story Completeness & Template Compliance** - PASS  
✅ **Architectural Alignment** - PASS  
✅ **Contracts & Data Model Validation** - PASS  
✅ **Workflow State Integrity** - PASS  
✅ **Idempotency & Retry Safety** - PASS  
✅ **Audit & Analytics Compliance** - PASS  
✅ **Testing Strategy** - PASS  
✅ **Performance & Scalability** - PASS  

### Key Validation Points

- **No architectural violations** - Follows Infin8Content patterns perfectly
- **No contract conflicts** - Clean API extension without breaking changes  
- **No data integrity risks** - Additive database changes only
- **Fully aligned with platform standards** - Service-oriented, RLS isolated, audit-first
- **Safe to implement immediately** - All dependencies met, no blockers

### Minor Recommendations (Non-blocking)

1. Consider adding `article_linking_started_at` and `article_linking_completed_at` in transaction with workflow status for tighter atomicity
2. Optional future enhancement: Emit structured audit summary object in addition to per-article logs

**Final Verdict**: Story 38.3 is correctly scoped, well-specified, and production-grade.

---

## Status

**ready-for-dev** (Validation Approved ✅)

---

## Sign-Off

**SM Agent**: Bob  
**Date**: 2026-02-03  
**Validation**: Story template compliance verified ✅  
**Dependencies**: All upstream stories completed ✅  
**Contracts**: Canonical template fully populated ✅
