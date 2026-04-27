# Source Tree Analysis - Infin8Content

Deep Scan: 2026-04-22
Scope: **Exhaustive**

---

## Monorepo Root

```
Infin8Content/
├── infin8content/          # Main Next.js application
├── supabase/               # Database infrastructure
│   └── migrations/         # 75 PostgreSQL migrations
├── tools/                  # Developer tooling
│   └── eslint-plugin-design-system/  # Custom lint rules
├── _bmad/                  # BMAD workflow framework
│   ├── core/               # Engine tasks + templates
│   └── bmm/                # Workflow definitions + agents
├── docs/                   # Project documentation
└── *.sql                   # Ad-hoc SQL scripts (debugging/migration aids)
```

---

## `infin8content/` — Next.js Application

### `app/` — App Router (Pages + API)

```
app/
├── (auth)/                 # Auth layout group (login, register, forgot-password,
│                           #   verify-email, update-password, suspended)
├── auth/callback/          # OAuth redirect handler
├── about/ careers/ contact/ privacy/ security/ terms/  # Static marketing pages
├── features/               # Feature landing pages
│   ├── ai-article-generator/
│   ├── brand-voice-engine/
│   ├── research-assistant/
│   └── seo-optimization/
├── solutions/              # Solution landing pages (agencies, enterprise, seo-teams, content-marketing)
├── resources/              # Help/content hub (blog, tutorials, support, documentation, community)
├── pricing/                # Pricing page
├── admin/performance/      # Admin performance dashboard
├── analytics/              # Analytics page
├── backlink-exchange/      # Backlink marketplace
├── create-organization/    # Org creation wizard
├── accept-invitation/      # Team invitation acceptance
├── payment/                # Payment pages (upgrade, success)
├── onboarding/             # 7-step onboarding wizard
│   ├── business/           # Step 1
│   ├── competitors/        # Step 2
│   ├── blog/               # Step 3
│   ├── keyword-settings/   # Step 4
│   ├── content-defaults/   # Step 5
│   └── integration/        # Step 6
├── dashboard/              # Main authenticated app
│   ├── articles/           # Article list + [id]/edit
│   │   └── generate/       # Article generation form
│   ├── backlink-exchange/
│   ├── llm-visibility/     # LLM brand tracking
│   │   └── new/
│   ├── publish/            # Publishing queue
│   ├── research/keywords/  # Keyword research tool
│   ├── settings/           # Settings hub
│   │   ├── billing/
│   │   └── integrations/
│   ├── track/              # Content tracking
│   └── workflows/          # Intent workflows
│       └── new/
├── settings/               # Settings pages
│   ├── integrations/
│   ├── keyword-settings/
│   ├── organization/
│   │   └── audit-logs/
│   ├── team/
│   └── webhooks/
├── workflows/              # Intent workflow runner
│   ├── new/
│   └── [id]/
│       ├── completed/
│       ├── progress/
│       └── steps/1-9/      # 9 workflow steps
└── api/                    # 115+ API routes (see api-contracts.md)
    ├── admin/
    ├── ai/
    ├── analytics/
    ├── announcements/
    ├── articles/
    ├── auth/
    ├── cms-connections/
    ├── dashboard/
    ├── feature-flags/
    ├── feedback/
    ├── inngest/             # Inngest webhook endpoint
    ├── intent/workflows/    # 9-step intent pipeline
    ├── keywords/
    ├── llm-visibility/
    ├── onboarding/
    ├── organizations/
    ├── payment/
    ├── research/
    ├── seo/
    ├── tags/
    ├── team/
    ├── user/
    ├── v1/                  # Public API (key-authenticated)
    ├── webhook-endpoints/
    ├── webhooks/
    └── workflows/
```

---

### `components/` — UI Library (190 .tsx files, 33 directories)

```
components/
├── ui/                     # 27 base design system primitives
├── dashboard/              # 28 dashboard components + 5 sub-directories
│   ├── activity-feed/      # 3 components
│   ├── generation-progress/# 6 components
│   ├── performance-dashboard/ # 7 components
│   ├── workflow-dashboard/ # 4 components
│   └── debug-dashboard/    # 2 components
├── articles/               # 14 article management components
├── workflows/              # 13 intent workflow step components
│   └── steps/              # Steps 1-8 + cluster/keyword preview
├── onboarding/             # 11 onboarding wizard components
│   └── guided-tour/        # 2 guided tour components
├── marketing/              # 20+ marketing/landing page components
│   ├── layout/             # SectionHeader, SectionWrapper
│   ├── navigation/         # MegaMenu
│   ├── pages/              # FeaturePageTemplate, SolutionPageTemplate
│   ├── pricing/            # 9 pricing components
│   └── sections/           # CTASection, FAQSection, StepsSection
├── research/               # 2 keyword research components
├── seo/                    # 4 SEO display components
├── analytics/              # 8 analytics components
├── settings/               # 7 settings management components
├── mobile/                 # 8 mobile-optimized components
├── guards/                 # 2 route/feature guards
├── custom/                 # 4 custom status indicators
├── usage/                  # 2 quota/usage components
└── admin/performance/      # 2 admin monitoring components
```

