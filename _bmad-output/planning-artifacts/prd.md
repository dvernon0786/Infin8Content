---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
inputDocuments: ["/home/dghost/Desktop/Infin8Content/docs/Perfect This is exactly.md"]
workflowType: 'prd'
lastStep: 11
briefCount: 0
researchCount: 1
brainstormingCount: 0
projectDocsCount: 0
prdStatus: 'LOCKED_EXECUTION_READY'
---

# Product Requirements Document - Infin8Content

**Author:** Dghost  
**Date:** 2026-02-04  
**Status:** ✅ LOCKED – EXECUTION READY  
**MVP Scope:** Everything in "Perfect This is exactly.md"  
**Ship Date:** 2026-02-04  

---

## Executive Summary

Infin8Content exists to generate **intent-driven, high-quality content** through a deterministic, auditable pipeline that separates onboarding configuration from workflow execution. This initiative introduces a content-first onboarding system with hard-gated transitions to Intent Engine workflows, ensuring no execution can occur without validated organizational setup.

### What Makes This Special

The system is designed so that mistakes are **structurally impossible, not merely unlikely**. Through server-side validation, versioned onboarding, and sequential agent-based content generation, the platform guarantees narrative coherence while maintaining full audit trails. The deterministic pipeline (Planner → Research → Content → Assembly) processes sections one at a time, eliminating parallel execution risks and ensuring consistent output quality.

## Project Classification

**Technical Type:** web_app  
**Domain:** general  
**Complexity:** high  
**Project Context:** Greenfield - new project

---

## Success Criteria (LOCKED)

### User Success
- Users complete 6-step onboarding without confusion or bypass
- Users successfully create Intent Engine workflows after onboarding
- Users receive coherent, high-quality articles matching business intent
- Users publish to WordPress with idempotent confidence

### Business Success
- 100% onboarding completion rate (no partial abandonment)
- 100% workflow creation success for validated orgs
- Article coherence verified end-to-end (no narrative drift)
- Publishing idempotency enforced (no duplicate posts)

### Technical Success
- Server-side validation is authoritative (frontend state irrelevant)
- Onboarding versioning prevents silent drift
- Sequential pipeline enforces narrative continuity
- Zero-bypass architecture structurally enforced

### Measurable Outcomes
- Onboarding completion: 100% of started users
- Workflow creation: 100% success for validated orgs
- Article generation: 100% completion without parallel execution
- Publishing: 100% idempotent (no duplicates on retry)

---

## Product Scope (LOCKED)

### MVP - Minimum Viable Product (Ship Today)

**Onboarding System (Epic A)**
- 6-step wizard (Business, Competitors, Blog, Article Rules, Keywords, Integration)
- Server-side validator (authoritative)
- Onboarding versioning (v1)
- Route + API guards (hard gates)
- Organizations table schema updates

**Deterministic Article Pipeline (Epic B)**
- Planner Agent (structure authority)
- Research Agent (Perplexity Sonar, fixed prompt, max 10 searches)
- Content Writing Agent (fixed prompt, section-by-section)
- Sequential orchestration (no parallel sections)
- Context accumulation (prior sections passed forward)

**Assembly, Status & Publishing (Epic C)**
- Section assembly (markdown + HTML)
- Article status tracking (queued → completed)
- WordPress publishing integration (idempotent)
- Publish references table (prevent duplicates)

### Growth Features (Post-MVP)
- Batch article generation
- Advanced keyword clustering
- Multi-language support
- Custom agent prompts

### Vision (Future)
- Real-time collaboration
- AI-assisted onboarding
- Advanced analytics
- Multi-tenant workflows

---

## Execution Model (LOCKED)

### Onboarding → Workflow Boundary (Hard Rules)
- Onboarding must be completed and validated server-side
- Onboarding is versioned
- Only validated onboarding may create workflows
- Workflows may never substitute onboarding data
- Execution services require a workflow context

### Article Generation Pipeline (Strict Sequence)
```
Planner Agent
→ Research Agent (per section)
→ Content Writing Agent (per section)
→ Assembly
→ Publish
```

**Rules:**
- Sections processed one at a time
- Research always precedes writing
- Each section receives planner structure + section research + prior sections
- Final section receives entire compiled draft
- ❌ No batch writing
- ❌ No parallel sections
- ❌ No shortcut generation

### Agent Prompt Contracts (Immutable)
- Research Agent: Perplexity Sonar, fixed prompt, max 10 searches, full answers + citations
- Content Writing Agent: Fixed prompt, one section at a time, no commentary

---

## Data Model (LOCKED)

### Organizations Table Extensions
```sql
ALTER TABLE organizations
ADD COLUMN onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN onboarding_version TEXT DEFAULT 'v1',
ADD COLUMN website_url TEXT,
ADD COLUMN business_description TEXT,
ADD COLUMN target_audiences TEXT[],
ADD COLUMN blog_config JSONB,
ADD COLUMN content_defaults JSONB,
ADD COLUMN keyword_settings JSONB;
```

### Article Sections Table (NEW)
```sql
CREATE TABLE article_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  section_order INTEGER NOT NULL,
  section_header TEXT NOT NULL,
  section_type TEXT NOT NULL,
  planner_payload JSONB NOT NULL,
  research_payload JSONB,
  content_markdown TEXT,
  content_html TEXT,
  status TEXT CHECK (status IN ('pending', 'researching', 'researched', 'writing', 'completed', 'failed')) DEFAULT 'pending',
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (article_id, section_order)
);
```

---

## Epic Structure (MAX 3 – LOCKED)

### 🧱 Epic A: Onboarding System & Guards
- Onboarding wizard UI
- Data persistence
- Versioning
- Server-side validator
- Route + API guards
- OnboardingGuard implementation

### 🤖 Epic B: Deterministic Article Pipeline
- Planner Agent
- Research Agent (Perplexity integration)
- Content Writing Agent
- Sequential section-by-section execution
- Context accumulation
- Inngest orchestration

### 🚀 Epic C: Assembly, Status & Publishing
- Section assembly
- Markdown + HTML output
- Article status tracking
- WordPress publishing integration
- Publish references + idempotency

---

## Handoff Point (BMAD)

### ✅ PRD v1.0 Complete & Locked

**Status:** Approved – Execution Ready  
**Source of Truth:** Perfect This is exactly.md  
**No further edits** unless scope changes  

### 👉 Next Agent: Architect Agent

**Architect mandate:**
- Define module boundaries
- Define Inngest orchestration
- Own execution contracts
- Enforce guards structurally
- Create implementation-ready epics

---

## 🧠 Final PM Statement

> *"This system is designed so that mistakes are structurally impossible, not merely unlikely."*

**PRD v1.0 is LOCKED. Ready for Architect Agent.**
