# BMAD Brownfield Primary Content Workflow — Final Scratchpad

**Date:** 2026-04-20  
**Status:** ✅ PHASE 1 & 2 COMPLETE | ✅ PHASE 3 WEEK 1 COMPLETE | ✅ MULTI-CMS ENGINE IMPLEMENTED | ✅ OUTSTAND SOCIAL PUBLISHING IMPLEMENTED | ✅ ARVOW-STYLE DASHBOARD UI REMAP IMPLEMENTED

---

## Completion Summary

### Phase 1: Blueprint (✅ COMPLETE)
- 6 core PM deliverables
- 2 supporting documents
- All BMAD-clean (13/13 checklist passed)
- Ready for engineering

### Phase 2: MAP (✅ COMPLETE)
- 6 PM execution documents
- 6-week timeline with clear phases
- Critical path: 17 days
- Risk register: 8 major risks
- Rollback: < 5 minutes

### Phase 3: ADOPT Week 1 (✅ COMPLETE)
- 2 engineering documents
- 5 PRs with detailed implementation
- Week 1 scope: Foundation only
- Acceptance checklist defined

### Multi-CMS Publishing Engine (✅ COMPLETE — 2026-03-17)
- 3 DB migrations applied and verified (32/32 checks PASS)
- 9 adapter layer files (interface, factory, 6 platform adapters)
- 3 API route files (CRUD, test, publish)
- 5 UI components (Settings page, manager, form, publish button, onboarding step)
- AuditAction extended with INTEGRATION_CONNECTED / INTEGRATION_DISCONNECTED
- All TypeScript errors resolved (0 tsc errors)

### Outstand Social Publishing Integration (✅ COMPLETE — 2026-04-18)
- **Backend (8 files)**
  - `supabase/migrations/20260418000000_add_social_publishing.sql` — `org_social_accounts` + `article_social_analytics` tables, `publish_references` columns, RLS policies, trigger
  - `lib/services/outstand/client.ts` — typed Outstand REST API wrapper (`listSocialAccounts`, `createPost`, `getPostAnalytics`, HMAC webhook verification)
  - `lib/services/outstand/caption-generator.ts` — AI caption generation via OpenRouter (gpt-4o-mini)
  - `lib/inngest/functions/publish-to-social.ts` — durable Inngest workers: `autoPublishToSocial` (event: `article/generation.completed`) + `manualPublishToSocial` (event: `article/publish.requested`)
  - `app/api/v1/articles/[id]/publish-social/route.ts` — manual publish trigger (POST, 202 Accepted)
  - `app/api/v1/articles/[id]/caption/route.ts` — AI caption preview (GET)
  - `app/api/v1/articles/[id]/social-analytics/route.ts` — analytics fetch (GET)
  - `app/api/v1/social/accounts/route.ts` — org social accounts list (GET)
  - `app/api/webhooks/outstand/route.ts` — webhook receiver (`post.published` / `post.error`), HMAC verified
- **Frontend (3 components)**
  - `components/articles/SocialPublishModal.tsx` — Dialog with caption editor, char counter, regenerate, account chips, publish CTA, success/error states
  - `components/articles/PublishToSocialButton.tsx` — self-contained trigger; shows "Published" badge post-publish
  - `components/articles/SocialAnalytics.tsx` — inline analytics card: aggregated metrics grid + per-account breakdown
- **Patched files**
  - `app/api/inngest/route.ts` — registered `autoPublishToSocial` + `manualPublishToSocial`
  - `lib/inngest/functions/generate-article.ts` — emits `article/generation.completed` in `complete-article` step
  - `app/dashboard/articles/[id]/page.tsx` — added `cms_status`/`slug` to select; injected `<PublishToSocialButton>` + `<SocialAnalytics>` after `<PublishHistory>`
- **TypeScript:** `tsc --noEmit` exits 0 (zero errors)
- **Pending (manual):** Apply DB migration, set `OUTSTAND_API_KEY` + `OUTSTAND_WEBHOOK_SECRET`, register webhook URL in Outstand dashboard, seed `org_social_accounts` via `scripts/generate-social-seed.mjs`

### Navigation (✅ COMPLETE)
- BMAD-INDEX.md - Complete navigation
- BMAD-COMPLETION-SUMMARY.md - Full summary

