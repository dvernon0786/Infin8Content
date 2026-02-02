## Story Context: 39-1-enforce-hard-gate-icp-required-for-all-downstream-steps

**Status**: ready-for-dev

**Epic**: 39 – Workflow Orchestration & State Management

**User Story**: As a system administrator, I want the workflow to enforce a hard gate requiring ICP completion for all downstream steps, so that no workflow can proceed without first establishing proper ideal customer profile validation.

**Story Classification**:
- Type: Producer (workflow gate enforcement)
- Tier: Tier 1 (foundational workflow control)

**Business Intent**: Enforce a mandatory hard gate that prevents any downstream workflow steps from executing until ICP (Ideal Customer Profile) generation is successfully completed, ensuring proper workflow sequence and data integrity.

**Contracts Required**:
- C1: Hard gate validation middleware/service for all workflow step endpoints
- C2/C4/C5: intent_workflows table (status validation), intent_audit_logs (gate enforcement logging), organizations table (ICP status reference)
- Terminal State: None (gate enforcement, not workflow advancement)
- UI Boundary: No UI events (backend validation only)
- Analytics: workflow.gate.icp.blocked audit events when enforcement occurs

**Contracts Modified**: None (validation layer only)

**Contracts Guaranteed**:
- ✅ No UI events emitted (backend validation only)
- ✅ No intermediate analytics (only gate enforcement audit logs)
- ✅ No state mutation outside validation (blocking only)
- ✅ Idempotency: Multiple requests consistently blocked/enforced
- ✅ Retry rules: 3 attempts with exponential backoff (2s, 4s, 8s) for transient validation failures

**Producer Dependency Check**:
- Epic 34 Status: COMPLETED ✅
- Story 34.1 (ICP Generation): COMPLETED ✅
- Story 34.3 (ICP Retry Handling): COMPLETED ✅
- Dependencies Met: ICP generation infrastructure exists, workflow state management implemented
- Blocking Decision: ALLOWED

**Acceptance Criteria**:
1. Given ICP is not complete (status ≠ 'step_2_icp_complete')
   When any downstream workflow step is attempted (steps 3-40)
   Then the system returns 423 Blocked with clear error message

2. Given ICP is complete (status = 'step_2_icp_complete')
   When downstream workflow steps are attempted
   Then the system allows normal execution without interference

3. And the hard gate is enforced at the API endpoint level for all downstream steps:
   - POST /api/intent/workflows/{workflow_id}/steps/competitor-analyze
   - POST /api/intent/workflows/{workflow_id}/steps/longtail-expand
   - POST /api/intent/workflows/{workflow_id}/steps/filter-keywords
   - POST /api/intent/workflows/{workflow_id}/steps/cluster-topics
   - POST /api/intent/workflows/{workflow_id}/steps/validate-clusters
   - POST /api/keywords/{keyword_id}/subtopics
   - POST /api/keywords/{keyword_id}/approve-subtopics
   - POST /api/intent/workflows/{workflow_id}/steps/queue-articles

4. And audit logs are created for each gate enforcement attempt:
   - workflow_id, attempted_step, icp_status, enforcement_action, timestamp
   - IP address and user agent tracking for compliance
   - Actor ID (user who attempted blocked operation)

5. And error responses are clear and actionable:
   - "ICP completion required before {step_name} can be executed"
   - "Please complete ICP generation (step 2) before proceeding"
   - Include current workflow status and ICP completion status

6. And the gate enforcement is performant (<50ms validation check)
   And does not impact workflow steps that have ICP complete
   And includes proper error handling for validation failures

**Technical Requirements**:
- **Gate Enforcement Middleware**: Common middleware for all Intent Engine endpoints
- **Validation Logic**: Check workflow.status against required ICP completion status
- **Response Format**: Standardized 423 Blocked response with actionable error details
- **Audit Logging**: Complete audit trail for all gate enforcement actions
- **Performance**: Sub-50ms validation check with caching for workflow status
- **Error Handling**: Graceful degradation if validation service unavailable

