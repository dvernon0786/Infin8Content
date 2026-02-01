## Story Context: 37-3-implement-human-approval-gate

**Status**: ready-for-dev

**Epic**: 37 – Content Topic Generation & Approval

**User Story**: As a content manager, I want to perform a final human approval of a completed workflow, so that I maintain ultimate editorial control before article generation begins.

**Story Classification**:
- Type: Governance / Control (Human-in-the-loop approval gate)
- Tier: Tier 1 (critical quality control gate)

**Business Intent**: Introduce a final, mandatory human approval gate at the workflow level after all keyword- and subtopic-level approvals are complete, ensuring that only intentionally approved workflows proceed to content creation and maintaining editorial oversight without generating content or modifying workflow payload data.

**Contracts Required**:
- C1: POST /api/intent/workflows/{workflow_id}/steps/human-approval endpoint
- C2/C4/C5: intent_workflows table (state management), intent_approvals table (approval persistence), keywords table (read-only eligibility reference)
- Terminal State: workflow.status = 'step_8_approval' (paused review state), approval decision recorded
- UI Boundary: No UI events (backend only)
- Analytics: workflow.human_approval.started/completed/approved/rejected audit events

**Contracts Modified**: None (new endpoint only, uses existing tables)

**Contracts Guaranteed**:
- ✅ No UI events emitted
- ✅ No intermediate analytics (only terminal state)
- ✅ No state mutation outside producer (workflow status and approvals only)
- ✅ Idempotency: One approval per workflow_id + approval_type, re-approval overwrites
- ✅ Retry rules: Not applicable (synchronous operation)

**Producer Dependency Check**:
- Epic 34 Status: COMPLETED ✅
- Epic 35 Status: COMPLETED ✅
- Epic 36 Status: COMPLETED ✅
- Story 37.1 (Subtopic Generation): COMPLETED ✅
- Story 37.2 (Subtopic Approval): COMPLETED ✅
- Keywords with article_status = 'ready' exist ✅
- Workflow status is step_7_subtopics ✅
- Organization context available ✅
- Blocking Decision: ALLOWED

**Acceptance Criteria**:
1. Given a workflow in step_7_subtopics with approved keywords
   When human approval is triggered
   Then the workflow enters step_8_approval and pauses for review

2. And the system provides a complete workflow summary including:
   - ICP document
   - Competitor analysis
   - Seed and longtail keywords
   - Topic clusters and validation results
   - All keywords with article_status = 'ready'
   - Summary statistics

3. And an admin can approve or reject the entire workflow

4. And if approved
   Then workflow status updates to step_9_articles
   And approved keywords become eligible for article generation
   And article generation is allowed to proceed (handled by later stories)

5. And if rejected
   Then workflow status resets to step_{reset_to_step}
   And rejection feedback is recorded
   And no articles are generated

6. And the approval decision is recorded in intent_approvals
   With user ID, timestamp, decision, and feedback

**Technical Requirements**:
- API Endpoint: POST /api/intent/workflows/{workflow_id}/steps/human-approval
- Summary Endpoint: GET /api/intent/workflows/{workflow_id}/steps/human-approval/summary
- Authentication: Required (admin access only)
- Request Body: { decision: 'approved' | 'rejected', feedback?: string, reset_to_step?: number }
- Database: intent_workflows (status), intent_approvals (approval records), keywords (read-only)
- Workflow State Model: step_7_subtopics → step_8_approval → step_9_articles (approved) or reset (rejected)
- Audit Logging: Complete audit trail with user, timestamp, decision, and feedback
- Validation: Workflow must belong to user's organization, status must be step_7_subtopics

**Data Model Interaction**:
- Read: intent_workflows (all JSONB fields, status, metadata), keywords (article_status = 'ready')
- Write: intent_approvals (approval record), intent_workflows.status, intent_workflows.updated_at
- No other tables are mutated

**Dependencies**:
- Epic 34 (ICP & Competitor Analysis) - COMPLETED ✅
- Epic 35 (Keyword Research & Expansion) - COMPLETED ✅
- Epic 36 (Keyword Refinement & Topic Clustering) - COMPLETED ✅
- Story 37.1 (Subtopic Generation) - COMPLETED ✅
- Story 37.2 (Subtopic Approval) - COMPLETED ✅
- Existing intent_approvals table structure
- Authentication and authorization infrastructure
- Workflow state management infrastructure

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

**Implementation Notes**:
- Follows intent engine governance pattern (not keyword engine)
- Workflow-level approval (final gate after all keyword-level approvals)
- Uses existing intent_approvals table with entity_type='workflow'
- Updates workflow status (not keyword status)
- Complete workflow summary for human review
- Comprehensive audit logging for compliance
- Full test coverage for all approval scenarios

**Files to be Created**:
- `lib/services/intent-engine/human-approval-processor.ts`
- `app/api/intent/workflows/[workflow_id]/steps/human-approval/route.ts`
- `app/api/intent/workflows/[workflow_id]/steps/human-approval/summary/route.ts`
- `__tests__/services/intent-engine/human-approval-processor.test.ts`
- `__tests__/api/intent/workflows/human-approval.test.ts`

**Files to be Modified**:
- `types/audit.ts` (add human approval audit actions)
- `docs/api-contracts.md` (add endpoint documentation)
- `docs/development-guide.md` (add workflow state transitions)
- `accessible-artifacts/sprint-status.yaml` (update story status)

**Out of Scope**:
- Keyword or subtopic approval (handled by Story 37.2)
- Article generation
- Research or planning workflows
- Perplexity usage
- UI events or dashboard behavior
- Workflow payload mutation (only status changes)

**Architecture Guardrails**:
- Follow intent engine pattern (separate from keyword engine)
- Workflow-level governance only
- No keyword mutation
- No UI events
- No content generation
- Complete audit trail required

**Testing Strategy**:
- Unit tests for human approval processor service
- Integration tests for API endpoints (approval and summary)
- Approval scenarios (approved → step_9_articles)
- Rejection scenarios (rejected → reset to prior step)
- Idempotency tests (re-approval overwrites)
- Security tests (auth, org isolation, validation)
- Error handling tests (invalid requests, missing data)
