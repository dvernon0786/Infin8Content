# Runtime Architecture Technical Specification

**Spec ID**: TS-001  
**Version**: 1.0  
**Status**: LOCKED & ENFORCED  
**Created**: 2026-01-18  
**Author**: Barry (Quick Flow Solo Dev)  
**Enforcement**: CI-Required  

---

## 🎯 Executive Summary

This technical specification formalizes the verified runtime architecture of Infin8Content and establishes non-negotiable invariants that must be enforced by CI systems. The architecture has been battle-tested through production incidents and represents the single source of truth for all development activities.

### Critical Success Factors
- **Zero Realtime State Mutations**: Realtime is signal-only
- **Database as Single Source of Truth**: All state from API responses
- **Stable Component Lifecycle**: Hooks under stable layouts only
- **Idempotent Reconciliation**: Safe to call repeatedly
- **Connectivity-Based Polling**: Fallback transport only

---

## 🏗️ Architecture Overview

### Core Technology Stack (Locked)
```yaml
Runtime:
  Framework: Next.js 16.1.1 (App Router)
  UI: React 19.2.3
  Language: TypeScript 5.x (strict mode)
  
Database & Auth:
  Primary: Supabase (PostgreSQL)
  Auth: Supabase Auth with JWT
  Realtime: Supabase Realtime (signal-only)
  
Monitoring:
  Error Tracking: Sentry 10.34.0 (Next.js 16 compatible)
  Performance: Custom monitoring hooks
  
Build System:
  Bundler: Turbopack (Next.js 16 default)
  Testing: Vitest + Playwright
  Linting: ESLint with strict rules
```

### Architectural Invariants (Non-Negotiable)

#### 1. Realtime Signal Pattern
```typescript
// ✅ ENFORCED: Realtime as signal only
supabase.channel('articles')
  .on('postgres_changes', (event) => {
    // Only trigger reconciliation - never use event.payload
    triggerReconciliation()
  })

// ❌ FORBIDDEN: Realtime as data source
supabase.channel('articles')
  .on('postgres_changes', (event) => {
    setArticles(prev => [...prev, event.payload]) // CI VIOLATION
  })
```

#### 2. Polling Fallback Pattern
```typescript
// ✅ ENFORCED: Connectivity-based polling
useEffect(() => {
  const polling = setInterval(() => {
    if (!navigator.onLine) {
      triggerReconciliation()
    }
  }, 120000) // 2-minute fallback only

  return () => clearInterval(polling)
}, []) // No data dependencies

// ❌ FORBIDDEN: Data-aware polling
useEffect(() => {
  const polling = setInterval(() => {
    if (articles.length === 0) { // CI VIOLATION
      fetchArticles()
    }
  }, 5000)
  return () => clearInterval(polling)
}, [articles.length])
```

#### 3. Component Lifecycle Pattern
```typescript
// ✅ ENFORCED: Stable layout with stateful hooks
function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main>{children}</main>
    </div>
  )
}

function ArticlesPage() {
  const { articles, refresh } = useArticlesRealtime() // Stable parent
  return <ArticleList articles={articles} />
}

// ❌ FORBIDDEN: Diagnostic components with stateful hooks
function DebugPanel() {
  const debug = useDebugRealtime() // CI VIOLATION
  return <div>Debug: {debug.status}</div>
}
```

---

## 🔒 CI Enforcement Rules

### Automated Violations (Must Fail Build)

#### Rule 1: Realtime State Mutation Detection
```yaml
CI Rule: NO_REALTIME_STATE_MUTATION
Pattern: setArticles.*event\.payload
Files: hooks/**/*.ts, components/**/*.tsx
Action: BUILD_FAILURE
Message: "Direct state mutation from realtime payload forbidden"
```

#### Rule 2: Data-Aware Polling Detection
```yaml
CI Rule: NO_DATA_AWARE_POLLING
Pattern: useEffect.*articles\.length.*setInterval
Files: hooks/**/*.ts, components/**/*.tsx
Action: BUILD_FAILURE
Message: "Polling cannot depend on data state"
```

#### Rule 3: Stateful Diagnostic Components
```yaml
CI Rule: NO_STATEFUL_DIAGNOSTICS
Pattern: function.*Debug.*useEffect|useState
Files: components/**/debug*.tsx, components/**/diagnostic*.tsx
Action: BUILD_FAILURE
Message: "Diagnostic components cannot contain stateful hooks"
```

#### Rule 4: Missing Reconciliation Calls
```yaml
CI Rule: REALTIME_RECONCILIATION_REQUIRED
Pattern: supabase\.channel.*on.*=>.*\{[^}]*\}(?!.*refreshArticles)
Files: hooks/**/*.ts
Action: BUILD_FAILURE
Message: "Realtime handlers must trigger reconciliation"
```

### Manual Review Requirements