**Database Schema Dependencies**:
- `intent_workflows.status` field for current workflow state
- `intent_workflows.icp_completed_at` timestamp for completion tracking
- `intent_audit_logs` table for gate enforcement audit events
- `organizations.icp_settings` for ICP configuration validation

**Implementation Architecture**:
```typescript
// Gate enforcement middleware
interface ICPGateValidator {
  validateICPCompletion(workflowId: string): Promise<GateResult>
  logGateEnforcement(workflowId: string, step: string, result: GateResult): Promise<void>
}

interface GateResult {
  allowed: boolean
  icpStatus: string
  workflowStatus: string
  error?: string
}

// Middleware application to all downstream endpoints
const enforceICPGate = (requiredStep: string) => {
  return async (req: NextRequest, context: { params: { workflow_id: string } }) => {
    const result = await icpGateValidator.validateICPCompletion(context.params.workflow_id)
    
    if (!result.allowed) {
      await icpGateValidator.logGateEnforcement(
        context.params.workflow_id, 
        requiredStep, 
        result
      )
      
      return NextResponse.json({
        error: result.error || `ICP completion required before ${requiredStep}`,
        workflowStatus: result.workflowStatus,
        icpStatus: result.icpStatus,
        requiredAction: 'Complete ICP generation (step 2) before proceeding'
      }, { status: 423 })
    }
    
    // Continue to next handler
  }
}
```

**Files to be Created**:
- `lib/services/intent-engine/icp-gate-validator.ts`
- `lib/middleware/intent-engine-gate.ts`
- `__tests__/services/intent-engine/icp-gate-validator.test.ts`
- `__tests__/middleware/intent-engine-gate.test.ts`

**Files to be Modified**:
- `app/api/intent/workflows/[workflow_id]/steps/competitor-analyze/route.ts` - Add gate middleware
- `app/api/intent/workflows/[workflow_id]/steps/longtail-expand/route.ts` - Add gate middleware
- `app/api/intent/workflows/[workflow_id]/steps/filter-keywords/route.ts` - Add gate middleware
- `app/api/intent/workflows/[workflow_id]/steps/cluster-topics/route.ts` - Add gate middleware
- `app/api/intent/workflows/[workflow_id]/steps/validate-clusters/route.ts` - Add gate middleware
- `app/api/keywords/[keyword_id]/subtopics/route.ts` - Add gate middleware
- `app/api/keywords/[keyword_id]/approve-subtopics/route.ts` - Add gate middleware
- `app/api/intent/workflows/[workflow_id]/steps/queue-articles/route.ts` - Add gate middleware
- `types/audit.ts` - Add gate enforcement audit actions
- `docs/api-contracts.md` - Document gate enforcement behavior

