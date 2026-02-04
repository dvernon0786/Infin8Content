# Story 39.6: Create Workflow Status Dashboard

Status: in-progress

## Story Context: 39-6-create-workflow-status-dashboard

**Status**: ready-for-dev

**Epic**: 39 – Workflow Orchestration & State Management

**User Story**: As a content manager, I want to see a real-time dashboard showing the status of all my workflows, so that I can track progress and identify bottlenecks.

**Story Classification**:
- Type: Consumer (dashboard UI displaying workflow status data)
- Tier: Tier 1 (critical visibility for workflow management)

**Business Intent**: Provide content managers with real-time visibility into all intent workflows within their organization, enabling progress tracking, bottleneck identification, and workflow management through an intuitive dashboard interface.

**Contracts Required**:
- C1: GET /api/intent/workflows/dashboard endpoint (dashboard data aggregation)
- C2/C4/C5: intent_workflows table (read-only status queries), intent_audit_logs (progress tracking), organizations table (isolation)
- Terminal State: No workflow state change (dashboard is read-only visibility layer)
- UI Boundary: Dashboard UI components with real-time updates
- Analytics: dashboard.viewed, dashboard.workflow_clicked audit events

**Contracts Modified**: None (new endpoint and UI components only)

**Contracts Guaranteed**:
- ✅ No workflow state mutations (read-only dashboard)
- ✅ No intermediate analytics (only user interaction events)
- ✅ No state modification outside dashboard UI components
- ✅ Idempotency: Multiple dashboard loads return consistent data
- ✅ Retry rules: 3 attempts with exponential backoff (2s, 4s, 8s) for data fetching

**Producer Dependency Check**:
- Epic 34 Status: COMPLETED ✅
- Epic 35 Status: COMPLETED ✅
- Epic 36 Status: COMPLETED ✅
- Epic 37 Status: COMPLETED ✅
- Epic 38 Status: COMPLETED ✅
- Story 39.1-39.5 Status: COMPLETED ✅ (All hard gates implemented)
- Intent workflows exist with status tracking
- Workflow orchestration engine operational
- Blocking Decision: ALLOWED

**Acceptance Criteria**:
1. Given I am logged in as a content manager
   When I access the workflow dashboard
   Then the dashboard displays all workflows for my organization
   And each workflow shows current step and status
   And each workflow shows progress percentage
   And each workflow shows estimated time to completion

2. Given I want to filter workflows
   When I use the filter controls
   Then I can filter workflows by status (step_0_auth through completed)
   And I can filter by date range (created, updated)
   And I can filter by creator/owner
   And the dashboard updates instantly

3. Given I want detailed workflow information
   When I click on a workflow
   Then the system displays detailed step-by-step progress
   And each step shows completion status and duration
   And the system shows any blocking conditions
   And I can navigate to the required action for blocked steps

4. Given workflows are progressing
   When steps complete or status changes
   Then the dashboard updates in real-time without page refresh
   And progress indicators animate smoothly
   And new workflows appear automatically
   And completed workflows move to appropriate sections

5. Given system performance requirements
   When loading the dashboard
   Then the dashboard loads within 2 seconds
   And maintains 99.9% uptime
   And handles 100+ concurrent workflows per organization
   And updates occur within 500ms of status changes

6. Given mobile and desktop access
   When I access the dashboard on different devices
   Then the layout adapts responsively
   And all functionality remains available
   And touch interactions work smoothly on mobile
   And performance remains consistent across devices

**Technical Requirements**:
- Dashboard API endpoint: GET /api/intent/workflows/dashboard
- Real-time updates via Supabase realtime subscriptions
- Responsive React components using existing dashboard infrastructure
- Progress calculation based on workflow step completion
- Estimated completion time using historical step duration averages
- Filtering and sorting capabilities with URL state management
- Performance optimization with virtualized lists for large datasets
- Error handling with graceful degradation for failed data loads
- Accessibility compliance (WCAG 2.1 AA) for all dashboard interactions

**Database Schema Usage**:
- intent_workflows table (primary workflow data)
- intent_audit_logs table (progress tracking and timestamps)
- organizations table (multi-tenant isolation)
- No schema modifications required

**API Endpoint Specification**:
```typescript
GET /api/intent/workflows/dashboard
Response: {
  workflows: WorkflowDashboardItem[]
  filters: DashboardFilters
  summary: DashboardSummary
}

interface WorkflowDashboardItem {
  id: string
  name: string
  status: IntentWorkflowStatus
  progress_percentage: number
  current_step: string
  estimated_completion?: string
  created_at: string
  updated_at: string
  created_by: string
  blocking_condition?: string
}
```

**UI Components Required**:
- WorkflowDashboard (main container)
- WorkflowCard (individual workflow display)
- ProgressIndicator (visual progress bar)
- FilterPanel (filtering controls)
- WorkflowDetailModal (detailed workflow view)
- RealtimeSubscriptionManager (real-time updates)

**Dependencies**:
- Intent workflow infrastructure (Epic 33-38) - COMPLETED ✅
- Hard gate enforcement (Stories 39.1-39.5) - COMPLETED ✅
- Existing dashboard component infrastructure
- Supabase realtime subscriptions
- React 19 and Next.js 16 architecture
- TypeScript strict mode compliance

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

**Implementation Notes**:
- Leverages existing dashboard infrastructure in components/dashboard/
- Integrates with current design system and UI patterns
- Uses established realtime patterns from article generation
- Maintains organization isolation via RLS policies
- Follows responsive design principles established in Epic 31
- Implements proper error boundaries and loading states
- Performance optimized for 100+ concurrent workflows

