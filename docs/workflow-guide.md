# Workflow Guide

Deep Scan: 2026-04-22
Sources: `lib/fsm/`, `lib/inngest/functions/`, `lib/services/intent-engine/`, `lib/services/article-generation/`

---

## 1. Article FSM — Zero Drift Protocol

### States

| State | Description | Who Sets It |
|-------|-------------|-------------|
| `backlog` | Created, not yet queued | Trigger API or intent pipeline |
| `queued` | Queued for generation | Trigger API (`/api/articles/generate`) |
| `researching` | Research agent active | Inngest worker |
| `outlining` | Planner agent generating outline | Inngest worker |
| `generating` | Section-by-section LLM writing | Inngest worker |
| `reviewing` | Awaiting human review | Inngest worker |
| `completed` | Generation done | Inngest worker |
| `published` | Sent to CMS | Publish Trigger API |
| `failed` | Terminal failure | Inngest worker (after retries) |
| `archived` | Manually archived | Bulk operations API |

### Valid Transitions

```
backlog     → queued
queued      → researching
researching → outlining
outlining   → generating
generating  → reviewing
reviewing   → completed
completed   → published
any         → failed       (on unrecoverable error)
any         → archived     (manual action only)
```

**Reverse transitions are forbidden.** The FSM rejects any attempt to move backwards.

### Zero Drift Enforcement

Three files jointly enforce the constraint that **only the Trigger API and Inngest workers may mutate article `status`**:

| File | Role |
|------|------|
| `lib/fsm/unified-workflow-engine.ts` | Canonical FSM definition; all transitions validated here |
| `lib/fsm/automation-boundary-guard.ts` | Throws on any state mutation attempted outside authorized callers |
| `lib/fsm/boundary-transition-wrapper.ts` | Wraps every transition with audit logging and guard check |

Dashboard and UI components are **read-only** with respect to article state. They subscribe to Supabase Realtime for live updates.

---

## 2. Article Generation Pipeline

### Entry Point

`POST /api/articles/generate` — the only authorized trigger for starting generation. Validates auth, checks quota, creates the article record in `backlog`, then emits `article.generate` event to Inngest.

### Agent Pipeline

```
planner-agent.ts
    ↓ (compiles outline prompt)
article-generate-planner.ts  [Inngest: article.plan]
    ↓
    ├── research-agent.ts           (Tavily + DataForSEO research)
    ├── content-planner-agent.ts    (section-by-section plan)
    └── content-writing-agent.ts    (LLM writing per section)
            ↓
        article-assembler.ts        (joins sections, resolves internal links)
            ↓
        seo-scoring-service.ts      (calculates SEO score)
            ↓
        generate-article-meta.ts    [Inngest: article.meta]
            (generates title, slug, meta description)
```

### Supporting Services (article-generation/)

| File | Purpose |
|------|---------|
| `internal-linking-service.ts` | Discovers + injects internal links from org content |
| `geo-aeo-enrichment.ts` | Adds geographic + AEO (Answer Engine Optimization) signals |
| `comparison-table-generator.ts` | Generates product/feature comparison tables |
| `schema-generator.ts` | JSON-LD schema markup generation |
| `image-generation/` | AI image prompt generation for article images |

---

## 3. Inngest Background Workers (16 functions)

All registered at `/api/inngest`. Durable execution with automatic retries.

| Function File | Event Trigger | Purpose |
|--------------|--------------|---------|
| `generate-article.ts` | `article.generate` | Main generation orchestrator |
| `article-generate-planner.ts` | `article.plan` | Outline + section planning |
| `generate-article-meta.ts` | `article.meta` | Title/slug/meta generation |
| `article-cms-draft-notifier.ts` | `article.completed` | Notifies CMS of new draft |
| `intent-pipeline.ts` | `intent.step` | Executes intent workflow step |
| `cleanup-stuck-articles.ts` | Cron (hourly) | Resets articles stuck in `generating` |
| `crawl-website-links.ts` | `org.crawl` | Crawls org site for internal link graph |
| `expire-api-keys.ts` | Cron (daily) | Expires API keys past TTL |
| `llm-visibility-tracker.ts` | `llm.track` | Runs brand visibility tracking pass |
| `news-poller.ts` | Cron (hourly) | Polls news APIs for trending topics |
| `onboarding-email-sequence.ts` | `org.onboarded` | Triggers multi-step email nurture (Brevo) |
| `publish-reminder-scheduler.ts` | Cron (daily) | Sends upcoming publish reminders |
| `publish-to-social.ts` | `article.social` | Publishes article to social platforms |
| `retry-webhook-delivery.ts` | `webhook.retry` | Retries failed outbound webhooks |
| `scheduler.ts` | `article.schedule` | Executes scheduled article publishing |
| `ux-metrics-rollup.ts` | Cron (daily) | Aggregates UX metrics into summaries |

---

## 4. Intent Workflow Engine — 9-Step Pipeline

The Intent Workflow Engine converts a business's ICP into a queue of ready-to-generate articles through a guided 9-step keyword research pipeline with two human approval gates.

### Pipeline Overview

