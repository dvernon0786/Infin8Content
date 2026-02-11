# Workflow Step Pages Architecture

**Date**: February 11, 2026  
**Status**: ✅ Production Complete - All 9 Steps Implemented  
**Version**: 2.0

---

## Overview

The workflow step pages system implements a canonical, backend-authoritative architecture for executing the complete 9-step Intent Engine workflow. Each step is a real page with server-side guards, premium UX, and auto-advance functionality. The system is now production-complete with Linear-grade user experience.

### Implementation Status
- ✅ **Step 1**: ICP Generation (previously implemented)
- ✅ **Steps 2-9**: Complete mechanical implementation (February 11, 2026)
- ✅ **Auto-Advance**: Backend step progression triggers UI navigation
- ✅ **Production UX**: Narrative progress, optimistic states, failure recovery
- ✅ **Complete Telemetry**: 3 events per step (viewed, started, completed/failed)

---

## Core Principles

### Backend Authority
- **Guard Logic**: `requireWorkflowStepAccess()` enforces linear progression
- **State Source**: `workflow.current_step` is the single source of truth
- **No UI Invention**: Navigation buttons use backend state, not arithmetic

### Linear Progression
- Cannot skip steps
- Cannot regress to incomplete steps
- Auto-redirect to current step if accessing future step

### Refresh Safety
- All state persisted in backend
- Pages are bookmarkable and deep-linkable
- Refresh maintains correct step position

---

## Architecture

### Guard Logic (`lib/guards/workflow-step-gate.ts`)

```typescript
export async function requireWorkflowStepAccess(
  workflowId: string,
  targetStep: number
): Promise<WorkflowState>
```

**Responsibilities**:
- Fetch workflow state from database
- Validate organization isolation
- Check if target step is accessible
- Redirect to current step if invalid
- Return verified workflow state

**Guarantees**:
- ✅ Cannot access future steps
- ✅ Cannot access completed/cancelled workflows
- ✅ Auto-redirect to correct step
- ✅ Organization isolation via RLS

### Shared Layout (`components/workflows/WorkflowStepLayoutClient.tsx`)

**Client component** that wraps all step pages.

**Responsibilities**:
- Render breadcrumbs
- Display step progress bar
- Handle back/next navigation
- Fire analytics events
- Provide consistent UX

**Key Features**:
- Uses `workflow.current_step` for progress (backend truth)
- Navigation buttons use `workflow.current_step` (not arithmetic)
- Page-view analytics on mount
- SPA-safe navigation with `router.push()`

### Step Form Components

Example: `components/workflows/steps/Step1ICPForm.tsx`

**Client component** for step-specific form logic.

**Responsibilities**:
- Collect user input
- Validate form data
- Submit to API
- Handle errors
- Fire submit analytics
- Redirect to next step on success

**Key Features**:
- Form validation (required fields, URL format)
- Error display
- Loading state
- Analytics on success/failure

### Step Pages

Example: `/app/workflows/[id]/steps/1/page.tsx`

**Server component** that orchestrates the step.

**Responsibilities**:
- Call `requireWorkflowStepAccess()` for guard
- Pass verified workflow to layout
- Render layout + form

**Key Features**:
- Server-side guard enforcement
- No client-side logic
- Clean separation of concerns

---

## URL Structure

```
/workflows/:id/steps/1   → Generate ICP
/workflows/:id/steps/2   → Analyze Competitors
/workflows/:id/steps/3   → Extract Seeds
/workflows/:id/steps/4   → Expand Longtails
/workflows/:id/steps/5   → Filter Keywords
/workflows/:id/steps/6   → Cluster Topics
/workflows/:id/steps/7   → Validate Clusters
/workflows/:id/steps/8   → Generate Subtopics
/workflows/:id/steps/9   → Queue Articles
```

**Properties**:
- ✅ Bookmarkable
- ✅ Refresh-safe
- ✅ Deep-linkable
- ✅ SEO-neutral
- ✅ Scales to async retries

---

## Navigation Behavior

### Back Button
- Always routes to `/dashboard`
- Safe default for v1
- Prevents accidental step regression

### Next Button
- Routes to `workflow.current_step` (backend truth)
- Only enabled if current step completed
- Guard enforces correctness

### Modal Navigation
- Modal "Go to Step" button uses `router.push()`
- SPA-safe (no full page reload)
- Routes to current step

---

## Analytics Events

### Page View
```typescript
analytics.track('workflow_step_viewed', {
  workflow_id,
  step,
})
```
Fired on layout mount (once per page visit).