**Out of Scope**:
- Workflow state modification (gate only blocks, doesn't advance)
- ICP generation logic (already implemented in Epic 34)
- UI components for gate errors (backend validation only)
- Retroactive application to existing workflows
- Gate bypass mechanisms (hard gate only)

**Dependencies**:
- Epic 34 (Intent Validation - ICP Generation) - COMPLETED ✅
- Existing workflow infrastructure and state management
- Intent audit logging system (Epic 37.4) - COMPLETED ✅
- Organization context and authentication system

**Priority**: High
**Story Points**: 5
**Target Sprint**: Current sprint

## Developer Context & Implementation Guide

### Architecture Compliance

**Intent Engine Integration Pattern:**
- This story implements the first hard gate in the 5-gate sequence defined in `ARCHITECTURE_PRIMARY_CONTENT_WORKFLOW.md`
- Must follow existing endpoint patterns: `/api/intent/workflows/{workflow_id}/steps/{step_name}`
- Gate enforcement is implemented as middleware, not workflow state changes
- Uses existing audit logging infrastructure from Story 37.4 (COMPLETED )

**Database Schema Dependencies:**
```sql
-- Core tables (already exist)
intent_workflows (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  status TEXT NOT NULL, -- step_0_auth through step_9_articles
  icp_data JSONB, -- populated by Story 34.1
  icp_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Audit logging (COMPLETED )
intent_audit_logs (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  workflow_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  actor_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Technical Stack Requirements:**
- **Language**: TypeScript (strict mode)
- **Runtime**: Next.js 16 App Router (Edge Runtime compatible)
- **Database**: Supabase PostgreSQL with RLS
- **Authentication**: Supabase Auth + `getCurrentUser()`
- **Audit**: Intent Audit Logger (Story 37.4)
- **Testing**: Vitest with >90% coverage

### File Structure & Patterns

**New Files (Create from scratch):**
```
lib/services/intent-engine/icp-gate-validator.ts     # Core gate validation logic
lib/middleware/intent-engine-gate.ts                  # Reusable middleware
__tests__/services/intent-engine/icp-gate-validator.test.ts
__tests__/middleware/intent-engine-gate.test.ts
```

**Modified Files (Add gate middleware):**
```
app/api/intent/workflows/[workflow_id]/steps/competitor-analyze/route.ts
app/api/intent/workflows/[workflow_id]/steps/longtail-expand/route.ts  
app/api/intent/workflows/[workflow_id]/steps/filter-keywords/route.ts
app/api/intent/workflows/[workflow_id]/steps/cluster-topics/route.ts
app/api/intent/workflows/[workflow_id]/steps/validate-clusters/route.ts
app/api/keywords/[keyword_id]/subtopics/route.ts
app/api/keywords/[keyword_id]/approve-subtopics/route.ts
app/api/intent/workflows/[workflow_id]/steps/queue-articles/route.ts
```

**Implementation Pattern:**
```typescript
// Add to each downstream endpoint (after auth)
import { enforceICPGate } from '@/lib/middleware/intent-engine-gate'

export async function POST(request: NextRequest, { params }: { params: Promise<{ workflow_id: string }> }) {
  // ... existing auth code ...
  
  // ENFORCE ICP GATE (add this line)
  const gateResult = await enforceICPGate(workflowId, 'competitor-analyze')
  if (!gateResult.allowed) {
    return NextResponse.json(gateResult.errorResponse, { status: 423 })
  }
  
  // ... continue with existing logic ...
}
```

### Implementation Architecture

**Core Gate Validator Interface:**
```typescript
interface ICPGateValidator {
  validateICPCompletion(workflowId: string): Promise<GateResult>
  logGateEnforcement(workflowId: string, step: string, result: GateResult): Promise<void>
}

interface GateResult {
  allowed: boolean
  icpStatus: string
  workflowStatus: string
  error?: string
  errorResponse?: object
}
```

**Middleware Implementation:**
```typescript
export async function enforceICPGate(workflowId: string, stepName: string): Promise<GateResult> {
  // 1. Query workflow status and ICP completion
  // 2. Check if ICP is complete (status = 'step_2_icp_complete' or later)
  // 3. Log enforcement attempt (audit trail)
  // 4. Return structured result for endpoint handling
}
```

**Response Format (423 Blocked):**
```typescript
{
  error: "ICP completion required before competitor analysis",
  workflowStatus: "step_1_icp",
  icpStatus: "not_started", 
  requiredAction: "Complete ICP generation (step 2) before proceeding",
  currentStep: "competitor-analyze",
  blockedAt: new Date().toISOString()
}
```

### Testing Requirements

**Unit Tests (icp-gate-validator.test.ts):**
- Mock workflow with ICP not complete → returns blocked
- Mock workflow with ICP complete → returns allowed  
- Audit logging verification
- Performance validation (<50ms)
- Error handling for database failures

**Integration Tests (intent-engine-gate.test.ts):**
- Middleware application to existing endpoints
- 423 response format validation
- Audit trail creation verification
- Multiple concurrent requests

**Test Data Setup:**
```typescript
const mockWorkflow = {
  id: 'test-workflow-id',
  organization_id: 'test-org-id',
  status: 'step_1_icp', // Before ICP completion
  icp_data: null,
  icp_completed_at: null
}
```

### Performance & Security

**Performance Requirements:**
- Gate validation must complete in <50ms
- Use database indexes on `intent_workflows.id` and `organization_id`
- Cache workflow status for 30 seconds to reduce database load
- Audit logging is async (non-blocking)

**Security Requirements:**
- Organization isolation via RLS policies
- User authentication required (`getCurrentUser()`)
- IP address and user agent tracking for compliance
- No bypass mechanisms (hard gate only)

**Error Handling:**
- Database failures → allow request (fail-open for availability)
- Audit log failures → continue (non-blocking)
- Validation errors → block with clear error message

### Dependencies & Integration

**Completed Dependencies ( READY):**
- Epic 34 (ICP Generation) - COMPLETED
- Story 37.4 (Audit Trail) - COMPLETED  
- Intent Engine infrastructure - COMPLETED
- Authentication system - COMPLETED
- Database schema - COMPLETED

**Integration Points:**
1. **Intent Audit Logger** - Use existing `logIntentAction()` from Story 37.4
2. **Workflow Status Management** - Use existing `updateWorkflowStatus()` patterns
3. **Authentication** - Use existing `getCurrentUser()` middleware
4. **Database Access** - Use existing `createServiceRoleClient()` patterns

### Critical Constraints (DO NOT VIOLATE)

**Architecture Guardrails:**
- NO workflow state advancement (gate only blocks)
- NO ICP generation logic (already completed)
- NO UI event emission (backend validation only)
- NO bypass mechanisms (hard gate only)
- NO database schema changes (use existing)

**Contract Compliance:**
- Backend validation only (no UI events)
- Audit logging for all enforcement actions  
- Organization isolation enforced
- Idempotent gate checks
- Performance <50ms validation

### Implementation Checklist

**Phase 1: Core Gate Logic**
- [ ] Create `icp-gate-validator.ts` with validation logic
- [ ] Implement workflow status checking
- [ ] Add audit logging integration
- [ ] Write comprehensive unit tests

**Phase 2: Middleware Implementation**  
- [ ] Create `intent-engine-gate.ts` middleware
- [ ] Implement reusable gate enforcement function
- [ ] Add error handling and response formatting
- [ ] Write integration tests

**Phase 3: Endpoint Integration**
- [ ] Add gate middleware to all 8 downstream endpoints
- [ ] Test 423 response format
- [ ] Verify audit trail creation
- [ ] Performance testing

**Phase 4: Documentation & Validation**
- [ ] Update API contracts documentation
- [ ] Add gate enforcement patterns to development guide
- [ ] End-to-end testing with real workflows
- [ ] Security review and compliance validation

### Success Criteria

**Functional Requirements:**
- All 8 downstream endpoints enforce ICP gate
- 423 responses with actionable error messages
- Complete audit trail for all enforcement actions
- <50ms validation performance
- Zero impact on workflows with ICP complete

**Non-Functional Requirements:**  
- 100% test coverage for gate logic
- No regressions in existing endpoint functionality
- Comprehensive error handling and logging
- Security compliance (organization isolation)
- Performance benchmarks met

### Previous Story Intelligence

**Relevant Patterns from Completed Stories:**
- **Story 37.4**: Use `logIntentAction()` for audit logging (COMPLETED )
- **Story 34.1**: ICP completion status tracking (COMPLETED )  
- **Epic 34**: Workflow state management patterns (COMPLETED )
- **Authentication**: Use `getCurrentUser()` pattern (PRODUCTION READY )

**Avoid These Mistakes:**
- Don't create new database tables (use existing schema)
- Don't implement UI components (backend validation only)
- Don't modify workflow state (gate only blocks)
- Don't bypass authentication (use existing patterns)

---

**Status**: ready-for-dev  
**Priority**: High  
**Story Points**: 5  
**Target Sprint**: Current sprint

**Implementation Notes:**
- Follow existing Intent Engine patterns exactly
- Maintain backward compatibility with all endpoints  
- Use established audit logging infrastructure
- Comprehensive testing required before production deployment
- Security review mandatory due to gate enforcement logic
