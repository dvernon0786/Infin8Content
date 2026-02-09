# Story 36.3: Validate Cluster Structure and Semantic Coherence

**Status:** ready-for-dev

---

## Story Classification

* **Type:** Producer (cluster validation processor)
* **Epic:** 36 – Keyword Refinement & Topic Clustering
* **Tier:** Tier 1 (structural quality control)

---

## Business Intent

Validate that **hub-and-spoke keyword clusters** produced by clustering are **structurally sound and semantically coherent**, ensuring only viable topic structures proceed to downstream subtopic generation.

This step performs **validation only**.
It does **not** modify clusters, score editorial quality, or generate content.

---

## User Story

As a system,
I want to validate that each hub-and-spoke cluster is structurally and semantically valid,
So that only sound topic structures are eligible for downstream processing.

---

## Producer Dependency Check

* **Epic 34:** COMPLETED ✅
* **Epic 35:** COMPLETED ✅
* **Story 36.1 (Keyword Filtering):** COMPLETED ✅
* **Story 36.2 (Topic Clustering):** COMPLETED ✅
* Clustered keywords exist in `topic_clusters` 
* Workflow status is `step_6_clustering` 
* Organization + embedding context available

**Blocking Decision:** **ALLOWED**

---

## Scope Definition

### In Scope

* Structural cluster validation
* Semantic similarity verification (hub ↔ spokes)
* Binary valid / invalid determination
* Validation result persistence
* Workflow state progression
* Audit logging

### Explicitly Out of Scope

* ❌ Cluster modification or repair
* ❌ Cluster rebalancing
* ❌ Editorial quality scoring
* ❌ Topic prioritization
* ❌ Approval gates
* ❌ UI events
* ❌ Workflow JSON storage

---

## Acceptance Criteria

1. **Given** keyword clusters exist
   **When** cluster validation is triggered
   **Then** the system validates each cluster for structural correctness

2. **And** the system verifies spoke keywords are semantically related to their hub

3. **And** clusters failing validation are marked **invalid**

4. **And** validation results are persisted for audit and review

5. **And** valid clusters are **eligible** (not auto-approved) for downstream subtopic generation

6. **And** the workflow status updates to `step_7_validation` 

---

## Validation Rules

### 1️⃣ Cluster Size Validation

* **Minimum size:**

  * 1 hub + 2 spokes
* **Maximum spokes:**

  * Inherited from Story 36.2 configuration (default: 8)

Clusters outside this range are **INVALID**.

---

### 2️⃣ Semantic Coherence Validation

* Calculate semantic similarity between each spoke and its hub
* Use embedding-based cosine similarity
* **Minimum similarity threshold:** `0.6` (configurable per organization)

Any spoke below threshold invalidates the cluster.

---

### 3️⃣ Observability Metrics (Non-Blocking)

The system may calculate and store:

* Average hub↔spoke similarity
* Cluster size metrics

⚠️ These metrics **do not gate progression** and are used only for analysis and future optimization.

---

## Database Behavior (Doc-Compliant)

### Tables Used

* **topic_clusters** – cluster relationships
* **keywords** – keyword metadata
* **intent_workflows** – workflow state only
* **cluster_validation_results** (NEW) – validation outcomes

---

### New Table: `cluster_validation_results` 

```sql
CREATE TABLE cluster_validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id),
  hub_keyword_id UUID NOT NULL REFERENCES keywords(id),
  validation_status TEXT NOT NULL CHECK (validation_status IN ('valid', 'invalid')),
  avg_similarity DECIMAL,
  spoke_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (workflow_id, hub_keyword_id)
);
```

✔ No JSON blobs stored in workflow rows
✔ Fully normalized validation records

---

## Workflow State Management

### Success

* Update `intent_workflows.status` → `step_7_validation` 
* Set `step_7_validation_completed_at` 
* Store:

  * `valid_cluster_count` 
  * `invalid_cluster_count` 

### Failure

* Store `step_7_validation_error_message` 
* Leave workflow at `step_6_clustering` 

---

## API Contract

### Endpoint

```
POST /api/intent/workflows/{workflow_id}/steps/validate-clusters
```

### Request

```json
{
  "workflow_id": "uuid"
}
```

### Response

```json
{
  "workflow_id": "uuid",
  "status": "step_7_validation",
  "total_clusters": 12,
  "valid_clusters": 10,
  "invalid_clusters": 2,
  "completed_at": "2026-02-01T12:34:56Z"
}
```

---

## Retry & Error Handling

### Retry Policy

* Retry **only** on transient failures (DB / embedding service)
* Max attempts: **3**
* Backoff: **2s → 4s → 8s**
* Hard timeout: **2 minutes**

### Error Cases

* Invalid workflow state → **409 Conflict**
* No clusters found → **400 Bad Request**
* Embedding service failure → retried, then failed

---

## Audit Logging

### Start

```
action: 'workflow.cluster_validation.started'
```

### Completion

```
action: 'workflow.cluster_validation.completed'
```

Audit details include:

* workflow_id
* total_clusters
* valid_clusters
* invalid_clusters

---

## Contracts Required

* **C1:** Cluster validation endpoint
* **C2/C4/C5:** `topic_clusters`, `keywords`, `cluster_validation_results`, `intent_workflows` 
* **Terminal State:** `step_7_validation` 
* **UI Boundary:** No UI events
* **Analytics:** Terminal audit events only

---

## Contracts Modified

* **None**

---

