# Story 37.4: Maintain Complete Audit Trail of All Decisions

**Status:** ready-for-dev
**Epic:** 37 – Content Topic Generation & Approval
**Tier:** Tier 1 (Compliance & Governance Infrastructure)

---

## Story Classification

* **Type:** Producer (cross-cutting governance infrastructure)
* **Epic:** 37 – Content Topic Generation & Approval
* **Tier:** 1 (mandatory compliance foundation)

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

* **Audit Event Recording**

  * All auditable actions must emit a structured audit record
  * Actions include workflow state changes, approvals, rejections, blocks, failures, and article lifecycle events

### C2/C4/C5: System Contracts

* **Database**

  * New table: `intent_audit_logs` 
  * Organization-isolated via RLS
  * Append-only enforcement at database level
* **API**

  * Read-only query endpoint for audit logs
* **Auth**

  * Admin-only access for audit queries

### Terminal State Semantics

* No workflow or keyword state transitions are performed by this story
* Audit logging is **non-blocking** and **side-effect only**

### UI Boundary Rule

* ❌ No UI events emitted
* ❌ No UI state mutations

### Analytics Emission Constraint

* ❌ No analytics pipelines triggered
* Audit logging is not analytics

---

## Contracts Guaranteed

* ✅ No UI event emission
* ✅ No intermediate analytics emission
* ✅ No workflow or keyword state mutation outside producer boundary
* ✅ Idempotency respected (each audit entry is append-only)
* ✅ Retry rules honored (best-effort logging, failures do not block core flows)

---

## Producer Dependency Check

| Dependency                       | Status    |
| -------------------------------- | --------- |
| Epic 34 – ICP & Competitors      | COMPLETED |
| Epic 35 – Keywords               | COMPLETED |
| Epic 36 – Clustering             | COMPLETED |
| Story 37.1 – Subtopics           | COMPLETED |
| Story 37.2 – Subtopic Approval   | COMPLETED |
| Story 37.3 – Human Approval Gate | COMPLETED |

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

   * `organization_id` 
   * `workflow_id` (nullable for pre-workflow actions)
   * `entity_type` (`workflow` | `keyword` | `article`)
   * `entity_id` 
   * `actor_id` (user or system)
   * `action` (enum)
   * `details` (JSONB)
   * `ip_address` 
   * `user_agent` 
   * `created_at` 

3. **And** audit records are immutable:

   * No UPDATE or DELETE operations permitted
   * Enforced at database level via RLS and triggers

4. **And** audit records are queryable by:

   * `workflow_id` 
   * `actor_id` 
   * `action` 
   * date range

5. **And** audit records are retained for a **minimum of 1 year**

   * Records older than 1 year may be archived
   * Records are **never deleted**

---

## Mandatory Audit Events (Non-Optional)

### Workflow Events

* `workflow.created` 
* `workflow.archived` 
* `workflow.superseded` 
* `workflow.step.completed` 
* `workflow.step.failed` 
* `workflow.step.blocked` 

### Approval Events

* `workflow.approval.approved` 
* `workflow.approval.rejected` 
* `keyword.subtopics.approved` 
* `keyword.subtopics.rejected` 

### Article Events

* `article.queued` 
* `article.generated` 
* `article.failed` 

### System Events

* `system.error` 
* `system.retry_exhausted` 

---

## Data Model

```sql
Table: intent_audit_logs
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
```

---

## Immutability Enforcement

* RLS policies deny UPDATE and DELETE
* BEFORE UPDATE/DELETE trigger raises an exception
* No application code path may mutate audit records

---

## Tasks / Subtasks

### Task 1: Create Audit Log Schema

* Design `intent_audit_logs` table
* Add RLS policies for organization isolation
* Add immutability triggers
* Add indexes on:

  * `workflow_id` 
  * `actor_id` 
  * `action` 
  * `created_at` 

### Task 2: Implement Audit Logging Service

* Create `logIntentAction()` utility
* Capture IP address and user agent
* Integrate logging into:

  * Workflow transitions
  * Approvals and rejections
  * Hard-gate blocks
  * Article lifecycle events

### Task 3: Implement Audit Query API

* `GET /api/intent/audit/logs` 
* Filters:

  * workflow_id
  * actor_id
  * action
  * date range
* Pagination
* Admin-only access

### Task 4: Retention & Archival

* Define archival strategy for records > 1 year
* Implement archive job (no deletion)
* Archived records remain queryable by admins

---

## Out of Scope

* UI dashboards
* Editing or deleting audit records
* Replaying historical actions
* Analytics aggregation

---

## Final Status

✅ **Story 37.4 is fully canonical-template compliant and READY-FOR-DEV**

All mandatory sections present.
All contracts defined.
All dependencies validated.
Blocking decision explicitly ALLOWED.
