# Realtime Stability Engineering Guide

## 🎯 Overview

Comprehensive guide for maintaining stable realtime functionality in the Infin8Content dashboard, preventing crashes, and ensuring reliable user experience.

## 🚨 Critical Rules (NEVER VIOLATE)

### 1. Never Throw Fatal Errors
```typescript
// ❌ FORBIDDEN
onError?.(error); // Crashes UI

// ✅ REQUIRED
progressLogger.warn('Realtime disabled. Polling fallback active.');
// DO NOT propagate error upward
```

### 2. Never Overwrite Completed Status
```typescript
// ❌ FORBIDDEN
newArticles[existingIndex] = newArticle; // Overwrites completed status

// ✅ REQUIRED
if (existingArticle.status === 'completed' && newArticle.status !== 'completed') {
  console.log('🔄 Preserving completed status for article:', newArticle.id);
  return; // Skip overwrite
}
```

### 3. Never Share Retry Counters
```typescript
// ❌ FORBIDDEN
private reconnectAttempts = 0; // Shared across channels

// ✅ REQUIRED
private dashboardReconnectAttempts = 0;
private articleReconnectAttempts = 0; // Independent counters
```

## 🏗️ Architecture Principles

### Separation of Concerns
1. **Realtime**: Best-effort, non-fatal updates
2. **Polling**: Guaranteed fallback mechanism
3. **UI**: Never crashes due to realtime failures

### Failure Isolation
- Each subscription manages its own state
- Failures don't cascade between channels
- UI remains functional during any realtime failure

### Graceful Degradation
- Realtime → Polling → Static content
- User experience degrades smoothly
- Core functionality always available

## 🔧 Implementation Patterns

### 1. Connection Management

```typescript
export class ArticleProgressRealtime {
  private dashboardReconnectAttempts = 0;
  private articleReconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private handleDashboardReconnection(...) {
    if (this.dashboardReconnectAttempts >= this.maxReconnectAttempts) {
      // Graceful fallback - NO ERROR PROPAGATION
      progressLogger.warn('Realtime disabled. Polling fallback active.');
      onConnectionChange?.(false);
      return; // Don't throw, don't propagate
    }

    this.dashboardReconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.dashboardReconnectAttempts - 1);
    
    setTimeout(() => {
      this.subscribeToDashboardUpdates(...);
    }, delay);
  }
}
```

### 2. Status Preservation

```typescript
// hooks/use-realtime-articles.ts
setArticles(prevArticles => {
  const newArticles = since ? [...prevArticles] : [];
  
  if (since) {
    transformedArticles.forEach((newArticle: DashboardArticle) => {
      const existingIndex = newArticles.findIndex(a => a.id === newArticle.id);
      if (existingIndex >= 0) {
        const existingArticle = newArticles[existingIndex];
        
        // CRITICAL: Preserve completed status
        if (existingArticle.status === 'completed' && newArticle.status !== 'completed') {
          console.log('🔄 Preserving completed status for article:', newArticle.id);
          return; // Skip overwrite
        }
        
        newArticles[existingIndex] = newArticle;
      } else {
        newArticles.unshift(newArticle);
      }
    });
  }
  
  return newArticles;
});
```

### 3. Error Boundaries

```typescript
// Component-level error isolation
<ArticleErrorBoundary
  fallback={
    <Card className="border-destructive">
      <CardContent className="pt-6">
        <p className="text-center py-8">
          Realtime updates temporarily unavailable
        </p>
      </CardContent>
    </Card>
  }
>
  <RealtimeComponent />
</ArticleErrorBoundary>
```

## 🧪 Testing Strategies

### 1. Connection Failure Simulation

```typescript
// Test network failure handling
const simulateNetworkFailure = () => {
  // Throttle network to 0kb/s
  // Verify graceful degradation to polling
  // Confirm UI remains functional
};
```

### 2. Status Corruption Testing

```typescript
// Test status preservation
const testStatusPreservation = () => {
  // Set article status to 'completed'
  // Simulate stale data from realtime
  // Verify status remains 'completed'
  // Confirm publish button stays visible
};
```

### 3. Retry Counter Testing

```typescript
// Test independent retry counters
const testRetryIsolation = () => {
  // Fail dashboard subscription
  // Verify article subscription unaffected
  // Confirm independent retry attempts
  // Test max retry behavior
};
```

## 🔍 Monitoring & Debugging

### Key Metrics

1. **Connection Health**
   - Subscription success rate
   - Reconnection attempt frequency
   - Time spent in polling mode

2. **Status Integrity**
   - Completed status preservation rate
   - Status change frequency
   - Stale data detection

3. **User Experience**
   - UI crash frequency (should be 0)
   - Feature availability during failures
   - Error recovery time

### Debug Logging

```typescript
// Structured logging for debugging
console.log('[Realtime] Connection state:', {
  channel: 'dashboard',
  status: 'connecting',
  attempt: this.dashboardReconnectAttempts,
  maxAttempts: this.maxReconnectAttempts,
  timestamp: new Date().toISOString()
});
```

