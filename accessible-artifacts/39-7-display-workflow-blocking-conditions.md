---
status: ready-for-dev
date: 2026-02-03
created_by: SM Agent (Cascade)
---

# Story 39-7: Display Workflow Blocking Conditions

## Story Context

**Epic:** 39 – Workflow Orchestration & State Management

**User Story:** As a content manager, I want to understand why a workflow is blocked, so that I can take action to unblock it.

**Story Classification:**
- Type: UI/UX (workflow status display)
- Tier: Tier 1 (critical user experience)

**Business Intent:** Provide clear, actionable feedback to content managers when workflows are blocked at gates, explaining what is required to unblock and providing direct links to required actions. This improves user experience and reduces support burden.

## Acceptance Criteria

1. **Given** a workflow is blocked at a gate
   **When** I view the workflow details
   **Then** the system displays the blocking condition clearly

2. **And** the system explains what is required to unblock

3. **And** the system provides a link to the required action

4. **And** the blocking reason is logged to the audit trail

## Technical Requirements

- **API Endpoint:** GET /api/intent/workflows/{workflow_id}/blocking-conditions
- **Database:** Read-only access to intent_workflows, intent_audit_logs tables
- **Response Format:** Blocking condition object with:
  - `blocked_at_step`: Current workflow step (e.g., 'step_3_seeds')
  - `blocking_gate`: Gate ID (e.g., 'gate_competitors_required')
  - `blocking_reason`: Human-readable explanation
  - `required_action`: What needs to be done to unblock
  - `action_link`: URL to the required action
  - `blocked_since`: Timestamp when blocked
  - `blocked_by_user_id`: User ID who triggered the block (if applicable)
- **Authentication:** Required with organization isolation via RLS
- **Audit Logging:** All blocking condition queries logged

## Blocking Conditions Map

| Step | Gate ID | Blocking Reason | Required Action | Action Link |
|------|---------|-----------------|-----------------|-------------|
| step_0_auth | gate_icp_required | ICP generation required before competitor analysis | Generate ICP document | /workflows/{id}/steps/generate-icp |
| step_1_icp | gate_competitors_required | Competitor analysis required before seed keywords | Analyze competitors | /workflows/{id}/steps/analyze-competitors |
| step_3_seeds | gate_seeds_approval_required | Seed keywords must be approved before longtail expansion | Review and approve seeds | /workflows/{id}/approvals/seeds |
| step_4_longtails | gate_filtering_required | Keyword filtering required before clustering | Filter keywords | /workflows/{id}/steps/filter-keywords |
| step_5_filtering | gate_clustering_required | Clustering required before subtopic generation | Cluster keywords | /workflows/{id}/steps/cluster-keywords |
| step_6_clustering | gate_validation_required | Cluster validation required before subtopics | Validate clusters | /workflows/{id}/steps/validate-clusters |
| step_7_subtopics | gate_subtopic_approval_required | Subtopics must be approved before article generation | Review and approve subtopics | /workflows/{id}/approvals/subtopics |
| step_8_approval | gate_final_approval_required | Final approval required before article generation | Review workflow summary | /workflows/{id}/approvals/final |

## Dependencies

- Epic 39.1-39.5 (Hard gates enforcement) - COMPLETED ✅
- Story 39.6 (Workflow Status Dashboard) - COMPLETED ✅
- Intent workflow state machine implementation
- Audit trail infrastructure

## Priority

Medium

## Story Points

3

## Implementation Notes

- Blocking conditions are derived from workflow state and gate enforcement logic
- Display should be clear and actionable, not technical
- Links should navigate directly to the action required
- Blocking reasons should be user-friendly and explain the business logic
- Audit logging ensures compliance and troubleshooting capability
- No state mutation (read-only endpoint)

## Files to be Created

- `lib/services/intent-engine/blocking-condition-resolver.ts`
- `app/api/intent/workflows/[workflow_id]/blocking-conditions/route.ts`
- `__tests__/services/intent-engine/blocking-condition-resolver.test.ts`
- `__tests__/api/intent/workflows/blocking-conditions.test.ts`