```
Step 1: ICP Definition          → Defines target customer profile
Step 2: Competitor Analysis     → Extracts competitor keyword gaps
Step 3: Seed Keywords           → Generates seed keyword list
Step 4: Longtail Expansion      → Expands seeds to longtail variants
        [HUMAN APPROVAL GATE 1] → User reviews + approves longtail keywords
Step 5: Keyword Filtering       → Filters by volume, difficulty, intent
Step 6: Topic Clustering        → Groups keywords into topic clusters
Step 7: Cluster Validation      → Validates clusters for quality + coverage
Step 8: Subtopic Mapping        → Maps subtopics to article outlines
Step 9: Article Queue           → Queues approved topics as backlog articles
        [HUMAN APPROVAL GATE 2] → User reviews final queue before generation
```

### API Routes per Step

| Step | API Route | Service File |
|------|-----------|-------------|
| 1 — ICP | `POST /api/intent/workflows/[id]/step/1` | `icp-generator.ts` |
| 2 — Competitors | `POST /api/intent/workflows/[id]/step/2` | `competitor-seed-extractor.ts` |
| 3 — Seeds | `POST /api/intent/workflows/[id]/step/3` | `seed-approval-processor.ts` |
| 4 — Longtails | `POST /api/intent/workflows/[id]/step/4` | `longtail-keyword-expander.ts` |
| Approval 1 | `POST /api/intent/workflows/[id]/approve` | `human-approval-processor.ts` |
| 5 — Filter | `POST /api/intent/workflows/[id]/step/5` | `keyword-filter.ts` |
| 6 — Cluster | `POST /api/intent/workflows/[id]/step/6` | `keyword-clusterer.ts` |
| 7 — Validate | `POST /api/intent/workflows/[id]/step/7` | `cluster-validator.ts` |
| 8 — Subtopics | `POST /api/intent/workflows/[id]/step/8` | `article-queuing-processor.ts` |
| 9 — Queue | `POST /api/intent/workflows/[id]/queue` | `article-queuing-processor.ts` |
| Approval 2 | `POST /api/intent/workflows/[id]/approve-queue` | `human-approval-processor.ts` |

### Step Guard Enforcement

`lib/guards/workflow-step-gate.ts` enforces sequential progression — steps cannot be skipped or accessed out of order. Gate reads current `step` from `intent_workflows` table.

### Workflow State Machine

Workflows have their own state:
```
pending → step_1_complete → step_2_complete → ... → step_8_complete → queued → completed
```

Any step can transition to `failed` on unrecoverable error.

---

## 5. CMS Publishing Pipeline

### Trigger

`POST /api/articles/[id]/publish` — authorized caller only. Validates article is in `completed` state before publishing.

### Adapter Pattern

`lib/services/publishing/cms-engine.ts` acts as the factory, instantiating the correct adapter based on the org's `cms_connection.platform` value.

| Platform | Adapter File |
|----------|-------------|
| WordPress | `wordpress-adapter.ts` |
| Ghost | `ghost-adapter.ts` |
| Notion | `notion-adapter.ts` |
| Shopify | `shopify-adapter.ts` |
| Webflow | `webflow-adapter.ts` |
| Custom / Generic | `custom-adapter.ts` |
| Base Interface | `cms-adapter.ts` |

CMS credentials are encrypted at rest using AES-256 (`lib/security/encryption.ts`). Decryption occurs at publish time, server-side only.

After publish: article state transitions to `published` and a `publish_references` record is created with the external CMS URL/ID.

---

## 6. Onboarding Pipeline (7 Steps)

Enforced by `lib/guards/onboarding-gate.ts` — dashboard is blocked until onboarding is complete.

| Step | Route | Purpose |
|------|-------|---------|
| 1 | `/onboarding/business` | Business profile, industry, goals |
| 2 | `/onboarding/competitors` | Competitor URLs |
| 3 | `/onboarding/blog` | Blog URL, CMS platform |
| 4 | `/onboarding/keyword-settings` | Keyword preferences, geo targeting |
| 5 | `/onboarding/content-defaults` | Tone, length, content type defaults |
| 6 | `/onboarding/integration` | CMS connection setup |
| 7 | (auto) | Completion — org marked `onboarding_complete` |

State persisted in `organizations.onboarding_step` column. Each step's API route (`/api/onboarding/step/[1-7]`) validates and advances the step counter.

---

## 7. Key Design Rules

1. **Zero Drift**: Only `/api/articles/generate` and Inngest workers write `articles.status`. All other code is read-only.
2. **Sequential Intent Steps**: Workflow steps must be completed in order. Skipping is blocked by `workflow-step-gate.ts`.
3. **Human Gates**: Steps 4 and 9 require explicit human approval before the pipeline continues.
4. **Org Isolation**: All workflow data is scoped to `organization_id`. RLS enforces this at DB level.
5. **Audit Trail**: Every FSM transition is logged via `boundary-transition-wrapper.ts` → `workflow_transition_audit` table.
6. **Durable Execution**: All long-running work runs in Inngest, not in API route handlers. API routes are request/response only.
