# Data Models - Schema Deep Scan

Deep Scan: 2026-04-22
Database: **Supabase / PostgreSQL**
Source: `lib/supabase/database.types.ts` + `supabase/migrations/` (75 files)

---

## Core Tables

### `articles`
Primary content entity. Governs the entire article lifecycle via FSM.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID PK` | Auto-generated |
| `org_id` | `UUID FK→organizations` | RLS root — all queries filter by this |
| `title` | `TEXT \| null` | Set after outline generation |
| `keyword` | `TEXT` | Primary SEO target keyword |
| `status` | `TEXT` | FSM state (see states below) |
| `target_word_count` | `INT` | Default from org content settings |
| `writing_style` | `TEXT \| null` | e.g. "professional", "casual" |
| `target_audience` | `TEXT \| null` | Audience descriptor |
| `custom_instructions` | `TEXT \| null` | User overrides for generation |
| `inngest_event_id` | `TEXT \| null` | Links to Inngest job session |
| `created_by` | `UUID \| null` | Auth user ID |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | Timestamps |
| `outline` | `JSONB \| null` | Generated article outline structure |
| `sections` | `JSONB \| null` | All generated section content |
| `current_section_index` | `INT \| null` | Progress tracker for generation |
| `generation_started_at` / `generation_completed_at` | `TIMESTAMPTZ \| null` | Timing |
| `outline_generation_duration_ms` | `INT \| null` | Performance metric |
| `error_details` | `JSONB \| null` | Failure context on `failed` status |
| `workflow_state` | `JSONB \| null` | FSM extended state payload |
| `slug` | `TEXT \| null` | URL slug for CMS publishing |

**Article FSM States** (verified from `lib/constants/status-configs.ts`):
`backlog` → `queued` → `researching` → `outlining` → `generating` → `reviewing` → `completed` → `published` / `failed` / `archived`

---

### `organizations`
Multi-tenant root. Every data entity is scoped to an org.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID PK` | |
| `name` | `TEXT` | Org display name |
| `plan` | `TEXT` | Subscription plan slug |
| `plan_type` | `TEXT \| null` | e.g. "trial", "paid", "free" |
| `stripe_customer_id` | `TEXT \| null` | Stripe customer reference |
| `stripe_subscription_id` | `TEXT \| null` | Active subscription |
| `payment_status` | `TEXT \| null` | "active", "past_due", "suspended" |
| `payment_confirmed_at` | `TIMESTAMPTZ \| null` | Last successful payment |
| `grace_period_started_at` | `TIMESTAMPTZ \| null` | Payment failure grace tracking |
| `suspended_at` | `TIMESTAMPTZ \| null` | Suspension timestamp |
| `article_usage` | `INT \| null` | Current cycle usage count |
| `trial_ends_at` | `TIMESTAMPTZ \| null` | Trial expiry |
| `usage_reset_at` | `TIMESTAMPTZ \| null` | Next billing cycle reset |
| `onboarding_completed` | `BOOL` | Onboarding wizard complete flag |
| `onboarding_checklist_state` | `JSONB` | Per-step completion state |
| `onboarding_tour_shown` | `BOOL` | Guided tour displayed flag |
| `website_url` | `TEXT \| null` | Organization website |
| `blog_config` | `JSONB \| null` | Blog URL, category, posting prefs |
| `has_used_trial` | `BOOL \| null` | Prevents trial re-use |
| `white_label_settings` | `JSONB \| null` | White-labeling overrides |

---

