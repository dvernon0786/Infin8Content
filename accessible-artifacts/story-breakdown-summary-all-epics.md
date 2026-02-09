---
title: "Story Breakdown Summary: All Epics (A, B, C)"
prd_version: "1.0"
status: "LOCKED & READY FOR ARCHITECT"
date: "2026-02-04"
---

# 📖 Story Breakdown Summary: All Epics (A, B, C)

**Status:** ✅ LOCKED & READY FOR ARCHITECT  
**PRD Version:** 1.0 (LOCKED)  
**Date:** 2026-02-04  
**Total Epics:** 3  
**Total Stories:** 15  
**Total Effort:** 72 hours

---

## Executive Summary

This document contains the complete, detailed story breakdown for implementing Infin8Content's onboarding system and deterministic article pipeline (PRD v1.0).

**Three Epics:**
- **Epic A:** Onboarding System & Guards (6 stories, 26 hours)
- **Epic B:** Deterministic Article Pipeline (5 stories, 26 hours)
- **Epic C:** Assembly, Status & Publishing (4 stories, 20 hours)

**Key Principles:**
- ✅ Server-side validation is authoritative (frontend state irrelevant)
- ✅ Hard gates prevent bypass (structural, not policy-based)
- ✅ Sequential execution (no parallel processing)
- ✅ Idempotent operations (safe retries)
- ✅ Fixed prompts (no variation)
- ✅ Full audit trails (all decisions logged)

---

## Story Dependency Map

```
EPIC A: Onboarding & Guards
├── A-1: Data Model Extensions (2h)
├── A-2: Onboarding Guard Middleware (4h) → depends on A-1
├── A-3: Onboarding API Endpoints (6h) → depends on A-1, A-2
├── A-4: Onboarding UI Components (8h) → depends on A-1, A-2, A-3
├── A-5: Onboarding Agent (AI Autocomplete) (4h) → depends on A-3
└── A-6: Onboarding Validator (2h) → depends on A-1, A-3

EPIC B: Deterministic Pipeline (depends on Epic A complete)
├── B-1: Article Sections Data Model (2h)
├── B-2: Research Agent Service (6h) → depends on B-1
├── B-3: Content Writing Agent Service (6h) → depends on B-2
├── B-4: Sequential Orchestration (Inngest) (8h) → depends on B-1, B-2, B-3
└── B-5: Article Status Tracking (4h) → depends on B-1, B-4

EPIC C: Assembly & Publishing (depends on Epic B complete)
├── C-1: Article Assembly Service (4h) → depends on B-1
├── C-2: Publish References Table (2h)
├── C-3: WordPress Publishing Service (6h) → depends on C-1, C-2
├── C-4: Publishing API Endpoint (4h) → depends on C-3
└── C-5: Article Status & Publishing UI (4h) → depends on C-4
```

---

## Epic A: Onboarding System & Guards (26 hours)

**Purpose:** Implement 6-step onboarding wizard with server-side validation and hard route guards.

### Stories

| Story | Title | Effort | Type | Dependencies |
|-------|-------|--------|------|--------------|
| A-1 | Data Model Extensions | 2h | Infrastructure | None |
| A-2 | Onboarding Guard Middleware | 4h | Backend | A-1 |
| A-3 | Onboarding API Endpoints | 6h | Backend | A-1, A-2 |
| A-4 | Onboarding UI Components | 8h | Frontend | A-1, A-2, A-3 |
| A-5 | Onboarding Agent (AI) | 4h | Backend | A-3 |
| A-6 | Onboarding Validator | 2h | Backend | A-1, A-3 |

### Key Deliverables
- ✅ Extended organizations table (8 new columns)
- ✅ Route guards (middleware-based)
- ✅ 7 API endpoints (business, competitors, blog, content-defaults, keyword-settings, integration, complete)
- ✅ 6-step wizard UI (Business → Competitors → Blog → Articles → Keywords → Integration)
- ✅ AI autocomplete service (Perplexity/Firecrawl)
- ✅ Onboarding validator (pre-workflow check)

### Success Criteria
- 100% of users complete onboarding without confusion
- 100% of workflows created have valid onboarding config
- No bypass paths to dashboard
- No frontend-only validation