### Step Completion
```typescript
analytics.track('workflow_step_completed', {
  workflow_id,
  step,
})
```
Fired on successful form submission.

### Step Failure
```typescript
analytics.track('workflow_step_failed', {
  workflow_id,
  step,
  error,
})
```
Fired on form submission error.

---

## Implementation Checklist for Steps 2-9

Each additional step requires:

1. **Create Form Component**
   - File: `/components/workflows/steps/Step{N}Form.tsx`
   - Copy Step1ICPForm structure
   - Update API endpoint
   - Update form fields

2. **Create Page Component**
   - File: `/app/workflows/[id]/steps/{N}/page.tsx`
   - Copy Step 1 page structure
   - No changes needed (guard + layout handle everything)

3. **No Other Changes Required**
   - Guard logic unchanged
   - Layout unchanged
   - Modal unchanged

---

## Complete Implementation (Steps 2-9)

### Mechanical Pattern Applied
All steps 2-9 were implemented using identical mechanical pattern:

#### 1. **Step Forms** (8 components)
- `Step2CompetitorsForm.tsx` through `Step9ArticlesForm.tsx`
- Identical structure: optimistic states, telemetry, API calls
- No navigation logic (layout handles this)
- Production-grade error handling

#### 2. **Step Pages** (8 pages)  
- `/steps/2/page.tsx` through `/steps/9/page.tsx`
- Identical template: guard + layout + form
- Zero design decisions required
- Backend authority enforced

#### 3. **API Endpoint Fixes** (7 endpoints)
- All endpoints now advance `current_step` on completion
- Step 2 → 3, Step 3 → 4, ..., Step 8 → 9
- Enables auto-advance functionality
- Proper error handling maintained

### Production-Grade Enhancements

#### Auto-Advance System
```tsx
useEffect(() => {
  if (workflow.current_step > step) {
    router.replace(`/workflows/${workflow.id}/steps/${workflow.current_step}`)
  }
}, [workflow.current_step, step, router])
```

#### Narrative Progress
```
ICP → Competitors → Seeds → Longtails → Filtering → Clustering → Validation → Subtopics → Articles
```

#### Complete Telemetry
- `workflow_step_viewed` (page load)
- `workflow_step_started` (user clicks run)
- `workflow_step_completed/failed` (API result)

#### Failure Recovery
- Clean error display in layout
- Retry functionality preserved
- No dead ends or broken states

---

## Testing Strategy

### Guard Logic
- ✅ Cannot access step 3 before step 1 complete
- ✅ Cannot access completed workflow steps
- ✅ Refresh maintains correct step
- ✅ Redirect to current step if accessing future step
- ✅ Auto-advance works for async operations

### Navigation
- ✅ Back button routes to dashboard
- ✅ Continue button uses backend state
- ✅ SPA navigation throughout
- ✅ No full page reloads
- ✅ Auto-advance to next step

### Analytics
- ✅ Page view fires once per mount
- ✅ Step started fires on user action
- ✅ Step completed/failed fires on API result
- ✅ No duplicate events
- ✅ Complete audit trail

---

## Key Design Decisions

### Why Pages, Not Modal?
- ✅ Refresh-safe
- ✅ Bookmarkable
- ✅ Deep-linkable
- ✅ Cleaner separation of concerns
- ✅ Easier to test

### Why Backend Authority?
- ✅ No UI-derived state
- ✅ Prevents step skipping
- ✅ Consistent across devices
- ✅ Audit trail complete

### Why Shared Layout?
- ✅ No duplication across 9 steps
- ✅ Consistent UX
- ✅ Centralized analytics
- ✅ Easy to maintain

---

## Files

### New Files
- `lib/guards/workflow-step-gate.ts` - Guard logic
- `components/workflows/WorkflowStepLayoutClient.tsx` - Shared layout
- `components/workflows/steps/Step1ICPForm.tsx` - Step 1 form
- `app/workflows/[id]/steps/1/page.tsx` - Step 1 page

### Modified Files
- `components/dashboard/workflow-dashboard/WorkflowDetailModal.tsx` - Read-only navigation

---

## Production Readiness

- ✅ Backend authority enforced
- ✅ Linear progression guaranteed
- ✅ Refresh-safe
- ✅ Bookmarkable
- ✅ Analytics complete
- ✅ SPA-safe navigation
- ✅ Type-safe
- ✅ Scales to all 9 steps

**Status**: Ready for production deployment.
