# Tavily API Call Tracking Fix

## Issue Identified
- **Problem**: Tavily API calls were not being tracked in performance monitoring
- **Symptom**: Performance monitor showed "0 API calls" even when research was running
- **Root Cause**: `performanceMonitor.recordApiCall()` was not being called in research optimizer

## Fix Applied

### 1. Added Performance Monitor Import
```typescript
import { performanceMonitor } from './performance-monitor'
```

### 2. Track Comprehensive Research API Call
```typescript
// Track API call for performance monitoring
performanceMonitor.recordApiCall(articleId, 'research')
```

### 3. Track Targeted Research API Call
```typescript
// Track additional API call for performance monitoring
performanceMonitor.recordApiCall(articleId, 'research')
```

## Expected Behavior

### Before Fix
```
[PerformanceMonitor] Generation completed in 130113ms with 0 API calls
```

### After Fix
```
[ResearchOptimizer] Fetched 8 comprehensive sources
[PerformanceMonitor] API call recorded: research for article {articleId}
[ResearchOptimizer] Fetched 5 targeted sources (if needed)
[PerformanceMonitor] API call recorded: research for article {articleId}
[PerformanceMonitor] Generation completed in 130113ms with 2 API calls
```

## Testing Instructions

1. Start a new article generation
2. Monitor the console logs for:
   - `[ResearchOptimizer] Fetched X comprehensive sources`
   - `[PerformanceMonitor] API call recorded: research`
   - `[PerformanceMonitor] Generation completed with X API calls`

3. Verify that API calls count is > 0 in performance monitoring

## Files Modified

- `lib/services/article-generation/research-optimizer.ts`
  - Added performance monitor import
  - Added API call tracking for comprehensive research
  - Added API call tracking for targeted research

## Impact

- **Performance Monitoring**: Now accurately tracks Tavily API usage
- **Cost Tracking**: Proper API cost attribution
- **Metrics**: Correct API call counts in performance reports
- **Debugging**: Better visibility into research activity
