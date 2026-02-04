## Story Context: 37-4-maintain-complete-audit-trail-of-all-decisions

**Status**: ready-for-dev
**Date**: 2026-02-02
**Created by**: SM Agent (Bob)

### Summary
Successfully created and validated comprehensive story context for Story 37-4 following canonical SM template requirements. Story is now ready for development with complete contract specifications, acceptance criteria, and implementation guidance.

### Key Details
- **Epic**: 37 – Content Topic Generation & Approval
- **Type**: Producer (cross-cutting governance infrastructure)
- **Tier**: Tier 1 (mandatory compliance foundation)
- **Pattern**: Audit logging infrastructure (append-only, immutable records)

### Business Intent
Provide a compliance-grade, append-only audit system for the Intent Engine that records all critical system and human actions, preserves immutable historical records, enables traceability across workflows, approvals, and articles, and underpins hard-gate enforcement and rollback safety.

### Contracts Verified
- ✅ C1: Domain Contract (Audit Event Recording)
- ✅ C2/C4/C5: System Contracts (Database, API, Auth)
- ✅ Terminal State: No workflow/keyword state transitions (side-effect only)
- ✅ UI Boundary: No UI events emitted
- ✅ Analytics: No analytics pipelines triggered (audit ≠ analytics)

### Dependencies Confirmed
- Epic 34 (ICP & Competitors): COMPLETED ✅
- Epic 35 (Keywords): COMPLETED ✅
- Epic 36 (Clustering): COMPLETED ✅
- Story 37.1 (Subtopics): COMPLETED ✅
- Story 37.2 (Subtopic Approval): COMPLETED ✅
- Story 37.3 (Human Approval Gate): COMPLETED ✅

### Acceptance Criteria (5 total)
1. **Audit Record Creation**: All auditable actions write immutable records to `intent_audit_logs`
2. **Complete Data Capture**: Each record includes org_id, workflow_id, entity_type/id, actor_id, action, details, IP, user_agent, timestamp
3. **Immutability Enforcement**: No UPDATE/DELETE operations permitted (database-level enforcement)
4. **Query Capability**: Records queryable by workflow_id, actor_id, action, date range
5. **Retention Policy**: Minimum 1-year retention, archival after 1 year, never deleted

### Technical Specifications
- **Database**: New `intent_audit_logs` table with RLS organization isolation
- **API**: GET /api/intent/audit/logs (admin-only, read-only)
- **Service**: `logIntentAction()` utility for audit event recording
- **Immutability**: RLS policies + triggers prevent mutations
- **Retention**: Archive job for records >1 year (no deletion)

### Data Model
```sql
CREATE TABLE intent_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  workflow_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  actor_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Mandatory Audit Events (4 categories)
1. **Workflow Events**: created, archived, superseded, step.completed/failed/blocked
2. **Approval Events**: workflow.approval.approved/rejected, keyword.subtopics.approved/rejected
3. **Article Events**: queued, generated, failed
4. **System Events**: system.error, system.retry_exhausted

### Files Required (5 new, 2 modified)
**New**:
- supabase/migrations/[timestamp]_add_intent_audit_logs_table.sql
- lib/services/intent-engine/audit-logger.ts
- app/api/intent/audit/logs/route.ts
- __tests__/services/intent-engine/audit-logger.test.ts
- __tests__/api/intent/audit/logs.test.ts

**Modified**:
- types/audit.ts (add intent audit action types)
- docs/api-contracts.md (add audit endpoint documentation)

### Architecture Compliance
- Follows cross-cutting governance pattern
- Append-only, immutable audit trail
- Organization isolation via RLS
- Non-blocking logging (failures don't block core flows)
- Admin-only access for audit queries
- No workflow state mutations

### Implementation Tasks (4 tasks)
1. **Schema Creation**: Design table with RLS, triggers, indexes
2. **Service Implementation**: Create `logIntentAction()` utility
3. **API Endpoint**: Implement read-only audit query endpoint
4. **Retention Strategy**: Define archival job for 1+ year records

### Out of Scope
- UI dashboards for audit viewing
- Editing or deleting audit records
- Replaying historical actions
- Analytics aggregation pipelines
- Real-time audit streaming

### Testing Strategy
- Unit tests for audit logger service
- Integration tests for API endpoint
- Immutability enforcement tests
- Query filter tests
- Retention policy tests
- Security tests (admin-only access)

### Blocking Decision: ALLOWED
All dependencies met, contracts verified, story ready for development.

**Next Steps**: Story is ready-for-dev and can be picked up by development team.

---

## Story Classification

**Type**: Producer (cross-cutting governance infrastructure)
**Tier**: Tier 1 (mandatory compliance foundation)
**Epic**: 37 – Content Topic Generation & Approval

---

## User Story

As a compliance officer,
I want to view a complete, immutable audit trail of all workflow actions and decisions,
So that I can trace who performed which action, when it occurred, and why it occurred.

---

## Business Intent

Provide a **compliance-grade, append-only audit system** for the Intent Engine that records all critical system and human actions, preserves immutable historical records, enables traceability across workflows, approvals, and articles, and underpins hard-gate enforcement and rollback safety.

---

## Contracts Required

### C1: Domain Contract
- **Audit Event Recording**: All auditable actions must emit a structured audit record
- **Action Types**: Workflow state changes, approvals, rejections, blocks, failures, article lifecycle events

### C2/C4/C5: System Contracts
- **Database**: New `intent_audit_logs` table, organization-isolated via RLS, append-only enforcement
- **API**: Read-only query endpoint for audit logs
- **Auth**: Admin-only access for audit queries

### Terminal State Semantics
- No workflow or keyword state transitions performed
- Audit logging is **non-blocking** and **side-effect only**

### UI Boundary Rule
- ❌ No UI events emitted
- ❌ No UI state mutations

### Analytics Emission Constraint
- ❌ No analytics pipelines triggered
- Audit logging is not analytics

---

## Contracts Modified
- New table: `intent_audit_logs`
- No workflow state changes

---

## Contracts Guaranteed
- ✅ No UI event emission
- ✅ No intermediate analytics emission
- ✅ No workflow or keyword state mutation outside producer boundary
- ✅ Idempotency respected (each audit entry is append-only)
- ✅ Retry rules honored (best-effort logging, failures do not block core flows)

---

## Producer Dependency Check

| Dependency | Status |
|------------|---------|
| Epic 34 – ICP & Competitors | COMPLETED ✅ |
| Epic 35 – Keywords | COMPLETED ✅ |
| Epic 36 – Clustering | COMPLETED ✅ |
| Story 37.1 – Subtopics | COMPLETED ✅ |
| Story 37.2 – Subtopic Approval | COMPLETED ✅ |
| Story 37.3 – Human Approval Gate | COMPLETED ✅ |

All upstream producers completed.

---

## Blocking Decision

✅ **ALLOWED** — all producer dependencies satisfied and canonical template requirements met.

---

## Acceptance Criteria

1. **Given** a workflow is executing
   **When** any auditable action occurs
   **Then** the system writes a new record to `intent_audit_logs`

2. **And** each audit record includes:
   - `organization_id`
   - `workflow_id` (nullable for pre-workflow actions)
   - `entity_type` (`workflow` | `keyword` | `article`)
   - `entity_id`
   - `actor_id` (user or system)
   - `action` (enum)
   - `details` (JSONB)
   - `ip_address`
   - `user_agent`
   - `created_at`

3. **And** audit records are immutable:
   - No UPDATE or DELETE operations permitted
   - Enforced at database level via RLS and triggers

4. **And** audit records are queryable by:
   - `workflow_id`
   - `actor_id`
   - `action`
   - date range

5. **And** audit records are retained for a **minimum of 1 year**:
   - Records older than 1 year may be archived
   - Records are **never deleted**

---

## Technical Requirements

### Database Schema
```sql
CREATE TABLE intent_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  workflow_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  actor_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Service Implementation
- `logIntentAction()` utility function
- IP address and user agent capture
- Integration points for all auditable actions

