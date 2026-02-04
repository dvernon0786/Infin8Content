---
title: "Formalized Epics: A, B, C"
prd_version: "1.0"
status: "READY FOR APPROVAL"
date: "2026-02-04"
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics"]
inputDocuments:
  - "docs/Perfect This is exactly.md"
  - "architecture-document-complete.md"
  - "story-breakdown-epic-a-onboarding-guards.md"
  - "story-breakdown-epic-b-deterministic-pipeline.md"
  - "story-breakdown-epic-c-assembly-publishing.md"
---

# 📋 Formalized Epics: A, B, C

**Project:** Infin8Content  
**PRD Version:** 1.0 (LOCKED)  
**Status:** Ready for Approval  
**Date:** 2026-02-04

---

## Epic List

### Epic A: Onboarding System & Guards

**User Outcome:** Organizations can complete a guided onboarding flow that configures business context, competitors, blog settings, content rules, and integrations before accessing the Intent Engine.

**Purpose:** Implement a 6-step onboarding wizard with server-side validation and hard route guards that prevent dashboard access until onboarding is complete.

**Stories Included:**
- A-1: Data Model Extensions
- A-2: Onboarding Validator (Server-Side)
- A-3: Route Guards & Redirects
- A-4: Business Step UI
- A-5: Competitors, Blog, Articles, Keywords, Integration Steps UI
- A-6: Onboarding Completion & Transition

**Dependencies:** None (foundational)  
**Blocking:** Epic B (requires onboarding_completed = true)

---

### Epic B: Deterministic Article Pipeline

**User Outcome:** Articles are generated through a deterministic, section-by-section pipeline (Research → Content Writing → Assembly) with full observability and per-section retry capability.

**Purpose:** Implement a deterministic, section-by-section article generation pipeline that processes articles sequentially (Planner → Research → Content → Assembly) with no parallel execution.

**Stories Included:**
- B-1: Article Sections Data Model
- B-2: Research Agent (Perplexity Sonar Integration)
- B-3: Content Writing Agent (Section-by-Section)
- B-4: Sequential Orchestration (Inngest)
- B-5: Context Accumulation & State Management

**Dependencies:** Epic A (onboarding must be complete)  
**Blocking:** Epic C (pipeline must complete before assembly)

---

### Epic C: Assembly, Status & Publishing

**User Outcome:** Completed articles are assembled into final markdown/HTML, tracked for status, and published to WordPress with idempotent guarantees.

**Purpose:** Implement article assembly (markdown + HTML), status tracking, and idempotent WordPress publishing.

**Stories Included:**
- C-1: Article Assembly Service
- C-2: Article Status Tracking
- C-3: WordPress Publishing Integration (Idempotent)
- C-4: Publish References & Duplicate Prevention

**Dependencies:** Epic B (pipeline must complete)  
**Blocking:** None (terminal epic)

---

## Requirements Coverage Map

### Functional Requirements (from PRD v1.0)

**Epic A Coverage:**
- FR1: Organizations can configure business information (website, description, audiences)
- FR2: Organizations can add and manage competitor URLs (3-7 competitors)
- FR3: Organizations can configure blog settings (sitemap, blog root, reference articles)
- FR4: Organizations can set global content defaults (language, tone, style, auto-publish rules)
- FR5: Organizations can configure keyword settings (region, auto-generation toggle)
- FR6: Organizations can configure integrations (WordPress, Webflow, etc.)
- FR7: Route guards prevent dashboard access until onboarding is complete
- FR8: API guards return 403 ONBOARDING_INCOMPLETE for protected endpoints

**Epic B Coverage:**
- FR9: Articles are processed section-by-section in strict sequential order
- FR10: Research Agent executes Perplexity Sonar with fixed prompt (max 10 searches)
- FR11: Content Writing Agent generates sections with fixed prompt
- FR12: Context accumulation: prior sections passed to subsequent sections
- FR13: Section-level retry capability with error tracking
- FR14: Full observability: section status tracked (pending → researching → researched → writing → completed)

**Epic C Coverage:**
- FR15: All completed sections are assembled into final markdown
- FR16: All completed sections are assembled into final HTML
- FR17: Article metadata calculated (word count, reading time, table of contents)
- FR18: Articles published to WordPress with idempotent guarantees
- FR19: Publish references prevent duplicate publishing
- FR20: Article status transitions to 'completed' after assembly

---

## Non-Functional Requirements

**Epic A:**
- NFR1: Onboarding validator is authoritative (server-side, not client-side)
- NFR2: Route guards are hard gates (no workarounds)
- NFR3: All onboarding data persisted in organizations table (not workflow JSON)
- NFR4: Organization isolation enforced via RLS

**Epic B:**
- NFR5: Section processing is strictly sequential (no parallelization)
- NFR6: Research completes within 5 minutes per section
- NFR7: Content writing completes within 5 minutes per section
- NFR8: Full audit trail of section processing
- NFR9: Graceful error handling (per-section failures don't block other sections)

**Epic C:**
- NFR10: Assembly completes within 5 seconds
- NFR11: WordPress publishing is idempotent (safe to retry)
- NFR12: Publishing timeout ≤ 30 seconds
- NFR13: No automatic publishing (manual only)

---

## Epic Dependencies & Flow

```
AUTH / BILLING (Pre-onboarding)
      ↓
EPIC A: ONBOARDING (Configuration)
      ↓
onboarding_completed = true
      ↓
EPIC B: ARTICLE PIPELINE (Deterministic Generation)
      ↓
All sections completed
      ↓
EPIC C: ASSEMBLY & PUBLISHING (Final Output)
      ↓
Article published to WordPress
```

---

## Key Architectural Decisions

### 1. Onboarding is NOT a Workflow
- Onboarding configures the organization
- It does NOT advance `intent_workflows.status`
- It is idempotent and repeatable
- It gates access to the Intent Engine

### 2. Article Pipeline is Deterministic
- No parallel section processing
- Strict sequential order: Research → Content → Assembly
- Context accumulation: prior sections inform subsequent sections
- Full observability at section level

### 3. Publishing is Idempotent
- Publish references table prevents duplicates
- Safe to retry without side effects
- Manual trigger only (no auto-publish in MVP)

---

## Approval Checkpoint

**Status:** Ready for PM/Architect Review

**Questions for Approval:**
1. Does this epic structure align with your product vision?
2. Are all user outcomes properly captured?
3. Should we adjust any epic groupings?
4. Are there natural dependencies we've missed?

---

**Next Step:** Proceed to Step 3 (Create Stories) to decompose each epic into detailed user stories with acceptance criteria.
