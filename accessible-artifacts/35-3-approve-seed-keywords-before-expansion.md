# Story 35.3: Approve Seed Keywords Before Expansion

**Status:** ready-for-dev

---

## Story Classification

**Type:** Governance / Control (Human-in-the-loop approval gate)
**Tier:** Tier 1 (critical quality control)
**Epic:** 35 – Keyword Research & Expansion

---

## Business Intent

Introduce a **mandatory human approval gate** for seed keywords before long-tail expansion, ensuring that only relevant, high-quality seeds are eligible for downstream processing.

This story **does not generate keywords** and **does not advance the workflow step**.
It authorizes downstream execution only.

---

## Story

As a content manager,
I want to review and approve seed keywords before they are expanded,
so that only relevant keywords are eligible for long-tail generation.

---

## Scope Definition

### In Scope

* Human approval or rejection of extracted seed keywords
* Optional partial approval (subset of seeds)
* Persistent approval record per workflow
* Audit trail of approval decisions
* Authorization gate for Story 35.2 execution

### Explicitly Out of Scope

* Long-tail keyword generation
* Workflow step advancement
* UI implementation (handled by separate story)
* Any producer logic
* Keyword mutation or deletion

---

## Producer Dependency Check

**Epic 34 Status:** COMPLETED ✅
**Story 35.1 (Seed Extraction):** COMPLETED ✅

**Dependencies Met:**

* Seed keywords exist in `keywords` table
* Workflow is at `step_3_seeds` 
* Intent workflow infrastructure exists

**Blocking Decision:** **ALLOWED**

---

## Acceptance Criteria

1. **Given** seed keywords exist for a workflow at `step_3_seeds` 
2. **When** an authorized user submits an approval decision
3. **Then** the system creates or updates an approval record of type `seed_keywords` 
4. **And** the decision (`approved` or `rejected`) is persisted with approver context
5. **And** optional feedback is stored for reference
6. **And** if approved, the approved seed keyword IDs are marked eligible for expansion
7. **And** if rejected, seed keywords remain ineligible for expansion
8. **And** the workflow status remains `step_3_seeds` in all cases
9. **And** downstream expansion (Story 35.2) is blocked unless approval exists

---

## Contracts Required

### C1 — API Contract

**POST** `/api/intent/workflows/{workflow_id}/steps/approve-seeds` 

### C2 / C4 / C5 — Data Contracts

* `intent_approvals` table (approval persistence)
* `intent_workflows` (state validation only)
* `keywords` table (read-only eligibility reference)

### Terminal State

**None**
(This is an authorization gate, not a workflow-advancing step)

### Analytics

* `workflow.seed_keywords.approved` 
* `workflow.seed_keywords.rejected` 

---

## Contracts Modified

* **New table:** `intent_approvals` 
* **No workflow state changes**

---

## Contracts Guaranteed

* ✅ Idempotent approval (one record per workflow + approval_type)
* ✅ Partial approval supported
* ✅ Complete audit trail
* ✅ Workflow state integrity preserved
* ✅ No producer execution triggered

---

## API Specification

### Endpoint

```
POST /api/intent/workflows/{workflow_id}/steps/approve-seeds
```

### Request Body

```ts
{
  decision: 'approved' | 'rejected',
  feedback?: string,
  approved_keyword_ids?: string[] // optional subset approval
}
```

### Response

```ts
{
  success: boolean,
  approval_id: string,
  workflow_status: 'step_3_seeds',
  message: string
}
```

---

## Database Schema

```sql
CREATE TABLE intent_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id),
  approval_type TEXT NOT NULL, -- 'seed_keywords'
  decision TEXT NOT NULL, -- 'approved' | 'rejected'
  approver_id UUID NOT NULL REFERENCES users(id),
  feedback TEXT,
  approved_items JSONB, -- array of approved seed keyword IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workflow_id, approval_type)
);
```

---

## Business Logic Rules

1. **Validation**

   * Workflow must be at `step_3_seeds` 
   * Seed keywords must exist

2. **Authorization**

   * User must be authenticated
   * User must be organization admin

3. **Decision Handling**

   * Approved → approval record persisted
   * Rejected → approval record persisted
   * Re-approval updates existing record

4. **Execution Gate**

   * Story 35.2 MUST check for an approved `seed_keywords` approval before running

---

## Error Handling

| Scenario               | Response |
| ---------------------- | -------- |
| Invalid workflow state | 400      |
| Unauthorized user      | 401      |
| Forbidden (non-admin)  | 403      |
| Invalid keyword IDs    | 400      |
| Database failure       | 500      |

---

## Audit Logging

```ts
logActionAsync({
  orgId,
  userId,
  action: decision === 'approved'
    ? 'workflow.seed_keywords.approved'
    : 'workflow.seed_keywords.rejected',
  details: {
    workflow_id,
    approved_keyword_ids,
    feedback
  }
})
```

---

## Architecture Compliance

### Principles Respected