### API Endpoint
- `GET /api/intent/audit/logs`
- Filters: workflow_id, actor_id, action, date range
- Pagination support
- Admin-only access enforcement

### Immutability Enforcement
- RLS policies deny UPDATE and DELETE
- BEFORE UPDATE/DELETE trigger raises exception
- No application code path may mutate audit records

---

## Mandatory Audit Events

### Workflow Events
- `workflow.created`
- `workflow.archived`
- `workflow.superseded`
- `workflow.step.completed`
- `workflow.step.failed`
- `workflow.step.blocked`

### Approval Events
- `workflow.approval.approved`
- `workflow.approval.rejected`
- `keyword.subtopics.approved`
- `keyword.subtopics.rejected`

### Article Events
- `article.queued`
- `article.generated`
- `article.failed`

### System Events
- `system.error`
- `system.retry_exhausted`

---

## Implementation Tasks

### Task 1: Create Audit Log Schema
- Design `intent_audit_logs` table
- Add RLS policies for organization isolation
- Add immutability triggers
- Add indexes on workflow_id, actor_id, action, created_at

### Task 2: Implement Audit Logging Service
- Create `logIntentAction()` utility
- Capture IP address and user agent
- Integrate logging into workflow transitions, approvals, hard-gate blocks, article lifecycle events

### Task 3: Implement Audit Query API
- `GET /api/intent/audit/logs`
- Filters: workflow_id, actor_id, action, date range
- Pagination
- Admin-only access

### Task 4: Retention & Archival
- Define archival strategy for records > 1 year
- Implement archive job (no deletion)
- Archived records remain queryable by admins

---

## Out of Scope

- UI dashboards for audit viewing
- Editing or deleting audit records
- Replaying historical actions
- Analytics aggregation pipelines
- Real-time audit streaming

---

## Priority: High
**Story Points**: 8
**Target Sprint**: Current sprint

---

## Files to be Created

**New**:
- `supabase/migrations/[timestamp]_add_intent_audit_logs_table.sql`
- `lib/services/intent-engine/audit-logger.ts`
- `app/api/intent/audit/logs/route.ts`
- `__tests__/services/intent-engine/audit-logger.test.ts`
- `__tests__/api/intent/audit/logs.test.ts`

**Modified**:
- `types/audit.ts` (add intent audit action types)
- `docs/api-contracts.md` (add audit endpoint documentation)

---

## Final Status

✅ **Story 37.4 is fully canonical-template compliant and READY-FOR-DEV**

All mandatory sections present.
All contracts defined.
All dependencies validated.
Blocking decision explicitly ALLOWED.