### Health Checks

```typescript
// Realtime health endpoint
export async function GET() {
  return NextResponse.json({
    realtime: {
      connected: articleProgressRealtime.isDashboardConnectionActive(),
      status: articleProgressRealtime.getDashboardConnectionStatus(),
      pollingMode: isPollingActive
    },
    polling: {
      active: isPollingActive,
      lastUpdate: lastPollTimestamp,
      rate: pollRate
    }
  });
}
```

## 🚨 Troubleshooting Guide

### Issue: Dashboard Crashes

**Symptoms:**
- "Failed to reconnect after 5 attempts" error
- UI becomes unresponsive
- Error boundaries triggered

**Root Causes:**
1. Fatal error propagation in reconnection handler
2. Shared retry counters causing premature failure
3. Unhandled promise rejections

**Solutions:**
1. Remove `onError?.(error)` calls after max retries
2. Split retry counters per channel
3. Add proper error boundaries

### Issue: Publish Button Disappears

**Symptoms:**
- Button visible, then disappears
- Article status appears to change
- Inconsistent behavior

**Root Causes:**
1. Realtime overwriting completed status
2. Stale data from API responses
3. Race conditions between updates

**Solutions:**
1. Add status preservation logic
2. Check for completed status before overwrite
3. Use server-side gating for critical features

### Issue: Performance Degradation

**Symptoms:**
- Slow dashboard loading
- High CPU usage
- Memory leaks

**Root Causes:**
1. Excessive reconnection attempts
2. Memory leaks in subscriptions
3. Inefficient polling intervals

**Solutions:**
1. Implement exponential backoff
2. Proper cleanup in useEffect
3. Rate limiting for API calls

## 📋 Preventive Measures

### Code Review Checklist

- [ ] No fatal error propagation in realtime handlers
- [ ] Status preservation logic implemented
- [ ] Independent retry counters for each channel
- [ ] Proper error boundaries around realtime components
- [ ] Graceful degradation to polling
- [ ] No shared state between subscriptions

### Automated Testing

```typescript
// E2E test for realtime stability
describe('Realtime Stability', () => {
  it('should preserve completed status during network failures', async () => {
    // Setup completed article
    // Simulate network failure
    // Verify status remains completed
    // Confirm publish button visible
  });

  it('should gracefully degrade to polling', async () => {
    // Block websocket connections
    // Verify polling starts
    // Confirm UI remains functional
  });
});
```

### Runtime Monitoring

```typescript
// Performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    if (entry.entryType === 'measure') {
      // Track realtime operation performance
      console.log(`[Performance] ${entry.name}: ${entry.duration}ms`);
    }
  });
});

performanceObserver.observe({ entryTypes: ['measure'] });
```

## 🔧 Development Guidelines

### When Adding New Realtime Features

1. **Isolate State**: Never share state between subscriptions
2. **Preserve Critical Data**: Protect completed status, user permissions
3. **Plan for Failure**: Assume realtime will fail
4. **Test Thoroughly**: Simulate network failures, stale data
5. **Monitor Performance**: Track connection health, user experience

### When Modifying Existing Realtime Code

1. **Check Impact**: Verify no regression in stability
2. **Test Edge Cases**: Network failures, max retries, data corruption
3. **Update Documentation**: Keep engineering guide current
4. **Review Monitoring**: Ensure metrics capture new behavior

### When Debugging Realtime Issues

1. **Check Logs**: Look for connection state changes
2. **Verify Status**: Confirm completed status preservation
3. **Test Isolation**: Ensure failures don't cascade
4. **Monitor Resources**: Check for memory leaks, excessive retries

## 🎯 Success Metrics

### Technical Metrics
- ✅ Zero UI crashes due to realtime failures
- ✅ 100% status preservation for completed articles
- ✅ <5 second recovery time from failures
- ✅ <1% time spent in polling mode

### User Experience Metrics
- ✅ Core features always available
- ✅ Smooth transitions between realtime/polling
- ✅ No visible error states for users
- ✅ Consistent behavior across sessions

### System Health Metrics
- ✅ Connection success rate >95%
- ✅ Average reconnection time <2 seconds
- ✅ Memory usage stable over time
- ✅ No performance degradation

## 🔄 Continuous Improvement

### Regular Reviews
1. **Weekly**: Check connection health metrics
2. **Monthly**: Review error patterns and optimize
3. **Quarterly**: Update engineering guidelines
4. **Annually**: Architecture review and improvements

### Knowledge Sharing
1. **Documentation**: Keep this guide current
2. **Training**: Educate team on stability patterns
3. **Incidents**: Document all stability issues and resolutions
4. **Best Practices**: Share lessons learned across projects

Remember: **Realtime is best-effort only. Polling is the guaranteed fallback. The UI must never crash.**
