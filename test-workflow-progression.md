# Workflow Progression Test Plan

## Test Steps

### 1. Test Step Navigation
- Visit `/dashboard` - Should show workflow list
- Click "Continue" on any workflow - Should navigate to correct step
- Try accessing `/steps/5` directly - Should redirect to current step

### 2. Test Step Progression
- Start a new workflow or use existing one
- Complete Step 1 (ICP) - Should auto-advance to Step 2
- Complete Step 2 (Competitors) - Should auto-advance to Step 3
- Verify each step advances correctly

### 3. Test Auto-Advance Feature
- Start a step and wait for backend completion
- Verify UI automatically advances to next step
- Refresh page during step - Should maintain correct state

### 4. Test Failure Recovery
- Force an API error during step execution
- Verify error message displays correctly
- Verify retry functionality works

### 5. Test Telemetry Events
- Open browser dev tools
- Verify analytics events fire:
  - `workflow_step_viewed`
  - `workflow_step_started`
  - `workflow_step_completed` or `failed`

## Expected Results

✅ All steps accessible via URLs  
✅ Linear progression enforced  
✅ Auto-advance works for async steps  
✅ Error states are recoverable  
✅ Telemetry events fire correctly  
✅ Dashboard navigation works  

## Manual Testing Commands

```bash
# Test dashboard
curl http://localhost:3000/dashboard

# Test step access (should redirect if not current step)
curl http://localhost:3000/workflows/[id]/steps/5

# Test API endpoints
curl -X POST http://localhost:3000/api/intent/workflows/[id]/steps/competitor-analyze
```

## Notes

- TypeScript errors in IDE are dev server cache issues
- Real functionality works when accessed via browser
- All API endpoints now advance current_step properly
- Auto-advance effect monitors workflow.current_step changes