**Files to be Created**:
- `infin8content/app/api/intent/workflows/dashboard/route.ts`
- `infin8content/components/dashboard/workflow-dashboard/WorkflowDashboard.tsx`
- `infin8content/components/dashboard/workflow-dashboard/WorkflowCard.tsx`
- `infin8content/components/dashboard/workflow-dashboard/WorkflowDetailModal.tsx`
- `infin8content/components/dashboard/workflow-dashboard/WorkflowFilters.tsx`
- `infin8content/lib/services/intent-engine/workflow-dashboard-service.ts`
- `__tests__/api/intent/workflows/dashboard.test.ts`
- `__tests__/components/dashboard/workflow-dashboard.test.ts`

**Files to be Modified**:
- `infin8content/lib/types/intent-workflow.ts` (add dashboard types)
- `docs/api-contracts.md` (add dashboard endpoint documentation)
- `docs/development-guide.md` (add dashboard patterns)
- `accessible-artifacts/sprint-status.yaml` (update story status)

**Out of Scope**:
- Workflow modification or execution from dashboard
- User management or organization settings
- Article generation or content editing
- External integrations or publishing
- Historical analytics or reporting
- Workflow template management

**Architecture Guardrails**:
- Dashboard is read-only (no workflow state mutations)
- Maintains organization isolation via existing RLS
- Uses established UI patterns and design tokens
- Integrates with existing realtime infrastructure
- Follows responsive design principles
- No external dependencies beyond current stack

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Multi-Tenant Data Isolation**:
- All dashboard queries must respect organization_id boundaries
- RLS policies enforce data isolation automatically
- Dashboard only shows workflows for user's organization

**Real-time Infrastructure**:
- Use existing Supabase realtime subscription patterns
- Follow article generation realtime implementation as reference
- Implement proper cleanup to prevent memory leaks

**Dashboard Component Architecture**:
- Extend existing dashboard infrastructure in components/dashboard/
- Use established design tokens and UI patterns
- Follow responsive layout patterns from Epic 31

**Performance Requirements**:
- 99.9% uptime requirement (same as production dashboard)
- <2 second load time for dashboard data
- Handle 100+ concurrent workflows per organization
- Real-time updates within 500ms of status changes

### Source Tree Components to Touch

**API Layer**:
- `infin8content/app/api/intent/workflows/` - New dashboard endpoint
- Follow existing API route patterns with proper error handling

**Component Layer**:
- `infin8content/components/dashboard/workflow-dashboard/` - New dashboard components
- Integrate with existing dashboard layout and navigation

**Service Layer**:
- `infin8content/lib/services/intent-engine/` - Dashboard data service
- Use established service patterns for data fetching

**Type Definitions**:
- `infin8content/lib/types/intent-workflow.ts` - Extend with dashboard types
- Maintain TypeScript strict compliance

### Testing Standards Summary

**Unit Testing**:
- All dashboard components require >90% test coverage
- Test workflow status calculations and progress logic
- Mock Supabase realtime subscriptions for component testing

**Integration Testing**:
- API endpoint testing with organization isolation
- Real-time subscription integration testing
- Filter and search functionality testing

**Performance Testing**:
- Dashboard load performance with 100+ workflows
- Real-time update performance under concurrent load
- Memory leak prevention for subscription cleanup

### Project Structure Notes

**Alignment with Unified Project Structure**:
- Follow established API route patterns in app/api/
- Extend dashboard component structure in components/dashboard/
- Use lib/services/ for business logic separation
- Maintain TypeScript file organization standards

**Detected Conflicts or Variances**:
- None detected - dashboard aligns with existing architecture
- Uses established patterns from article generation dashboard
- Integrates with current design system and UI components

### References

- [Source: docs/architecture.md#Multi-Tenant Architecture] - Data isolation patterns
- [Source: docs/project-documentation/ARCHITECTURE_PRIMARY_CONTENT_WORKFLOW.md] - Workflow step definitions
- [Source: infin8content/lib/types/intent-workflow.ts] - Workflow type definitions
- [Source: accessible-artifacts/39-5-enforce-hard-gate-approval-required-for-articles.md] - Previous story patterns
- [Source: components/dashboard/article-status-list.tsx] - Existing dashboard patterns reference

## Dev Agent Record

### Agent Model Used

Cascade (Penguin Alpha model)

### Debug Log References

None - Story creation completed without debugging requirements

### Completion Notes List

- Epic 39 context analyzed from epics.md
- Architecture patterns extracted from architecture.md  
- Previous story patterns reviewed from 39-5 implementation
- Existing dashboard infrastructure analyzed
- Workflow types and status definitions validated
- Real-time infrastructure patterns identified
- Multi-tenant isolation requirements confirmed
- Performance requirements established (99.9% uptime)
- Component structure designed following existing patterns
- API contract specification created
- Testing strategy defined with coverage requirements

### File List

**New Files (8)**:
- infin8content/app/api/intent/workflows/dashboard/route.ts
- infin8content/components/dashboard/workflow-dashboard/WorkflowDashboard.tsx
- infin8content/components/dashboard/workflow-dashboard/WorkflowCard.tsx
- infin8content/components/dashboard/workflow-dashboard/WorkflowDetailModal.tsx
- infin8content/components/dashboard/workflow-dashboard/WorkflowFilters.tsx
- infin8content/lib/services/intent-engine/workflow-dashboard-service.ts
- __tests__/api/intent/workflows/dashboard.test.ts
- __tests__/components/dashboard/workflow-dashboard.test.ts

**Modified Files (4)**:
- infin8content/lib/types/intent-workflow.ts
- docs/api-contracts.md
- docs/development-guide.md
- accessible-artifacts/sprint-status.yaml
