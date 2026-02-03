# Story 39.3: Enforce Hard Gate - Approved Seeds Required for Longtail Expansion

Status: ready-for-dev

## Story

As a system,
I want to enforce that seed keywords must be approved before longtail expansion,
So that only validated seeds are expanded.

## Acceptance Criteria

**Given** seed keywords are extracted  
**When** a user attempts to advance to Step 4 without approval  
**Then** the system returns an error: "Seed keywords must be approved before longtail expansion"  
**And** the workflow remains at Step 3  
**And** the error is logged to the audit trail

## Story Classification

- **Type**: Governance / Control (Hard gate enforcement)
- **Tier**: Tier 1 (critical workflow integrity)
- **Epic**: 39 – Workflow Orchestration & State Management

## Business Intent

Enforce mandatory seed keyword approval gate before long-tail expansion, ensuring that only validated, human-approved seed keywords are eligible for automated expansion into long-tail keywords. This gate prevents未经批准的种子关键词被扩展，维护内容质量和编辑控制标准。

## Contracts Required

### C1: API Endpoint Protection
- **Target**: POST /api/intent/workflows/{workflow_id}/steps/longtail-expand
- **Gate Logic**: Check seed approval status before allowing expansion
- **Response**: 423 Blocked with actionable error details when seeds not approved

### C2/C4/C5: Database Tables
- **intent_workflows**: Verify workflow at step_3_seeds status
- **intent_approvals**: Check for seed_keywords approval decision
- **keywords**: Read-only validation of seed keyword existence

### Terminal State
- **Success**: Proceed to longtail expansion (existing behavior)
- **Blocked**: Workflow remains at step_3_seeds, no state change
- **Error**: Detailed error response with required action

### UI Boundary
- **No UI events emitted**: Backend-only gate enforcement
- **Error responses**: Structured JSON for frontend handling

### Analytics
- **workflow.gate.seeds_blocked**: When access denied due to missing approval
- **workflow.gate.seeds_error**: When gate enforcement encounters errors
- **workflow.longtail_expand.started**: Only when gate passes (existing)

## Contracts Modified

### New Middleware Function
- **File**: lib/middleware/intent-engine-gate.ts
- **Function**: enforceSeedApprovalGate()
- **Pattern**: Same as enforceICPGate() and enforceCompetitorGate()

### Modified API Endpoint
- **File**: app/api/intent/workflows/[workflow_id]/steps/longtail-expand/route.ts
- **Change**: Add seed approval gate check before existing logic
- **Backward Compatible**: No breaking changes to success path

## Contracts Guaranteed

✅ **No UI events emitted** (backend-only gate enforcement)  
✅ **No intermediate analytics** (only gate enforcement and terminal events)  
✅ **No state mutation outside gate** (workflow status unchanged when blocked)  
✅ **Idempotency**: Multiple blocked requests return consistent 423 responses  
✅ **Retry rules**: 3 attempts with exponential backoff (2s, 4s, 8s) for transient failures  

## Producer Dependency Check

### Epic Status Verification
- **Epic 34 (ICP & Competitor Analysis)**: COMPLETED ✅
- **Epic 35 (Keyword Research & Expansion)**: COMPLETED ✅
- **Story 35.3 (Seed Approval)**: COMPLETED ✅

### Dependency Validation
- ✅ Seed approval processor exists: `lib/services/intent-engine/seed-approval-processor.ts`
- ✅ Seed approval endpoint exists: `app/api/intent/workflows/[workflow_id]/steps/approve-seeds/route.ts`
- ✅ Approval table exists: `intent_approvals` with approval_type='seed_keywords'
- ✅ Gate enforcement pattern exists: `lib/middleware/intent-engine-gate.ts`
- ✅ Target endpoint exists: `app/api/intent/workflows/[workflow_id]/steps/longtail-expand/route.ts`

### Blocking Decision: ALLOWED ✅

All dependencies completed and verified. Story ready for implementation.

## Technical Requirements

### API Endpoint Enhancement
```typescript
// Add to existing longtail-expand route.ts
import { enforceSeedApprovalGate } from '@/lib/middleware/intent-engine-gate'

// In POST function, after ICP gate check
const seedGateResponse = await enforceSeedApprovalGate(workflowId, 'longtail-expand')
if (seedGateResponse) {
  return seedGateResponse
}
```

### Gate Enforcement Logic
```typescript
// New function in lib/middleware/intent-engine-gate.ts
export async function enforceSeedApprovalGate(
  workflowId: string,
  stepName: string
): Promise<NextResponse | null>
```

### Validation Requirements
1. **Workflow Status**: Must be at step_3_seeds
2. **Approval Check**: intent_approvals table must have 'approved' decision
3. **Organization Isolation**: Verify workflow belongs to user's organization
4. **Audit Logging**: Log all gate enforcement attempts
5. **Error Handling**: Fail open for availability on system errors

### Database Queries
```sql
-- Check seed approval status
SELECT decision, approved_items 
FROM intent_approvals 
WHERE workflow_id = $1 
AND approval_type = 'seed_keywords'
AND decision = 'approved';

-- Verify workflow status
SELECT status, organization_id 
FROM intent_workflows 
WHERE id = $1;
```

## Implementation Notes

### Architecture Compliance
- **Follows existing gate pattern**: Same structure as ICP and competitor gates
- **Uses existing approval system**: Leverages Story 35.3 approval infrastructure
- **Maintains fail-open principle**: System errors don't block legitimate requests
- **Comprehensive audit trail**: All gate attempts logged for compliance