### Hard Rules
- ❌ No skipping steps
- ❌ No frontend-only validation
- ❌ No onboarding state in workflow
- ❌ No partial onboarding

---

## Epic B: Deterministic Article Pipeline (26 hours)

**Purpose:** Implement section-by-section article generation with sequential processing and fixed prompts.

### Stories

| Story | Title | Effort | Type | Dependencies |
|-------|-------|--------|------|--------------|
| B-1 | Article Sections Data Model | 2h | Infrastructure | None |
| B-2 | Research Agent Service | 6h | Backend | B-1 |
| B-3 | Content Writing Agent Service | 6h | Backend | B-2 |
| B-4 | Sequential Orchestration (Inngest) | 8h | Backend | B-1, B-2, B-3 |
| B-5 | Article Status Tracking | 4h | Backend | B-1, B-4 |

### Key Deliverables
- ✅ article_sections table (section-level tracking)
- ✅ Research Agent (Perplexity Sonar, fixed prompt, max 10 searches)
- ✅ Content Writing Agent (OpenRouter, fixed prompt, section-by-section)
- ✅ Inngest orchestration (sequential, no parallelism)
- ✅ Progress tracking API (real-time status)

### Success Criteria
- 100% sections processed sequentially (no parallel execution)
- 100% prior sections passed as context
- 100% fixed prompts never modified
- 100% articles complete without narrative drift
- 100% retry logic works (3 attempts per section)

### Hard Rules
- ❌ No batch writing
- ❌ No parallel sections
- ❌ No shortcut generation
- ❌ No prompt modification
- ❌ No skipping sections

---

## Epic C: Assembly, Status & Publishing (20 hours)

**Purpose:** Implement article assembly, status tracking, and idempotent WordPress publishing.

### Stories

| Story | Title | Effort | Type | Dependencies |
|-------|-------|--------|------|--------------|
| C-1 | Article Assembly Service | 4h | Backend | B-1 |
| C-2 | Publish References Table | 2h | Infrastructure | None |
| C-3 | WordPress Publishing Service | 6h | Backend | C-1, C-2 |
| C-4 | Publishing API Endpoint | 4h | Backend | C-3 |
| C-5 | Article Status & Publishing UI | 4h | Frontend | C-4 |

### Key Deliverables
- ✅ Article assembly (markdown + HTML)
- ✅ publish_references table (idempotency tracking)
- ✅ WordPress publishing service (idempotent)
- ✅ Publishing API endpoint
- ✅ Article detail UI with publish button

### Success Criteria
- 100% articles assembled correctly
- 100% publishing is idempotent (no duplicates on retry)
- 100% users can publish with confidence
- 100% published URLs tracked
- 100% error handling graceful

### Hard Rules
- ❌ No auto-retry (user retry only)
- ❌ No draft publishing
- ❌ No media upload
- ❌ No categories/tags
- ❌ No parallel publishing

---

## Implementation Sequence

### Phase 1: Foundation (Epic A)
**Duration:** 1-2 weeks  
**Outcome:** Onboarding system complete, dashboard protected

1. A-1: Data Model Extensions (2h)
2. A-2: Onboarding Guard Middleware (4h)
3. A-3: Onboarding API Endpoints (6h)
4. A-4: Onboarding UI Components (8h)
5. A-5: Onboarding Agent (4h)
6. A-6: Onboarding Validator (2h)

**Validation:**
- Users can complete onboarding
- Dashboard is protected
- Workflows cannot be created without onboarding

### Phase 2: Pipeline (Epic B)
**Duration:** 1-2 weeks  
**Outcome:** Deterministic article generation working

1. B-1: Article Sections Data Model (2h)
2. B-2: Research Agent Service (6h)
3. B-3: Content Writing Agent Service (6h)
4. B-4: Sequential Orchestration (8h)
5. B-5: Article Status Tracking (4h)

**Validation:**
- Articles generate sequentially
- Sections receive prior context
- Progress tracking works
- No parallel execution

### Phase 3: Publishing (Epic C)
**Duration:** 1 week  
**Outcome:** Articles can be published to WordPress

1. C-1: Article Assembly Service (4h)
2. C-2: Publish References Table (2h)
3. C-3: WordPress Publishing Service (6h)
4. C-4: Publishing API Endpoint (4h)
5. C-5: Article Status & Publishing UI (4h)

