# Story 39.5: Enforce Hard Gate - Approval Required for Articles

Status: done

## Story Context: 39-5-enforce-hard-gate-approval-required-for-articles

**Status**: done

**Epic**: 39 – Workflow Orchestration & State Management

**User Story**: As a system, I want to enforce that subtopics must be approved before article generation, so that only approved content is generated.

**Story Classification**:
- Type: Governance / Control (Hard gate enforcement)
- Tier: Tier 1 (critical workflow control gate)

**Business Intent**: Enforce a mandatory hard gate that prevents article generation from proceeding until subtopics have been explicitly approved, ensuring only validated content enters the generation pipeline and maintaining editorial control over the workflow.

**Contracts Required**:
- C1: Gate enforcement middleware in workflow step execution
- C2/C4/C5: intent_workflows table (status validation), intent_audit_logs (gate violation logging), intent_approvals table (approval verification)
- Terminal State: No workflow advancement (remains at step_8_approval) when gate blocks
- UI Boundary: No UI events (backend gate enforcement only)
- Analytics: workflow.gate.blocked audit events for violation attempts

**Contracts Modified**: None (gate enforcement uses existing tables)

**Contracts Guaranteed**:
- ✅ No UI events emitted (backend gate enforcement only)
- ✅ No intermediate analytics (only audit logs for gate violations)
- ✅ No state mutation outside workflow status (blocking only)
- ✅ Idempotency: Gate checks consistent across multiple attempts
- ✅ Retry rules: No retries for gate violations (hard block)

**Producer Dependency Check**:
- Epic 37 Status: COMPLETED ✅
- Story 37.2 (Subtopic Approval): COMPLETED ✅
- Story 37.4 (Audit Trail): COMPLETED ✅
- Subtopics exist in workflow with approval status tracking
- Approval infrastructure (intent_approvals table) exists
- Workflow orchestration engine (Inngest) operational
- Blocking Decision: ALLOWED

**Acceptance Criteria**:
1. Given subtopics are generated and workflow is at step_8_approval
   When a user attempts to advance to step_9_articles without approval
   Then the system returns error: "Subtopics must be approved before article generation"
   And the workflow remains at step_8_approval
   And the gate violation is logged to intent_audit_log

2. Given subtopics are rejected
   When article generation is attempted
   Then the system blocks advancement with error: "Subtopics rejected - revision required"
   And the workflow remains at step_8_approval
   And rejection details are logged

3. Given subtopics are approved
   When article generation is attempted
   Then the system allows advancement to step_9_articles
   And the approval is verified against intent_approvals table
   And the successful gate passage is logged

4. Given workflow attempts to bypass gate via direct API call
   When step execution is triggered
   Then the gate enforcement middleware validates approval status
   And blocks execution if approval requirements not met
   And logs the bypass attempt

5. Given multiple concurrent approval workflows
   When gate checks occur simultaneously
   Then each workflow is evaluated independently
   And no race conditions occur in approval verification
   And audit logs maintain proper isolation

6. Given audit trail requirements
   When any gate action occurs
   Then the system logs actor, workflow_id, action, timestamp, IP address
   And maintains immutable audit trail
   And provides sufficient detail for compliance review

**Technical Requirements**:
- Gate enforcement validator following `SeedApprovalGateValidator` pattern
- Subtopic approval validation against `intent_approvals` table with `approval_type='subtopics'`
- Workflow state consistency checks using step ordering array
- Comprehensive audit logging via `logIntentAction` function
- Error handling with user-friendly messages and fail-open availability
- Performance: <100ms gate check response time
- Security: Prevent unauthorized workflow advancement
- Integration with existing `lib/middleware/intent-engine-gate.ts`

**Database Schema Usage**:
- intent_workflows.status (validate current step)
- intent_approvals.decision (verify approval status)
- intent_audit_log (log all gate actions)
- No schema modifications required

**API Endpoints Affected**:
- POST /api/intent/workflows/{workflow_id}/execute-step/{step_number}
- All workflow advancement endpoints
- Gate enforcement applied at orchestration layer

**Implementation Notes**:
- Gate enforcement follows established pattern from `seed-approval-gate-validator.ts`
- Uses existing `intent_approvals` table with `approval_type='subtopics'`
- Integrates with existing `lib/middleware/intent-engine-gate.ts` middleware
- Maintains workflow state integrity with clear error messages
- Audit trail includes all gate violations and successful passages
- Follows fail-open pattern for database errors to maintain availability

**Files Required**:
- `lib/services/intent-engine/subtopic-approval-gate-validator.ts` (NEW)
- `__tests__/services/intent-engine/subtopic-approval-gate-validator.test.ts` (NEW)

**Files Modified**:
- `lib/middleware/intent-engine-gate.ts` (add subtopic approval gate check)
- `types/audit.ts` (add subtopic approval gate enforcement audit actions)
- `docs/api-contracts.md` (document gate enforcement behavior)

**Out of Scope**:
- UI components for gate status display
- Approval workflow modification (handled by Story 37.2)
- Article generation pipeline changes
- Workflow state machine redesign
- Real-time gate status notifications

**Testing Strategy**:
- Unit tests for gate enforcement logic
- Integration tests for workflow advancement scenarios
- Approval validation test cases
- Gate violation audit logging tests
- Concurrent workflow gate check tests
- Security tests for unauthorized bypass attempts

**Dependencies**:
- Story 37.2 (Subtopic Approval) - COMPLETED ✅
- Story 37.4 (Audit Trail) - COMPLETED ✅
- Inngest workflow orchestration infrastructure
- intent_workflows table with status tracking
- intent_approvals table with decision tracking
- intent_audit_log table for compliance

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

## Dev Notes

### Architecture Compliance
- Follows existing gate enforcement patterns from `seed-approval-gate-validator.ts`
- Uses established `intent_approvals` infrastructure with `approval_type='subtopics'`
- Maintains workflow state consistency using step ordering array pattern
- Implements comprehensive audit logging via `logIntentAction`
- Integrates with existing `lib/middleware/intent-engine-gate.ts` middleware
- Follows fail-open pattern for database availability

### Project Structure Notes
- Gate enforcement services in lib/services/intent-engine/
- Test files in __tests__/services/intent-engine/
- Integration with existing workflow orchestration
- No breaking changes to existing APIs

### Security Requirements
- Gate enforcement must be non-bypassable
- All gate violations logged with actor details
- Approval validation must be tamper-proof
- Workflow state integrity maintained

### Performance Requirements
- Gate checks must complete in <100ms
- No blocking of concurrent workflows
- Efficient database queries for approval validation
- Minimal overhead to workflow execution

### References

- [Source: docs/project-documentation/ARCHITECTURE_PRIMARY_CONTENT_WORKFLOW.md#Workflow Orchestration]
- [Source: docs/project-documentation/ARCHITECTURE_PRIMARY_CONTENT_WORKFLOW.md#Gate Enforcement]
- [Source: accessible-artifacts/epics.md#Epic 39]
- [Source: accessible-artifacts/37-2-review-and-approve-subtopics-before-article-generation.md]
- [Source: infin8content/lib/services/intent-engine/seed-approval-gate-validator.ts] (Implementation Pattern)
- [Source: infin8content/lib/middleware/intent-engine-gate.ts] (Integration Point)

## Dev Agent Record

### Agent Model Used
Penguin Alpha (Cascade v1.0)

### Debug Log References

### Completion Notes List

### File List
