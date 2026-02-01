# Story 37.3: Implement Human Approval Gate (Workflow-Level)

**Status**: ready-for-dev
**Date**: 2026-02-02
**Created by**: SM Agent (Bob)

---

## Story Context: 37-3-implement-human-approval-gate

**Epic**: 37 – Content Topic Generation & Approval
**Tier**: Tier 1 (critical quality control gate)

---

## User Story

As a content manager,
I want to perform a final human approval of a completed workflow,
So that I maintain ultimate editorial control before article generation begins.

---

## Story Classification

* **Type**: Governance / Control (Human-in-the-loop approval gate)
* **Pattern**: Workflow-level approval
* **Scope**: Entire workflow (final gate)
* **Tier**: Tier 1 (blocking quality control)

---

## Business Intent

Introduce a **final, mandatory human approval gate at the workflow level** after all keyword- and subtopic-level approvals are complete.

This ensures that:

* Editorial oversight is enforced before any article generation
* Only intentionally approved workflows proceed to content creation
* No automated system can bypass human judgment

This story **does not generate content** and **does not modify workflow payload data**.
It **only controls workflow progression via status transitions and approvals**.

---

## Explicit Architecture Decision (Locked)

* ✅ **Approval scope**: `intent_workflows` (workflow-level)
* ✅ **Approval persistence**: `intent_approvals` 
* ✅ **Keyword eligibility**: Read-only from `keywords.article_status = 'ready'` 
* ❌ **No keyword mutation**
* ❌ **No content generation**
* ❌ **No UI events**

Approval is **workflow-scoped**, providing final editorial control.

---

## Producer Dependency Check

* Epic 34 (ICP & Competitor Analysis): COMPLETED ✅
* Epic 35 (Keyword Research & Expansion): COMPLETED ✅
* Epic 36 (Keyword Refinement & Topic Clustering): COMPLETED ✅
* Story 37.1 (Subtopic Generation): COMPLETED ✅
* Story 37.2 (Subtopic Approval): COMPLETED ✅
* Keywords with `article_status = 'ready'` exist ✅
* **Workflow status = `step_7_subtopics`** ✅
* Organization context available ✅

**Blocking Decision**: **ALLOWED**

---

## Workflow State Model (Authoritative)

```
step_7_subtopics
        ↓
(step_8_approval)  ← ENTERED by this story (paused review state)
        ↓
step_9_articles    ← approved
```

Rejected workflows may be reset to any prior step.

---

## Scope Definition

### In Scope

* Final human approval of the entire workflow
* Workflow-level approval or rejection
* Optional reset to a previous step
* Full audit logging
* Workflow summary for human review

### Out of Scope

* Keyword or subtopic approval (handled by Story 37.2)
* Article generation
* Research or planning workflows
* Perplexity usage
* UI events or dashboard behavior
* Workflow payload mutation (only status changes)

---

## API Contracts

### 1. Workflow Summary (Read-Only)

```
GET /api/intent/workflows/{workflow_id}/steps/human-approval/summary
```

**Purpose**:
Provide a **complete, read-only summary** of the workflow for human review.

**Characteristics**:

* No side effects
* No approvals
* Cacheable
* Aggregates existing workflow data only

---

### 2. Human Approval Decision

```
POST /api/intent/workflows/{workflow_id}/steps/human-approval
```

**Request Body**:

```ts
{
  decision: 'approved' | 'rejected',
  feedback?: string,
  reset_to_step?: number // 1–7, required if rejected
}
```

---

## Acceptance Criteria

1. **Given** a workflow in `step_7_subtopics` with approved keywords
   **When** human approval is initiated
   **Then** the workflow enters `step_8_approval` and pauses for review

2. **And** the system provides a complete workflow summary including:

   * ICP document
   * Competitor analysis
   * Seed and longtail keywords
   * Topic clusters and validation results
   * All keywords with `article_status = 'ready'` 
   * Summary statistics

3. **And** an admin can approve or reject the entire workflow

4. **And if approved**

   * Workflow status updates to `step_9_articles` 
   * Approved keywords become eligible for article generation
   * Article generation is allowed to proceed (handled by later stories)