#### Code Review Checklist (Must Pass)
```markdown
## Runtime Architecture Compliance

- [ ] Realtime handlers only call reconciliation functions
- [ ] Polling logic is connectivity-based only
- [ ] No data dependencies in polling effects
- [ ] Stateful hooks are under stable layouts
- [ ] Diagnostic components are pure display
- [ ] Reconciliation endpoints are used correctly
- [ ] No optimistic updates or incremental patches
- [ ] All state updates come from API responses

## Component Lifecycle Compliance

- [ ] Stateful hooks live under stable layout boundaries
- [ ] No diagnostic components with useEffect/useState
- [ ] Component tree stability verified
- [ ] Hook lifecycle documented

## API Integration Compliance

- [ ] /api/articles/queue used for reconciliation
- [ ] No direct realtime payload usage
- [ ] Idempotent refresh patterns implemented
```

---

## 📊 Authoritative Endpoints

### Reconciliation Endpoint Specification
```yaml
Endpoint: /api/articles/queue
Method: GET
Purpose: Authoritative state reconciliation
Characteristics:
  - Idempotent: Safe to call repeatedly
  - Authoritative: Returns current database state
  - Complete: Full objects with relationships
  - Consistent: Same structure regardless of trigger
  - Performant: Optimized for frequent calls

Usage Rules:
  - Must be used for all state updates
  - Realtime payloads must trigger calls to this endpoint
  - Polling mechanisms use this as fallback
  - Client state always replaced, never merged
```

### Endpoint Integration Patterns
```typescript
// ✅ ENFORCED: Standard reconciliation pattern
async function refreshArticlesFromQueue() {
  try {
    const response = await fetch('/api/articles/queue')
    const data = await response.json()
    setArticles(data.articles) // Replace entire state
  } catch (error) {
    console.error('Reconciliation failed:', error)
  }
}

// Integration points:
// 1. Realtime event handlers
// 2. Polling fallback mechanisms
// 3. Manual refresh actions
// 4. Component mount initialization
```

---

## 🛡️ Architecture Compliance Matrix

| Component | Requirement | Enforcement | Status |
|-----------|-------------|-------------|---------|
| Realtime Handlers | Signal-only, trigger reconciliation | CI Auto | ✅ Locked |
| Polling Logic | Connectivity-based, no data deps | CI Auto | ✅ Locked |
| Component Lifecycle | Stable layouts only | Manual Review | ✅ Locked |
| API Integration | Queue endpoint only | CI Auto | ✅ Locked |
| State Management | Full replacement, no patches | CI Auto | ✅ Locked |
| Diagnostic Components | Pure display only | CI Auto | ✅ Locked |

---

## 🚨 Deviation Process

### Architectural Exception Request
Any deviation from this specification requires:

1. **Architecture Review Board Approval**
   - Senior Architect sign-off
   - Impact assessment documentation
   - Regression prevention strategy

2. **Technical Justification**
   - Why deviation is necessary
   - Alternative approaches considered
   - Risk mitigation plan

3. **Implementation Requirements**
   - Comprehensive test coverage
   - Monitoring and alerting
   - Rollback procedures

4. **Documentation Updates**
   - Updated technical specification
   - Developer training materials
   - CI rule modifications

### Exception Template
```markdown
## Architecture Exception Request

**Request ID**: AER-XXX
**Date**: [Date]
**Requester**: [Name]
**Specification**: TS-001

### Deviation Requested
[Specific rule to violate]

### Justification
[Why this deviation is necessary]

### Risk Assessment
[Potential impacts and mitigations]

### Implementation Plan
[How to implement safely]

### Rollback Strategy
[How to revert if needed]
```

---

## 📋 Implementation Guidelines

### Development Workflow
1. **Read Specification**: All developers must read this spec
2. **Follow Patterns**: Use enforced code patterns only
3. **Test Compliance**: Verify against CI rules locally
4. **Code Review**: Pass manual compliance checklist
5. **CI Validation**: Automated enforcement in pipeline

### Onboarding Requirements
- **Mandatory Reading**: This technical specification
- **Pattern Training**: Correct/incorrect code examples
- **CI Rule Education**: Understanding build failures
- **Architecture Review**: Quarterly compliance reviews

### Monitoring & Compliance
- **Build Success Rate**: Track CI compliance
- **Exception Requests**: Monitor deviation frequency
- **Architecture Drift**: Regular compliance audits
- **Developer Feedback**: Continuous improvement

---

## 🔗 References

### Authoritative Documentation
- **ARCHITECTURE.md**: Realtime & Polling Architecture (Authoritative)
- **COMPONENT_CATALOG.md**: Component Lifecycle Rules
- **DEVELOPMENT_GUIDE.md**: Realtime & Polling Development Rules
- **API_REFERENCE.md**: Reconciliation Endpoint Authority

### Implementation Examples
- **Hooks**: `/hooks/use-articles-realtime.ts`
- **Components**: `/components/dashboard/articles-page.tsx`
- **API Routes**: `/app/api/articles/queue/route.ts`
- **Realtime Service**: `/lib/supabase/realtime.ts`

---

## 📝 Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-18 | Initial locked specification | Barry |

---

**This specification is LOCKED and ENFORCED by CI systems. Any modifications require formal architectural exception process.**

*The runtime architecture described herein represents battle-tested, production-proven patterns that must be followed without exception.*