---

### `lib/` — Service & Business Logic Layer (130+ files)

```
lib/
├── agents/                 # AI planning agents
│   ├── planner-agent.ts    # High-level generation coordinator
│   └── planner-compiler.ts # Prompt compilation
├── api-auth/               # v1 API key auth
│   ├── validate-api-key.ts
│   ├── with-api-auth.ts
│   └── v1-response.ts
├── config/                 # Configuration constants
│   ├── dataforseo-geo.ts   # Geographic targeting config
│   ├── plan-limits.ts      # Per-plan feature limits
│   ├── pricing-plans.ts    # Stripe price ID mapping
│   └── progress-config.ts  # Generation progress config
├── constants/              # Shared constants
│   ├── approval-thresholds.ts
│   ├── intent-workflow-steps.ts  # 9-step definitions
│   └── status-configs.ts   # FSM state display config
├── fsm/                    # Zero Drift Protocol state machine
│   ├── unified-workflow-engine.ts  # Canonical FSM
│   ├── workflow-fsm.ts     # Core transition definitions
│   ├── workflow-machine.ts # Machine configuration
│   ├── workflow-events.ts  # Event type definitions
│   ├── automation-boundary-guard.ts  # Anti-drift enforcement
│   └── boundary-transition-wrapper.ts  # Transition + audit wrapper
├── guards/                 # Access control
│   ├── onboarding-gate.ts  # Blocks dashboard until onboarding done
│   ├── onboarding-guard.ts # Middleware-level guard
│   └── workflow-step-gate.ts  # Sequential step enforcement
├── inngest/                # Background job definitions
│   ├── client.ts           # Inngest event bus client
│   └── functions/          # 16 worker functions (see workflow-guide.md)
├── intent-workflow/        # Intent engine config
│   └── step-config.ts      # Step definitions and validation
├── llm/prompts/            # LLM prompt management
│   ├── content-writing.prompt.ts
│   └── assert-prompt-integrity.ts  # Prompt injection prevention
├── middleware/             # Server middleware
│   └── intent-engine-gate.ts
├── mobile/                 # Mobile optimization utilities
│   ├── network-optimizer.ts
│   ├── performance-monitor.ts
│   └── touch-optimizer.ts
├── research/               # Research pipeline
│   ├── research-service.ts # Main research orchestrator
│   ├── research-cache.ts   # 24h TTL caching
│   ├── keyword-research.ts # Keyword data fetching
│   ├── dataforseo-client.ts# DataForSEO API client
│   ├── tavily-client.ts    # Tavily research client
│   ├── api-cost-tracker.ts # Research API cost tracking
│   └── batch/              # Batch research optimization
│       ├── batch-research-optimizer.ts
│       ├── cache-manager.ts
│       ├── query-builder.ts
│       └── source-ranker.ts
├── security/
│   └── encryption.ts       # AES-256 for CMS credentials
├── seo/                    # SEO analysis suite
│   ├── seo-scoring.ts
│   ├── recommendation-system.ts
│   ├── reporting.ts
│   ├── validation-engine.ts
│   ├── performance-tester.ts
│   ├── google-search-console.ts
│   └── workflow-integration.ts
├── services/               # External integrations + business services
│   ├── article-generation/ # Generation pipeline (8 agents)
│   │   ├── content-planner-agent.ts
│   │   ├── content-writing-agent.ts
│   │   ├── research-agent.ts
│   │   ├── article-assembler.ts
│   │   ├── seo-scoring-service.ts
│   │   ├── internal-linking-service.ts
│   │   ├── geo-aeo-enrichment.ts
│   │   ├── comparison-table-generator.ts
│   │   ├── schema-generator.ts
│   │   └── image-generation/
│   ├── intent-engine/      # 20+ keyword workflow services
│   │   ├── icp-generator.ts
│   │   ├── competitor-seed-extractor.ts
│   │   ├── seed-approval-processor.ts
│   │   ├── longtail-keyword-expander.ts
│   │   ├── keyword-filter.ts
│   │   ├── keyword-clusterer.ts
│   │   ├── cluster-validator.ts
│   │   ├── human-approval-processor.ts
│   │   ├── article-queuing-processor.ts
│   │   ├── workflow-dashboard-service.ts
│   │   ├── blocking-condition-resolver.ts
│   │   ├── intent-audit-logger.ts
│   │   └── (+ 8 more gate validators + trackers)
│   ├── publishing/         # CMS adapter layer (7 platforms)
│   │   ├── cms-engine.ts   # Adapter factory
│   │   ├── cms-adapter.ts  # Base adapter interface
│   │   ├── wordpress-adapter.ts
│   │   ├── ghost-adapter.ts
│   │   ├── notion-adapter.ts
│   │   ├── shopify-adapter.ts
│   │   ├── webflow-adapter.ts
│   │   └── custom-adapter.ts
│   ├── dataforseo/         # DataForSEO SERP analysis
│   ├── openrouter/         # OpenRouter LLM client
│   ├── tavily/             # Tavily research client
│   ├── llm-visibility/     # LLM brand tracking engine
│   ├── icp/                # ICP generation service
│   ├── keyword-engine/     # Subtopic generation + approval
│   ├── analytics/          # Analytics event emission
│   ├── webhooks/           # Outbound webhook dispatcher
│   ├── workflow-engine/    # Workflow audit + progression
│   ├── rate-limiting/      # Persistent rate limiter
│   ├── brevo.ts            # Email sending (Brevo)
│   ├── bulk-operations.ts  # Multi-article lifecycle management
│   ├── audit-logger.ts     # Activity audit logging
│   └── otp.ts              # OTP generation/verification
├── stripe/                 # Payment layer
│   ├── client.ts / server.ts
│   ├── prices.ts           # Price ID constants
│   └── retry.ts            # Payment retry logic
├── supabase/               # Database client layer
│   ├── client.ts           # Browser client (anon key)
│   ├── server.ts           # Server client (service role)
│   ├── middleware.ts        # Session refresh middleware
│   ├── database.types.ts   # Generated TypeScript types (source of truth)
│   ├── activity-realtime.ts# Realtime subscription helpers
│   └── publish-references.ts
├── types/                  # Shared TypeScript types
│   ├── article.ts
│   ├── dashboard.types.ts
│   ├── intent-workflow.ts
│   └── feature-flag.ts
├── utils/                  # Shared utilities
│   ├── logger.ts           # Winston logger wrapper
│   ├── rate-limit.ts       # Edge rate limiting
│   ├── sanitize-text.ts    # Input sanitization
│   ├── validate-redirect.ts# Open redirect prevention
│   ├── encryption.ts       # Encryption helpers
│   └── feature-flags.ts    # Feature flag evaluation
└── validation/             # Zod validation schemas
    ├── onboarding-schema.ts
    └── onboarding-profile-schema.ts
```

