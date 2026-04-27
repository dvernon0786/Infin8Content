# Project Overview - Infin8Content

Deep Scan: 2026-04-22
Project State: **Production SaaS**
Authority Model: **Zero Drift Protocol** (Deterministic State Management)

## Purpose

Infin8Content is a multi-tenant SaaS platform for AI-powered content generation and SEO strategy. It covers the complete lifecycle: ICP-driven keyword discovery → competitor analysis → topic clustering → human approval gates → article research → section-by-section LLM generation → CMS publishing. The core is governed by a deterministic Finite State Machine (FSM) and an Intent Workflow Engine with human-in-the-loop approval steps.

## Core Architectural Directives

The platform enforces the **Zero Drift Protocol**:

1. **Single Authority**: Article lifecycle is mutated exclusively by the **Trigger API** (state transitions) and **Inngest Workers** (execution). No UI or service may mutate article `status` directly.
2. **Deterministic Pipeline**: FSM transitions are atomic. State cannot be skipped without explicit system override.
3. **Real-time First**: Dashboard state is driven by Supabase Realtime subscriptions — no client-side state inference.
4. **Audit Hardening**: Every state transition, generation event, and billing action is logged to `activities` and `workflow_transition_audit` tables.

## Key Product Areas

| Area | Description |
|------|-------------|
| **Intent Workflow Engine** | 9-step ICP → keyword → cluster → article pipeline with human approval gates |
| **Article Generation** | Parallel LLM orchestration (OpenRouter) with research, outline, and section-by-section writing |
| **SEO Suite** | Keyword research (DataForSEO), scoring, validation, recommendations, SERP analysis |
| **CMS Publishing** | Multi-adapter publishing to WordPress, Ghost, Notion, Shopify, Webflow, custom |
| **LLM Visibility Tracker** | Monitor brand presence across AI model responses |
| **Backlink Exchange** | Internal marketplace for backlink partner matching |
| **Analytics** | Content performance metrics, weekly reports, trend analysis, CSV/PDF export |
| **Team Management** | Org-scoped RBAC, invitations, role updates, audit log access |
| **Public v1 API** | Key-authenticated REST API for articles, keywords, social publishing |

## Technology Stack (Verified from package.json, 2026-04-22)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.1 |
| UI | React | 19.2.3 |
| Styling | Tailwind CSS | 4.x |
| Component Primitives | Radix UI | multiple |
| Database/Auth/Realtime | Supabase | 2.89.0 |
| Background Jobs | Inngest | 3.48.1 |
| AI SDK | Vercel AI SDK | 6.0.0 |
| LLM Router | OpenRouter | 2.1.1 |
| Research | Tavily, DataForSEO | — |
| Payments | Stripe | 20.1.0 |
| Email | Brevo | 3.0.1 |
| Charts | Recharts | 3.7.0 |
| Validation | Zod | 3.23.8 |
| Monitoring | Sentry | 10.34.0 |
| Testing | Vitest / Playwright / Storybook | 4.0.16 / 1.57.0 / 10.1.11 |

## Codebase Scale (Deep Scan, 2026-04-22)

| Metric | Value |
|--------|-------|
| Total files | 7,581+ |
| Component files (.tsx) | 190 |
| Component directories | 33 |
| API route files | 115+ |
| Lib service files | 130+ |
| Inngest functions | 16 |
| DB tables (verified) | 15+ |
| Migrations applied | 75 |
| CI/CD workflows | 6 |
| App page directories | 80+ |

## Platform Features by Route

**Dashboard** (`/dashboard`): Article list, generate, edit, research, publish, track, LLM visibility, backlink exchange, workflows, settings/billing/integrations  
**Onboarding** (`/onboarding`): 7-step wizard — business → competitors → blog → keyword-settings → content-defaults → integration → completion  
**Workflows** (`/workflows`): 9-step intent pipeline — ICP → competitors → seed keywords → longtail expansion → filtering → clustering → validation → subtopics → queue  
**Marketing** (`/`): Landing page, pricing, features, solutions, resources, about  
**Settings** (`/settings`): Org management, team, webhooks, integrations, keyword-settings, audit logs  

## Production Architecture Constraints

- `typescript.ignoreBuildErrors: true` in `next.config.ts` (Vercel build time constraint — TODO: remove)
- Turbopack enabled via `next.config.ts` with explicit root path for CI compatibility
- Service Role key is the only mechanism to bypass RLS; all other access is org-scoped
- Inngest webhook endpoint at `/api/inngest` is the single entry point for all background job dispatch

---
*See [Architecture](./architecture.md) · [Data Models](./data-models.md) · [API Contracts](./api-contracts.md) · [Workflow Guide](./workflow-guide.md)*