### Error Response Format
```json
{
  "error": "Seed keywords must be approved before longtail expansion",
  "workflowStatus": "step_3_seeds",
  "seedApprovalStatus": "not_approved",
  "requiredAction": "Approve seed keywords via POST /api/intent/workflows/{workflow_id}/steps/approve-seeds",
  "currentStep": "longtail-expand",
  "blockedAt": "2026-02-03T10:48:00.000Z"
}
```

### Integration Points
1. **Before**: ICP gate (already enforced)
2. **Current**: Seed approval gate (new)
3. **After**: Existing longtail expansion logic (unchanged)

### Testing Strategy
- **Unit tests**: Gate validator logic
- **Integration tests**: API endpoint with gate enforcement
- **Error scenarios**: Database failures, malformed workflow IDs
- **Success scenarios**: Approved seeds proceed normally
- **Security tests**: Cross-organization access prevention

## Files to be Created

### New Service
- `lib/services/intent-engine/seed-approval-gate-validator.ts`
  - Seed approval validation logic
  - Audit logging integration
  - Error handling and fail-open logic

### New Tests
- `__tests__/services/intent-engine/seed-approval-gate-validator.test.ts`
  - Gate validation scenarios
  - Error handling tests
  - Audit logging verification

- `__tests__/middleware/intent-engine-gate-seed.test.ts`
  - Middleware integration tests
  - API endpoint protection tests
  - Response format validation

## Files to be Modified

### Middleware Enhancement
- `lib/middleware/intent-engine-gate.ts`
  - Add enforceSeedApprovalGate() function
  - Add withSeedApprovalGate() wrapper function
  - Follow existing pattern from ICP and competitor gates

### API Endpoint Protection
- `app/api/intent/workflows/[workflow_id]/steps/longtail-expand/route.ts`
  - Import seed approval gate function
  - Add gate check after ICP gate validation
  - Maintain backward compatibility for success path

### Documentation Updates
- `docs/api-contracts.md`
  - Add seed approval gate documentation
  - Update longtail-expand endpoint specification
  - Document error response format

- `docs/development-guide.md`
  - Add seed approval gate pattern to workflow section
  - Document gate enforcement best practices
  - Update troubleshooting guide

### Status Tracking
- `accessible-artifacts/sprint-status.yaml`
  - Update 39-3 status from backlog to ready-for-dev

## Previous Story Intelligence

### Relevant Completed Stories
- **Story 35.3**: Seed approval infrastructure complete
- **Story 39.1**: ICP gate enforcement pattern established
- **Story 39.2**: Competitor gate enforcement pattern established

### Code Patterns to Follow
- **Gate Structure**: Copy from enforceCompetitorGate()
- **Error Handling**: Same fail-open principle as other gates
- **Audit Logging**: Consistent with existing gate logging
- **Response Format**: Match existing gate error responses

### Integration Considerations
- **Order of Operations**: ICP → Competitor → Seed Approval → Longtail Expand
- **Performance**: Minimal overhead (single database query)
- **Monitoring**: Gate enforcement metrics for observability

## Project Context Reference

### Intent Engine Architecture
- **Workflow States**: Linear progression through well-defined steps
- **Gate Pattern**: Middleware functions enforce prerequisite completion
- **Approval System**: Human-in-the-loop governance via intent_approvals table
- **Audit Trail**: Comprehensive logging for compliance and debugging

### Database Schema Context
- **intent_workflows**: Workflow state management
- **intent_approvals**: Governance decisions with audit trail
- **keywords**: Seed and long-tail keyword relationships
- **Organization Isolation**: RLS policies enforce data boundaries

## Development Agent Record

### Agent Model Used
Cascade (Penguin Alpha) - Advanced story context analysis and implementation planning

### Debug Log References
- Gate enforcement pattern analysis: `lib/middleware/intent-engine-gate.ts`
- Seed approval system: `lib/services/intent-engine/seed-approval-processor.ts`
- Target API endpoint: `app/api/intent/workflows/[workflow_id]/steps/longtail-expand/route.ts`

### Completion Notes List
- ✅ Story foundation extracted from Epic 39
- ✅ Existing patterns analyzed (ICP/Competitor gates)
- ✅ Seed approval system verified (Story 35.3)
- ✅ Implementation requirements defined
- ✅ File structure planned
- ✅ Testing strategy outlined

### File List
**New Files (3)**:
- lib/services/intent-engine/seed-approval-gate-validator.ts
- __tests__/services/intent-engine/seed-approval-gate-validator.test.ts
- __tests__/middleware/intent-engine-gate-seed.test.ts

**Modified Files (4)**:
- lib/middleware/intent-engine-gate.ts
- app/api/intent/workflows/[workflow_id]/steps/longtail-expand/route.ts
- docs/api-contracts.md
- docs/development-guide.md

**Status Updates (1)**:
- accessible-artifacts/sprint-status.yaml

## Story Completion Status

**Status**: ready-for-dev

**SM Validation**: Complete canonical template compliance verified
**Contract Compliance**: All required contracts specified and guaranteed
**Producer Dependencies**: All prerequisites completed and verified
**Implementation Ready**: Technical requirements fully specified

**Next Steps**: Development team can proceed with implementation using this comprehensive story context.