**Validation:**
- Articles assemble correctly
- Publishing is idempotent
- Published URLs tracked
- Users can publish with confidence

---

## Testing Strategy

### Epic A Testing
- **Unit Tests:** Validation schemas, guard logic, API endpoints
- **Integration Tests:** Onboarding flow end-to-end
- **E2E Tests:** User completes onboarding, accesses dashboard
- **Security Tests:** Auth enforcement, organization isolation

### Epic B Testing
- **Unit Tests:** Research Agent, Content Writing Agent
- **Integration Tests:** Section processing, orchestration
- **E2E Tests:** Article generation end-to-end
- **Performance Tests:** Section processing time, timeout enforcement

### Epic C Testing
- **Unit Tests:** Assembly logic, WordPress adapter
- **Integration Tests:** Publishing flow, idempotency
- **E2E Tests:** Article publish end-to-end
- **Security Tests:** Auth enforcement, organization isolation

---

## Architecture Handoff Points

### Architect Responsibilities
1. **Module Boundaries:** Define service boundaries, API contracts
2. **Inngest Orchestration:** Design workflow structure, retry logic
3. **Guard Enforcement:** Ensure guards are structural, not policy-based
4. **Execution Contracts:** Lock API contracts, database schemas
5. **Error Handling:** Define error codes, retry strategies

### Developer Responsibilities
1. **Implementation:** Build services, APIs, UI components
2. **Testing:** Write unit, integration, E2E tests
3. **Documentation:** API docs, component docs, troubleshooting guides
4. **Deployment:** Deploy to staging, production

---

## Risk Mitigation

### Risk: Frontend Bypasses Guards
**Mitigation:** All guards are server-side (middleware + API validation)

### Risk: Parallel Section Processing
**Mitigation:** Inngest orchestration enforces sequential execution

### Risk: Prompt Drift
**Mitigation:** Prompts are locked in code, versioned, never modified

### Risk: Duplicate Publishing
**Mitigation:** publish_references table enforces idempotency

### Risk: Lost Progress
**Mitigation:** article_sections table persists all intermediate state

### Risk: Narrative Drift
**Mitigation:** Prior sections passed as context to each section

---

## Success Metrics

### Onboarding (Epic A)
- ✅ 100% of users complete onboarding
- ✅ 0% bypass attempts succeed
- ✅ <2 minutes average onboarding time

### Article Generation (Epic B)
- ✅ 100% of articles complete without errors
- ✅ 100% of sections receive prior context
- ✅ 0% parallel execution incidents
- ✅ <10 minutes per article generation time

### Publishing (Epic C)
- ✅ 100% of articles publish successfully
- ✅ 0% duplicate posts
- ✅ 100% idempotency on retry
- ✅ <30 seconds per publish operation

---

## Detailed Story Documents

**Epic A Stories:**
- `story-breakdown-epic-a-onboarding-guards.md`

**Epic B Stories:**
- `story-breakdown-epic-b-deterministic-pipeline.md`

**Epic C Stories:**
- `story-breakdown-epic-c-assembly-publishing.md`

---

## Handoff Checklist

- ✅ UX specification locked (screen-by-screen flows)
- ✅ PRD v1.0 locked (no changes)
- ✅ Story breakdown complete (15 stories, 72 hours)
- ✅ Dependencies mapped (clear execution order)
- ✅ Success criteria defined (measurable outcomes)
- ✅ Risk mitigation planned (guard enforcement, idempotency)
- ✅ Testing strategy defined (unit, integration, E2E)
- ✅ Architecture handoff points identified

---

## Next Steps

**For Architect:**
1. Review all three story breakdown documents
2. Define module boundaries and API contracts
3. Design Inngest orchestration
4. Lock execution contracts
5. Create implementation-ready epics

**For PM:**
1. Prioritize stories within each epic
2. Assign stories to developers
3. Plan sprint schedule
4. Set up tracking/monitoring

**For Developers:**
1. Wait for architect handoff
2. Review story acceptance criteria
3. Prepare development environment
4. Begin implementation (Phase 1 → Phase 2 → Phase 3)

---

**Story Breakdown Status: LOCKED & READY FOR ARCHITECT ✅**

All stories are independently testable, guard-aware, and non-bypassable.
Ready for implementation.