## Contracts Guaranteed

* ✅ No UI events emitted
* ✅ No intermediate analytics
* ✅ No state mutation outside producer boundary
* ✅ Idempotent re-execution
* ✅ Retry rules enforced

---

## Architecture Compliance

### Principles Respected

* Producer owns **validation only**
* Deterministic, reproducible rules
* Normalized data model
* Workflow table stores **state only**
* Clean separation from clustering and approvals

---

## File Structure

```
lib/services/intent-engine/
  └── cluster-validator.ts

app/api/intent/workflows/[workflow_id]/steps/
  └── validate-clusters/route.ts

__tests__/
  ├── services/intent-engine/cluster-validator.test.ts
  └── api/intent/workflows/validate-clusters.test.ts
```

---

## Idempotency Definition

Re-running validation:

* Clears prior validation results for the workflow
* Re-validates deterministically
* No duplicate rows created

---

## Testing Requirements

### Unit Tests

* Cluster size validation
* Semantic similarity enforcement
* Edge cases (small clusters, max size, low similarity)

### Integration Tests

* Workflow transition correctness
* Validation result persistence
* Idempotent re-execution

---

## Tasks/Subtasks

### Database Schema
- [x] Create cluster_validation_results table migration
- [x] Verify topic_clusters and keywords table structure supports validation

### Core Implementation  
- [x] Implement cluster validator service with structural validation rules
- [x] Implement semantic coherence validation using embedding cosine similarity
- [x] Implement cluster size validation (1 hub + 2-8 spokes)
- [x] Add similarity threshold enforcement (≥0.6 configurable)
- [x] Add retry logic with exponential backoff (2s → 4s → 8s)

### API Endpoint
- [x] Create POST /api/intent/workflows/{workflow_id}/steps/validate-clusters endpoint
- [x] Add workflow state validation (step_6_clustering required)
- [x] Add error handling for invalid states and missing clusters
- [x] Implement validation result persistence

### Workflow Integration
- [x] Update workflow status to step_7_validation on success
- [x] Add audit logging for started/completed events
- [x] Implement idempotency (clear prior validation results on re-run)
- [x] Store validation metrics (avg_similarity, spoke_count)

### Testing
- [x] Create unit tests for cluster size validation
- [x] Create unit tests for semantic similarity enforcement  
- [x] Create integration tests for API endpoint
- [x] Test edge cases (small clusters, max size, low similarity)

---

## Dev Notes

### Architecture Requirements
- Follow Intent Engine producer pattern (same as Stories 34.2, 35.1, 36.2)
- Use normalized data model (no JSON storage in workflows)
- Reuse embedding utilities from ICP generation (Epic 34)
- Implement deterministic validation for reproducible results

### Technical Dependencies
- Supabase client: `lib/supabase/server.ts`
- Embedding utilities: from ICP generation implementation
- Retry utilities: `lib/utils/retry-with-backoff.ts` (from Story 34.3)
- Audit logging: `lib/audit/log-action.ts`

### Database Constraints
- Validation results stored in cluster_validation_results table
- Each cluster gets one validation record per workflow
- Binary validation status: valid/invalid
- Similarity threshold: 0.6 (configurable)
- Cluster size: 1 hub + 2-8 spokes

---

## Dev Agent Record

### Implementation Plan
✅ **COMPLETED** - Implemented cluster validation service and API endpoint

### Debug Log
- Database schema created successfully with cluster_validation_results table
- Cluster validator service implemented with structural and semantic validation
- API endpoint created with proper authentication and workflow state validation
- Audit logging integrated for all validation events
- Unit tests created for cluster validator service (13 tests passing)
- Integration tests created for API endpoint
- Retry logic implemented using existing retry utilities from Story 34.3

### Completion Notes
✅ **Story 36.3 Successfully Implemented**

**Core Features Delivered:**
- Cluster size validation (1 hub + 2-8 spokes, configurable)
- Semantic coherence validation using cosine similarity (≥0.6 threshold, configurable)
- Binary validation outcomes (valid/invalid)
- Validation result persistence in cluster_validation_results table
- Workflow state progression from step_6_clustering to step_7_validation
- Comprehensive audit logging and error handling
- Idempotent validation with automatic cleanup of prior results
- Retry logic with exponential backoff (2s → 4s → 8s)
- Full test coverage for validation logic and API endpoint

---

## File List

**New Files Created:**
- supabase/migrations/20260201130000_add_cluster_validation_results_table.sql
- infin8content/lib/services/intent-engine/cluster-validator-types.ts
- infin8content/lib/services/intent-engine/cluster-validator.ts
- infin8content/app/api/intent/workflows/[workflow_id]/steps/validate-clusters/route.ts
- infin8content/__tests__/services/intent-engine/cluster-validator.test.ts
- infin8content/__tests__/api/intent/workflows/validate-clusters.test.ts

**Files Modified:**
- infin8content/types/audit.ts (added cluster validation audit actions)

---

## Change Log

**2026-02-01 - Story 36.3 Implementation Complete**
- Created cluster_validation_results database table with proper constraints
- Implemented ClusterValidator service with structural and semantic validation
- Created API endpoint POST /api/intent/workflows/{workflow_id}/steps/validate-clusters
- Added comprehensive unit tests (13 tests passing)
- Added integration tests for API endpoint
- Added audit logging actions for cluster validation events
- Implemented retry logic with exponential backoff
- Updated workflow state management for step_7_validation

---

## Status

done