### Arvow-Style Dashboard UI Remap (✅ COMPLETE — 2026-04-20)
- **Design tokens** — `globals.css`: `--brand-electric-blue: #0066FF`, added `--page-bg`, `--card-border`, `--text-muted`, `--primary-tint`
- **Topbar** — `top-navigation.tsx`: 38px `#0066FF` bar, 3-zone layout (90px spacer | orange-dot promo + Watch Now | plan pill + Upgrade + avatar)
- **Sidebar** — `sidebar-navigation.tsx`: 202px via `--sidebar-width` CSS var, brand square, 8 nav items (4 active, 4 disabled), Backlink Exchange NEW badge, bottom promos
- **Layout** — `app/dashboard/layout.tsx`: `padding: 26px 30px 30px`, `background: #f7f8fa`
- **Overview page** — `app/dashboard/page.tsx`: 2×2 grid with `ActiveServicesCard` + `GenerateArticlesCard` (row 1), stat cards + `ContentActivityChart` (row 2), collapsible onboarding bar, `WorkflowDashboard` full-width below
- **ActiveServicesCard** — new component: 4 service rows with real `in_progress_workflows` count
- **GenerateArticlesCard** — new component: 3 CTAs (SEO / News / YouTube) with SVG thumbs
- **ContentActivityChart** — new component: Recharts `<LineChart>`, 30-day window, generated + published lines
- **WorkflowDashboard** — `T.blue` patched from `#217CEB` → `#0066FF`
- **Turbopack fix** — `next.config.ts`: `turbopack.root` set to absolute `infin8content/` path; resolved parent-dir lockfile detection issue
- **TypeScript:** 0 errors across all 7 modified / 3 new files

---

## Total Deliverables

**Documents:** 15 comprehensive documents + 1 verify SQL  
**Size:** ~200K documentation  
**Commits:** 5 commits to feature/bmad-pm-deliverables + 1 multi-CMS commit + 1 dashboard UI remap commit  
**Files:** 27 docs + 21 new code files (+ 17 new files for Outstand social publishing, 2026-04-18) + 10 files (7 modified + 3 new for dashboard UI remap, 2026-04-20)  

---

## Key Achievements

✅ 9-step workflow LOCKED  
✅ 5 hard gates enforced  
✅ 9 feature flags designed  
✅ BMAD-clean design (13/13)  
✅ Complete execution plan  
✅ Zero ambiguity  
✅ Ready for engineering  

---

## Architecture Locked

- ICP mandatory and first
- Keywords URL-driven
- All 4 DataForSEO methods required
- Subtopics are articles (immutable)
- Human approval before generation
- Agents run after approval
- Legacy system preserved
- No rewrites or deletions

---

## 6-Week Timeline

```
Week 1: Foundation (LOW RISK)
Week 2: ICP + Competitors (MEDIUM)
Week 3-4: Keyword Engine (HIGH)
Week 5: Article Pipeline (HIGHEST)
Week 6: Rollout (MEDIUM)
```

---

## Critical Path: 17 Days

Cannot slip:
- Longtail expansion (3 days)
- Filtering (2 days)
- Subtopic generation (2 days)
- Article pipeline (3 days)

---

## Top 8 Risks

1. Bad keywords (SEO damage) - Medium
2. API limits (Workflow stalls) - High
3. Agent hallucinations (Trust loss) - Medium
4. Scope creep (Timeline delay) - High
5. Data corruption (System failure) - Low
6. User confusion (Adoption drop) - Medium
7. Feature flag bugs (Partial outage) - Low
8. Inngest failure (No articles) - Medium

---

## Feature Flags (Enable in Sequence)

Week 1: `enable_legacy_workflow` (default: true)
Week 2: `enable_icp`, `enable_competitors`
Week 3: `enable_seeds`, `enable_longtails`, `enable_filtering`
Week 4: `enable_subtopics`, `enable_approval`
Week 5: `enable_primary_workflow`

---

## Hard Gates (PM MUST ENFORCE)

| Gate | Blocks |
|------|--------|
| No ICP | Any keyword generation |
| No competitors | Seed keywords |
| No seed approval | Longtails |
| No longtails | Subtopics |
| No subtopic approval | Articles |

---

## Rollback Procedure

Time: < 5 minutes (feature flags only)

Disable flags in reverse order, then enable `enable_legacy_workflow`.

---

## Status Vocabulary (Standardized)

```
generated    - System created
filtered     - System filtered
approved     - Human approved
rejected     - Human rejected
queued       - Waiting in queue
generating   - Currently processing
completed    - Successfully finished
failed       - Error during processing
archived     - Removed from workflow
```

---

## Git Status

**Branch:** feature/bmad-pm-deliverables  
**Commits:** 5 commits  
**Files:** 27 new files  
**Size:** ~200K  

**Next:** Merge to test-main-all for testing

---

## Files Location

All BMAD deliverables in:
`/home/dghost/Infin8Content/_bmad-output/`

---

### 2026-04-17 — Tailwind canonical class fixes applied