### `activities`
Audit and activity feed. Every user action and system event is appended here.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID PK` | |
| `organization_id` | `UUID FK→organizations` | RLS scope |
| `user_id` | `UUID FK→auth.users` | Actor |
| `article_id` | `UUID \| null` | Related article if applicable |
| `activity_type` | `TEXT` | e.g. "article_generated", "payment_failed" |
| `activity_data` | `JSONB \| null` | Structured context payload |
| `created_at` | `TIMESTAMPTZ` | |

---

### `publish_references`
Tracks CMS publishing history per article.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID PK` | |
| `article_id` | `UUID FK→articles` | |
| `platform` | `TEXT` | "wordpress", "ghost", "notion", etc. |
| `platform_post_id` | `TEXT` | ID assigned by the CMS |
| `platform_url` | `TEXT` | Published URL |
| `published_at` | `TIMESTAMPTZ` | |
| `created_at` | `TIMESTAMPTZ` | |

---

### `intent_workflows`
Represents one complete 9-step keyword strategy workflow.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID PK` | |
| `organization_id` | `UUID FK→organizations` | |
| `name` | `TEXT` | User-supplied workflow name |
| `status` | `TEXT` | Workflow progression state |

Extended columns (from migrations) include per-step state, ICP data, competitor data, seed keywords, longtail keywords, cluster results, and approval states stored as JSONB.

---

### `organization_competitors`
Competitors tracked per org (populated by onboarding + intent workflow).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID PK` | |
| `organization_id` | `UUID FK→organizations` | |
| `name` | `TEXT` | Competitor display name |
| `url` | `TEXT \| null` | Website URL |
| `domain` | `TEXT \| null` | Normalized domain for SERP analysis |
| `is_active` | `BOOL` | Active tracking flag |
| `description` | `TEXT \| null` | Notes |
| `created_by` | `UUID \| null` | |
| `created_at` | `TIMESTAMPTZ` | |

---

## Migration-Only Tables

Defined in `supabase/migrations/` but not yet in `database.types.ts`:

| Table | Purpose |
|-------|---------|
| `ai_usage_ledger` | Per-org AI API cost tracking (USD) — from `20260215_create_ai_usage_ledger.sql` |
| `article_sections` | Sharded section-level storage for parallel generation — from `20260218_intent_workflows_schema.sql` |
| `cluster_validation_results` | Output of Step 7 (cluster validation) in intent workflow |
| `intent_approvals` | Human approval gate records (seed approval + final approval) |
| `keywords` | Discovered keywords with volume, difficulty, intent data |
| `rate_limits` | Persistent rate limiter state (`lib/services/rate-limiting/persistent-rate-limiter.ts`) |
| `topic_clusters` | Grouped keyword clusters from Step 6 |
| `workflow_transition_audit` | FSM transition log — timestamp, from/to state, actor |
| `workflow_transitions` | Canonical transition definitions used by the FSM |

---

## Security Layer (RLS)

All tables have RLS enabled. Access pattern:

```
Authenticated user → JWT → Supabase RLS → org_id filter → data
Service role key → bypasses RLS → admin operations only
```

- **Anon key**: Public-facing read only (used client-side)
- **Service role key**: Server-side only (API routes, Inngest workers). Never exposed to browser.
- **API v1 keys**: Table `rate_limits` + `lib/api-auth/validate-api-key.ts` for external API auth

---

## Key Relationships

```
organizations
    ├── articles (org_id)
    │     └── publish_references (article_id)
    │     └── article_sections (article_id)
    ├── activities (organization_id)
    ├── intent_workflows (organization_id)
    │     ├── keywords
    │     ├── topic_clusters
    │     ├── cluster_validation_results
    │     └── intent_approvals
    ├── organization_competitors (organization_id)
    ├── ai_usage_ledger (org_id)
    └── rate_limits (org_id)
```

---

## Performance Indexes

From migrations:
- `articles`: composite on `(org_id, status)` and `(org_id, created_at)`
- `keywords`: unique constraint added via `20260217225126_add_keywords_unique_constraints.sql`
- `ai_usage_ledger`: indexed on `org_id + created_at` for billing queries

---

*Migration source: `supabase/migrations/` — latest: `20260223_fix_article_status_ready_constraint.sql`*  
*Types source: `infin8content/lib/supabase/database.types.ts`*