* Clear separation of governance vs execution
* Deterministic workflow progression
* No cross-step coupling
* No producer misuse
* Human-in-the-loop correctly isolated

---

## File Structure

### New Files

```
app/api/intent/workflows/[workflow_id]/steps/approve-seeds/route.ts
lib/services/intent-engine/seed-approval-processor.ts
__tests__/services/intent-engine/seed-approval-processor.test.ts
__tests__/api/intent/workflows/approve-seeds.test.ts
supabase/migrations/20260201_add_intent_approvals_table.sql
```

### Modified Files

```
types/audit.ts
docs/api-contracts.md
docs/development-guide.md
accessible-artifacts/sprint-status.yaml
```

---

## Testing Requirements

### Unit Tests

* Approval persistence
* Authorization enforcement
* Partial approval logic
* Idempotent updates

### Integration Tests

* API authentication
* Workflow state validation
* Approval gating behavior
* Audit event emission

---

## Success Criteria

### Functional

* Approval decisions recorded correctly
* Workflow state unchanged
* Downstream expansion correctly gated

### Business

* Seed quality enforced
* Expansion accuracy improved
* Human trust restored in pipeline

---

## Tasks/Subtasks

### Database Layer
- [x] Create `intent_approvals` table migration with proper constraints and RLS
- [x] Add audit actions for seed keyword approval/rejection

### Service Layer  
- [x] Implement `seed-approval-processor.ts` with validation and persistence logic
- [x] Add authorization checks (authenticated + organization admin)
- [x] Implement idempotent approval updates
- [x] Add partial approval support (subset of keyword IDs)

### API Layer
- [x] Create `/api/intent/workflows/[workflow_id]/steps/approve-seeds` endpoint
- [x] Add request validation and error handling
- [x] Integrate with audit logging
- [x] Ensure workflow state remains unchanged

### Testing
- [x] Unit tests for approval processor business logic
- [x] Unit tests for authorization enforcement
- [x] Integration tests for API endpoint
- [x] Tests for idempotency and partial approval

### Documentation
- [x] Update API contracts documentation
- [x] Update development guide with approval workflow
- [x] Update sprint status to "review"

---

## Dev Notes

### Architecture Context
- This is a governance gate, NOT a workflow step - status remains `step_3_seeds`
- Uses existing patterns from Story 34.2 (competitor analysis) for authorization
- Follows audit logging patterns from existing intent workflow endpoints
- Must integrate with existing `keywords` table (no modifications needed)

### Key Technical Requirements
- Idempotent: One approval record per workflow + approval_type
- Authorization: User must be organization admin (role = 'admin')
- Validation: Workflow must be at `step_3_seeds` status
- No state changes: Workflow status unchanged
- Audit trail: Complete logging of decisions

### Integration Points
- `getCurrentUser()` for authentication
- `logActionAsync()` for audit logging  
- `intent_workflows` table for state validation
- `keywords` table for seed keyword existence
- Existing RLS patterns for organization isolation

---

## Dev Agent Record

### Implementation Plan
**Phase 1: Database Foundation**
- Create intent_approvals table with proper constraints
- Add audit actions for approval tracking
- Follow existing migration patterns for RLS

**Phase 2: Service Logic**  
- Build approval processor with validation logic
- Implement authorization checks using existing patterns
- Handle idempotent updates and partial approvals

**Phase 3: API Integration**
- Create API endpoint following existing workflow step patterns
- Integrate audit logging and error handling
- Ensure workflow state preservation

**Phase 4: Testing & Documentation**
- Comprehensive unit and integration tests
- Update documentation and sprint status

### Debug Log
*Session started: 2026-01-31*

### Completion Notes
*Implementation in progress...*

---

## File List

### New Files (6)
- `supabase/migrations/20260201_add_intent_approvals_table.sql`
- `lib/services/intent-engine/seed-approval-processor.ts`
- `app/api/intent/workflows/[workflow_id]/steps/approve-seeds/route.ts`
- `__tests__/services/intent-engine/seed-approval-processor.test.ts`
- `__tests__/api/intent/workflows/approve-seeds.test.ts`
- `accessible-artifacts/35-3-approve-seed-keywords-before-expansion.md`

### Modified Files (4)
- `types/audit.ts` (added seed keyword approval actions)
- `docs/api-contracts.md` (added endpoint documentation)
- `docs/development-guide.md` (added approval workflow section)
- `accessible-artifacts/sprint-status.yaml` (status updated to review)

---

## Change Log

### 2026-02-01 - Implementation Complete
- Created `intent_approvals` table with RLS policies and constraints
- Implemented `seed-approval-processor.ts` service with validation and auth
- Created `/api/intent/workflows/[workflow_id]/steps/approve-seeds` endpoint
- Added comprehensive unit and integration tests (420+ lines)
- Updated audit logging with seed keyword approval actions
- Updated API contracts and development guide documentation
- All 9 acceptance criteria fully implemented
- Ready for code review and merge

---

## Final Status

**Status:** done

---