- Files modified: infin8content/app/dashboard/articles/articles-client.tsx, infin8content/components/dashboard/sidebar-navigation.tsx
- Changes applied: canonicalized Tailwind utility classes to use design tokens and canonical forms (e.g. `h-[2px]` → `h-0.5`, `max-w-[200px]` → `max-w-50`, `gap-[18px]` → `gap-4.5`, replaced raw hex colors with token names like `text-text-primary` and `bg-warning/10`).
- Git: these edits are committed on branch `test-main-all` (commit `a083416c`) and pushed to `origin`. PR #458 (test-main-all → main) is open for CI and review.

---

### Core Documents
- epic-primary-content-workflow-updated.md
- ux-flow-diagrams.md
- api-planning-updated.md
- status-matrix-updated.md
- bmad-corrections-and-confirmations.md
- pm-deliverables-summary-final.md

### Phase 2 Documents
- PHASE-2-MAP-EXECUTION-CHARTER.md
- PHASE-2-DEPENDENCY-MATRIX.md
- PHASE-2-RISK-REGISTER.md
- PHASE-2-PM-PLAYBOOK.md
- PHASE-2-MAP-COMPLETE.md
- PHASE-2-SUMMARY.md

### Phase 3 Documents
- PHASE-3-WEEK-1-ENGINEERING-KICKOFF.md
- PHASE-3-WEEK-1-SUMMARY.md

### Navigation
- BMAD-INDEX.md
- BMAD-COMPLETION-SUMMARY.md

### Supporting
- README-PM-DELIVERABLES.md
- BMAD-PM-SCRATCHPAD.md

---

## Next Steps

1. Merge to test-main-all
2. Create PR to main
3. Engineering begins Week 1

## 2026-03-17: Recent Engineering Updates

- **Internal linking implemented:** Added an idempotent internal-link injection step to the article generation pipeline. Files added: `lib/services/article-generation/internal-linking-service.ts`, `lib/inngest/functions/crawl-website-links.ts`.
- **Pipeline patched:** `lib/inngest/functions/generate-article.ts` now runs `inject-internal-links` immediately before `assemble-article` when `generationConfig.internal_links` is enabled.
- **Onboarding trigger:** `app/api/onboarding/business/route.ts` emits `organization/website.url.saved` to kick off crawls.
- **Inngest registration:** `app/api/inngest/route.ts` registered the crawl worker.
- **Branch & deploy steps:** Preparing changes on branch `test-main-all`; will commit, push, and open a PR to `main` for CI validation and integration testing.

Next actions: run integration smoke tests for the injection step and add unit tests for injection edge cases.

### Recent Engineering Updates (2026-03-18)

- `content-writing-agent.ts`: Replaced boolean interpolation for `add_cta` with a conditional natural-language CTA instruction. This enforces whether to include a single-sentence CTA or not based on `generationConfig.add_cta`.
- `convertMarkdownToHtml()`: Fixed link placeholder restoration to directly emit safe `<a>` tags and moved bold/italic processing before blockquote handling to correctly render inline emphasis inside blockquotes.
- `content-writing-agent.ts`: Restored list-handling logic after accidental corruption and removed stray prompt injection that appeared inside the markdown-to-HTML pipeline.
- `generate-article.ts`: Added defensive casts for schema/SEO step payloads to avoid a TypeScript object-shape error; `mark-completed` logic was hardened to re-check status and return idempotently when another worker completed the article.
- Article assembler: `slug` and `org_website_url` are now forwarded into final markdown builder so canonical article URLs and copy-link behavior are available.
- Inngest pipeline: `internal-linking` step inserted after geo/aero enrichment and before assembly (idempotent call).
- Validation: `tsc --noEmit` now passes after these edits. Vitest: unit tests for the article services folder were not present; full test-suite still reports environment-dependent failures (integration server not running). See CI run for details.

Next immediate steps:
- Push these edits to `test-main-all` and open a PR to `main` so CI can run the full integration suite.
- Add focused unit tests for `content-writing-agent` and the internal-linking step (optional fast follow-up).

---

## 2026-04-20 — LLM Brand Visibility Tracker (implementation notes)