5. **And if rejected**

   * Workflow status resets to `step_{reset_to_step}` 
   * Rejection feedback is recorded
   * No articles are generated

6. **And** the approval decision is recorded in `intent_approvals` 
   with user ID, timestamp, decision, and feedback

---

## Data Model Interaction

### Read

* `intent_workflows` 

  * All workflow JSONB fields
  * Current status and metadata
* `keywords` 

  * Keywords with `article_status = 'ready'` 

### Write

* `intent_approvals` 
* `intent_workflows.status` 
* `intent_workflows.updated_at` 

No other tables are mutated.

---

## Approval Effects (Authoritative)

### Approved

```sql
intent_workflows.status = 'step_9_articles'
```

Meaning:

* Workflow is fully approved
* Article generation may proceed

---

### Rejected

```sql
intent_workflows.status = 'step_{reset_to_step}'
```

Meaning:

* Workflow returns to correction phase
* Feedback explains rejection reason

---

## Audit Logging

Create or upsert record in `intent_approvals`:

```json
{
  "approval_type": "human_approval",
  "entity_type": "workflow",
  "entity_id": "<workflow_id>",
  "decision": "approved | rejected",
  "feedback": "...",
  "reset_to_step": 5,
  "approved_by": "<user_id>",
  "approved_at": "<timestamp>"
}
```

Additional audit events:

* `workflow.human_approval.started` 
* `workflow.human_approval.approved` 
* `workflow.human_approval.rejected` 

---

## Idempotency Rules

* One approval per: `workflow_id + approval_type` 
* Re-approval overwrites prior decision
* No duplicate approval records

---

## Security & Validation

* Authentication required
* Admin access required
* Workflow must belong to user's organization
* Workflow must be in `step_7_subtopics` 
* `reset_to_step` must be between 1 and 7

---

## Files to Be Created

**Service Layer**

```
lib/services/intent-engine/human-approval-processor.ts
```

**API Layer**

```
app/api/intent/workflows/[workflow_id]/steps/human-approval/route.ts
app/api/intent/workflows/[workflow_id]/steps/human-approval/summary/route.ts
```

**Tests**

```
__tests__/services/intent-engine/human-approval-processor.test.ts
__tests__/api/intent/workflows/human-approval.test.ts
```

---

## Files to Be Modified

* `types/audit.ts` 
* `docs/api-contracts.md` 
* `docs/development-guide.md` 
* `accessible-artifacts/sprint-status.yaml` 

---

## Architecture Guardrails

* Follow intent engine pattern
* Workflow-level governance only
* No keyword mutation
* No UI events
* No content generation
* Complete audit trail required

---

## Final Status

### ✅ **Story 37.3 is now architecturally correct and READY-FOR-DEV**

This version:

* Resolves workflow-state contradictions
* Preserves governance intent
* Aligns cleanly with Stories 37.1 and 37.2
* Prevents deadlocks and implementation ambiguity
* Is safe to hand directly to developers

**Contracts Required**:
- C1: POST /api/intent/workflows/{workflow_id}/steps/human-approval endpoint
- C2/C4/C5: intent_workflows table (state management), intent_approvals table (approval persistence), keywords table (read-only eligibility reference)
- Terminal State: workflow.status = 'step_8_approval' (paused state), approval decision recorded
- UI Boundary: No UI events (backend only)
- Analytics: workflow.human_approval.started/completed/approved/rejected audit events

**Contracts Modified**: None (new endpoint only, uses existing tables)





* **Technical Foundation**: Reuses existing infrastructure and maintains consistency
* **Comprehensive Requirements**: All acceptance criteria with detailed implementation guidance
* **Developer Guardrails**: Clear constraints, validation rules, and security requirements
* **Testing Strategy**: Complete test coverage for all scenarios
* **Integration Points**: Clear connections to existing systems and data flows

**Implementation Ready**: All dependencies completed, patterns established, and comprehensive context provided for flawless development execution.

---

## Review Follow-ups (AI)

- [ ] [AI-Review][HIGH] Fix service test mocking issues - Supabase mock chain complexity causing test failures
- [ ] [AI-Review][MEDIUM] Update story File List to document actual implementation files created
- [ ] [AI-Review][LOW] Consider simplifying test mock structure or using integration test patterns