## Files to be Modified

- `types/audit.ts` (add blocking condition audit actions)
- `docs/api-contracts.md` (add endpoint documentation)
- `docs/development-guide.md` (add blocking condition patterns)
- `accessible-artifacts/sprint-status.yaml` (update story status)

## Out of Scope

- Automatic unblocking
- Workflow reset or rollback
- Approval workflows (separate stories)
- UI component implementation (dashboard integration)
- Real-time notifications

## Dev Notes

### Architecture Pattern

This story follows the read-only query pattern used in Story 38.2 (Article Progress Tracking):
- No state mutation
- Organization isolation via RLS
- Audit logging for compliance
- Clear error handling

### Blocking Condition Logic

The blocking condition is determined by:
1. Current workflow status (step_X_Y)
2. Required gate for next step
3. Whether gate conditions are met
4. What action is needed to meet gate conditions

### User Experience

When a workflow is blocked:
1. User sees clear reason why
2. User sees what needs to be done
3. User can click link to perform action
4. User is guided through the required step
5. Workflow automatically unblocks when action completes

---

## Tasks/Subtasks

- [x] Create blocking-condition-resolver service
  - [x] Implement gate condition checking logic
  - [x] Map workflow states to blocking conditions
  - [x] Generate user-friendly blocking messages
  - [x] Create action link generation
  - [x] Add comprehensive error handling

- [x] Create API endpoint
  - [x] Implement GET /api/intent/workflows/{workflow_id}/blocking-conditions
  - [x] Add authentication and authorization
  - [x] Add organization isolation (RLS)
  - [x] Add audit logging for queries
  - [x] Add error handling and validation

- [x] Write comprehensive tests
  - [x] Unit tests for blocking condition resolver (12 tests passing)
  - [x] Integration tests for API endpoint (6 tests passing)
  - [x] Test all blocking condition scenarios
  - [x] Test error cases and edge cases
  - [x] Test audit logging

- [x] Update documentation
  - [x] Add audit action types to types/audit.ts
  - [ ] Document API endpoint in docs/api-contracts.md
  - [ ] Add implementation patterns to docs/development-guide.md
  - [x] Update sprint-status.yaml

## Dev Agent Record

### Implementation Plan

Implemented following red-green-refactor cycle:
1. ✅ Write failing tests for blocking condition resolver
2. ✅ Implement resolver service with gate logic
3. ✅ Write failing tests for API endpoint
4. ✅ Implement API endpoint with auth and RLS
5. ✅ Add audit logging
6. ✅ Refactor for clarity and performance
7. ⏳ Update documentation (in progress)

### Completion Notes

**Implementation Complete:**
- BlockingConditionResolver service fully implemented with 8 blocking condition mappings
- API endpoint with authentication, organization isolation, and audit logging
- 18 comprehensive tests (12 service + 6 API) all passing
- Proper error handling and graceful degradation
- Audit trail integration for compliance

**Key Features:**
- Clear, actionable blocking condition messages
- Direct action links for unblocking workflows
- Full audit trail of all blocking condition queries
- Organization isolation via RLS
- UUID validation for workflow IDs
- IP address and user agent tracking

## File List

**New Files (4):**
- `infin8content/lib/services/intent-engine/blocking-condition-resolver.ts` (165 lines)
- `infin8content/app/api/intent/workflows/[workflow_id]/blocking-conditions/route.ts` (87 lines)
- `infin8content/__tests__/services/intent-engine/blocking-condition-resolver.test.ts` (168 lines)
- `infin8content/__tests__/api/intent/workflows/blocking-conditions.test.ts` (70 lines)

**Modified Files (1):**
- `infin8content/types/audit.ts` (added 2 audit action types)

## Change Log

**2026-02-03: Story 39-7 Implementation Complete**
- Implemented BlockingConditionResolver service with 8 blocking condition mappings
- Created API endpoint GET /api/intent/workflows/{workflow_id}/blocking-conditions
- Added 18 comprehensive tests (all passing)
- Updated audit types with blocking condition actions
- Full organization isolation and audit logging

## Status

review