- **Status:** Implementation complete in code; DB migration present but NOT APPLIED in Supabase (manual step required).
- **Files added/modified:**
  - infin8content/supabase/migrations/20260419000000_add_llm_visibility.sql (migration)
  - infin8content/lib/services/llm-visibility/visibility-engine.ts (new)
  - infin8content/lib/services/llm-visibility/prompt-suggester.ts (new)
  - infin8content/lib/inngest/functions/llm-visibility-tracker.ts (new)
  - infin8content/lib/services/llm-visibility/route-handlers.ts (new)
  - infin8content/app/api/llm-visibility/* (6 thin route files)
  - infin8content/app/dashboard/llm-visibility/page.tsx (dashboard + new UI)

- **Manual post-merge steps:**
  1. Apply migration: open Supabase Dashboard → SQL Editor → paste `infin8content/supabase/migrations/20260419000000_add_llm_visibility.sql` and run.
  2. Regenerate Supabase types: `supabase gen types typescript --project-id <id> > lib/supabase/database.types.ts`.
  3. Remove temporary `as any` / `as unknown as` casts in `route-handlers.ts` and `llm-visibility-tracker.ts`.

- **Notes:** All TypeScript checks passed locally after small type-cast workarounds; Inngest functions and sidebar nav were registered. See branch `test-main-all` for commits.

---

## Pricing Alignment Update (2026-03-16)

**Status:** ✅ COMPLETE - Stripe prices matched across codebase

### Changes Made
- Updated `lib/config/pricing-plans.ts` annual prices to match Stripe
- Updated `app/payment/payment-form.tsx` planPrices to match Stripe  
- Updated `STRIPE_PRODUCTS_SETUP.md` with current Stripe prices
- Updated `docs/pricing-system-implementation.md` pricing table

### Stripe Prices (Live)
- **Starter:** $49/month, $498/year
- **Pro:** $220/month, $2,100/year  
- **Agency:** $399/month, $3,588/year
- **Trial:** $1 one-time

### Files Updated
- lib/config/pricing-plans.ts
- app/payment/payment-form.tsx
- STRIPE_PRODUCTS_SETUP.md
- docs/pricing-system-implementation.md

**Git:** Ready for commit to test-main-all branch
4. PM monitors execution

---

## 2026-04-16 — Epic 12: Onboarding & Feature Discovery — COMPLETED

- **Branch:** `feat/epic-12-onboarding-discovery` (merged / fast-forwarded into `test-main-all`)
- **PR:** https://github.com/dvernon0786/Infin8Content/pull/458
- **Summary:** Implemented all 13 stories in Epic 12 (Onboarding & Feature Discovery). Changes are additive: database migrations, new APIs, onboarding services, Inngest onboarding email sequence, UI components, and documentation.
- **Key deliverables:**
	- DB migrations:
		- `supabase/migrations/20260416000001_add_onboarding_discovery_state.sql`
		- `supabase/migrations/20260416000002_create_feature_announcements.sql`
		- `supabase/migrations/20260416000003_create_user_feedback.sql`
	- Feature flags: `ENABLE_GUIDED_TOURS`, `ENABLE_FEATURE_ANNOUNCEMENTS`, `ENABLE_FEEDBACK_WIDGET`
	- Services: `lib/services/onboarding/user-success-tracker.ts`, `lib/services/onboarding/onboarding-emails.ts`
	- Inngest: `lib/inngest/functions/onboarding-email-sequence.ts`
	- APIs: `/api/onboarding/success-events`, `/api/onboarding/tour-shown`, `/api/announcements`, `/api/announcements/[id]/read`, `/api/feedback`
	- UI: `GuidedTour`, `GuidedTourWrapper`, `WhatsNewCard`, `HelpDrawer`, `AnnouncementBanner`, `FeedbackWidget`, `PaymentStatusBanner`, plus UI primitives and help pages (`/help/faq`, `/help/tutorials`).
	- Tests: 22 new vitest tests focused on onboarding services and APIs (local subset executed; `tsc --noEmit` clean locally).
- **Stats:** 36 files changed, ~2012 insertions (committed to `feat/epic-12-onboarding-discovery`, merged to `test-main-all`).
- **Safety notes:** Additive DB changes; RLS policies applied where appropriate; tours and announcements are feature-flag gated and default-disabled for safe rollout. Rollback via flags is possible.
- **Action:** PR #458 created and CI will run; awaiting maintainer review/merge.

---

### 2026-04-19 — Quick Dev Session: Test Fixes & Branch Push

- **Summary:** Performed a targeted test-fix pass addressing auth route tests and the Stripe webhook suite. Resolved mocking issues for `createServiceRoleClient` and Stripe SDK calls (`invoices.listLineItems`, `subscriptions.retrieve`), and adjusted Supabase query mocks from `.single()` to `.limit(1)` where the route uses `.limit(1)`.
- **Files fixed (tests):**
  - `app/api/webhooks/stripe/route.test.ts` (10/10)
  - `app/api/auth/login/route.test.ts`
  - `app/api/auth/register/route.test.ts`
  - `app/api/auth/verify-otp/route.test.ts`
  - `app/api/organizations/create/route.test.ts`
- **Result:** Local full-suite run reported 0 failing files after fixes.
- **Branch work:** Created branch `test-main-all`, updated sprint docs and this scratchpad, committed changes, and pushed to `origin/test-main-all`.
- **Next:** Open PR from `test-main-all` → `main` so CI can run on remote; request reviewer when ready.

---

**BMAD Status:** ✅ PHASE 1 & 2 COMPLETE | 🚀 PHASE 3 WEEK 1 STARTED  
**Ready for Engineering:** ✅ YES  
**Architecture Locked:** ✅ YES  

