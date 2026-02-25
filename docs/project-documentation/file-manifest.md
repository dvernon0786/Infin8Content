# Project File Manifest - Infin8Content

*Last Updated: 2026-02-26*
*Scope: Monorepo Technical Reference*

## 🏗️ Core Orchestration (infin8content/lib/fsm)

| File | Purpose |
|------|---------|
| `unified-workflow-engine.ts` | Central nexus for state transitions. Curates the the `AUTOMATION_GRAPH`. |
| `fsm.internal.ts` | Low-level state persistence and transition logic using direct DB queries. |
| `workflow-events.ts` | Type definitions for all 25+ FSM states and 30+ legal events. |
| `workflow-machine.ts` | The logical state transition matrix (defines what event is legal in what state). |
| `automation-boundary-guard.ts` | Protection logic to ensure automated steps don't overlap with human gates. |

## ⚙️ Business Logic & Services (infin8content/lib/services)

### Intent Engine (Workflows 1-8)
| File | Purpose |
|------|---------|
| `icp-generator.ts` | Generates Ideal Customer Profiles using AI (OpenRouter). |
| `competitor-seed-extractor.ts` | Uses DataForSEO to extract seed keywords from competitor URLs. |
| `longtail-keyword-expander.ts` | Expands seeds into long-tail keywords using a 4-source heuristic. |
| `keyword-clusterer.ts` | Semantic clustering of keywords into Hub-and-Spoke structures. |
| `cluster-validator.ts` | Validation logic to ensure cluster coherence before subtopic generation. |

### Article Generation (Workflow 9)
| File | Purpose |
|------|---------|
| `article-assembler.ts` | Final assembly of section-by-section generated content into a finished article JSONB map. |
| `article-queuing-processor.ts` | Planning step for converting approved keywords into article structures. |
| `content-writing-agent.ts` | The core "writer" service that generates prose based on research and context. |
| `research-agent.ts` | Integration with Tavily/Perplexity for real-time web research per section. |
| `scheduler.ts` (Inngest) | Background worker for picking up scheduled articles governed by quotas. |

## 🚀 API Layer (infin8content/app/api)

| Route Category | Purpose |
|----------------|---------|
| `/api/intent/workflows` | Full lifecycle management of content workflows (Steps 1-9). |
| `/api/articles` | Endpoint for manual article generation and history. |
| `/api/onboarding` | Multi-step organization setup and preference persistence. |
| `/api/seo` | SEO scoring, recommendation engine, and validation tools. |
| `/api/webhooks` | Stripe and Inngest event listeners for asynchronous processing. |

## 🎨 UI Component Library (infin8content/components)

| Directory | Purpose |
|-----------|---------|
| `ui/` | Base primitives (Button, Input, Card) built with Radix and Tailwind 4. |
| `dashboard/` | Data-heavy views Including `efficiency-metrics-dashboard.tsx`. |
| `workflows/` | Form-driven components for each of the 9 FSM steps. |
| `analytics/` | UX metric visualizations and weekly report generators. |
| `marketing/` | High-converting landing page blocks (Hero, Features, Pricing). |

## 🛠️ Development & Tooling

| File/Dir | Purpose |
|----------|---------|
| `/tools/eslint-plugin-design-system` | Custom ESLint rules for design token compliance. |
| `package.json` (root) | Monorepo orchestration and global test targets. |
| `supabase/migrations/` | Versioned SQL scripts for schema evolution. |

*This manifest is generated as part of the 100% codebase analysis.*