---

### Key Config Files

```
infin8content/
├── middleware.ts           # Next.js middleware (auth, onboarding gate, payment gate)
├── next.config.ts          # Turbopack + ignoreBuildErrors (TODO: remove)
├── tailwind.config.ts      # Tailwind 4 config
├── tsconfig.json           # TypeScript config
├── vitest.config.ts        # Vitest unit test config
└── playwright.config.ts    # Playwright E2E config
```

---

### `supabase/migrations/` — Database Evolution (75 files)

Key milestones:

| Migration | Description |
|-----------|-------------|
| Initial | `articles`, `organizations`, `activities`, `publish_references` tables |
| `20260215_*` | `ai_usage_ledger` — AI cost tracking |
| `20260218_intent_workflows_schema.sql` | Intent workflow engine tables (6 tables) |
| `20260218_fix_all_worker_tables_rls.sql` | RLS hardening pass |
| `20260218_enable_rls_security_fixes.sql` | Security audit fixes |
| `20260217225126_add_keywords_unique_constraints.sql` | Keyword deduplication |
| `20260223_fix_article_status_ready_constraint.sql` | FSM constraint fix (latest) |

---

### `tools/eslint-plugin-design-system/`

Custom ESLint plugin:
- Bans hardcoded colors/spacing (must use design tokens)
- Enforces component import paths
- Requires Storybook stories for new components

Used in `design-system.yml` CI workflow.

---

### `.github/workflows/` — CI/CD (6 workflows)

| File | Purpose |
|------|---------|
| `ci.yml` | Lint, type-check, unit tests on every PR |
| `design-system.yml` | Design system compliance check |
| `performance.yml` | Lighthouse / performance benchmarks |
| `sm-validation.yml` | FSM state machine transition validation |
| `ts-001.yml` | TypeScript strict checks |
| `visual-regression.yml` | Storybook visual regression (Chromatic) |

---

*Total: 7,581+ files · Components: 190 · API routes: 115+ · Migrations: 75 · Inngest workers: 16*
