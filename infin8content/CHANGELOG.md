## 2026-04-24

### Added
- `/app/(marketing-pages)/pricing/page.tsx`: Static HTML+CSS mirror of pricing page for exact visual match with `/ai-content-writer` (renders via `MarketingPageBody`).
- `/app/(marketing-pages)/resources/case-studies/page.tsx`: Static HTML+CSS mirror of case studies page using `MarketingPageBody` for parity with `/ai-content-writer`.

### Changed
- `components/marketing/MarketingPageBody.tsx`: Add `window._setPricing(mode)` and bind monthly/annual buttons when present; default to annual.
- `components/marketing/MarketingPageBody.tsx`: Add tag filter event handler listening on `#tag-filter` to toggle `[data-hidden]` on `.cs-card` items.

### Removed
- `/app/(i8c-mkt)/resources/case-studies/page.tsx`: Deleted legacy route to avoid duplication with `(marketing-pages)` mirror.

### Meta
- Commit: d9948f86 (branch: test-main-all)

# Changelog

All notable changes to the Infin8Content platform will be documented in this file.

## [Unreleased] - 2026-04-21

### Fixed
- **article-generation:** `POST /api/articles/generate` returned `400 "Article ID is required"` when submitting the standalone Generate Article form — form was sending raw keyword/config to a trigger-only endpoint. Fixed by adding `POST /api/articles` create endpoint and splitting `handleGenerate` into a create-then-trigger two-step flow.
- **article-generation:** `GET /api/articles/usage` returned `404` — created missing route file that reads `org.article_usage`, `article_limit`, and `plan` from the authenticated user's organization.
- **article-generation:** `handleGenerate` now correctly forwards `articleType`, `language`, and `articleTypeConfig` to the create step (previously dropped, causing default fallbacks).
- **dashboard:** "Generate Articles" overview cards all linked to `/dashboard/workflows/new` instead of `/dashboard/articles/generate?type=seo|news|youtube` — fixed all 3 card hrefs.
- **feature-flags:** Add short in-memory caching and `getFeatureFlagsForOrg()` batch fetch to reduce Supabase round-trips during server render; lower missing-flag log level to `info` to avoid noisy warnings. See branch `test-main-all` (commit `58ac8eab`).


## [2.6.0] - 2026-04-16

### Added
- **Epic 12 — Onboarding & Feature Discovery**: Guided tours, announcements, feedback widget, WhatsNewCard, HelpDrawer, PaymentStatusBanner, and supporting APIs and services. Additive DB migrations and RLS applied for announcements and feedback.
- **Inngest:** `onboarding-email-sequence` (welcome → day-3 → day-7)
- **APIs:** onboarding success events, tour-shown patch, announcements, announcement read, feedback collection

### Changed
- Added feature flags: `ENABLE_GUIDED_TOURS`, `ENABLE_FEATURE_ANNOUNCEMENTS`, `ENABLE_FEEDBACK_WIDGET`

### Tests
- 22 vitest tests added for onboarding services and APIs

**PR:** https://github.com/dvernon0786/Infin8Content/pull/458

## [2.5.0] - 2026-03-07
### Added
- **Stripe Trial Support**: Added `trial_period_days: 3` to Stripe checkout sessions for the trial plan.
- **Trial Policy Strategy**: Set `workflow_active.trial = null` in `PLAN_LIMITS` to allow unlimited active workflows, staying consistent with the "experiment freely" trial value prop.

### Changed
- **Feature Flag Resilience**: Modified `isFeatureFlagEnabled` to default to `true` (fail-open) when a flag row is missing, ensuring new organizations aren't blocked from the Intent Engine by default.
- **Workflow State Mapping**: Corrected the next-state transition in the atomic usage-recording RPC from `step_2_keywords` to the actual enum value `step_2_competitors`.

### Fixed
- **Critical RPC Regression**: Resolved `public.SUM(numeric)` error (42883) by removing invalid schema qualification from `pg_catalog` aggregate functions in `check_workflow_cost_limit`.
- **ICP Usage Recording**: Updated `record_usage_increment_and_complete_step` signature and mapped it to correctly existing `usage_tracking` columns (`tokens`, `cost`, `model`), resolving "column does not exist" (42703) fatal errors.
- **User Permission Logic**: Refined `PLAN_LIMITS` enforcement to accurately distinguish between trial and paid tiers without causing false 403 blocks on legacy accounts.

## [2.4.0] - 2026-03-02
### Added
- **reseed_sections RPC**: Implemented atomic article section reseeding to prevent race conditions and partial states.
- **Planner Fallback**: Added `openai/gpt-4o-mini` fallback for the Content Planner Agent for increased resilience.
- **Agent Prompts Specification**: Created `docs/AGENT_PROMPTS_SPECIFICATION.md` as the authoritative source for agent models and prompts.

### Changed
- **Model Upgrades**: Upgraded Planner Agent to `z-ai/glm-5` and Research Agent to `z-ai/glm-4.7`.
- **Content Writing Agent**: Switched to `anthropic/claude-sonnet-4.5` for premium prose generation.
- **Research Agent Prompt**: Removed legacy tool references and hallucinated URL requirements to improve synthesis reliability.
- **Worker Hardening**: Replaced `select(*)` with explicit column selection in the article generation worker.
- **Type Safety**: Updated `ArticleStatus` to include `cancelled` and removed stale agent input interfaces from global types.

### Fixed
- **Organization ID Resolution**: Corrected `organization_id` reference in the article assembler call to resolve RLS issues.
- **ICP Context Assembly**: Fixed malformed ICP context string by joining business description and ICP analysis correctly.
- **CTA Branding Naming**: Renamed `has_cta` to `add_cta` in the database to align with the authoritative agent code.
- **Research Prompt Cleanup**: Removed brand-name references and contradictory search instructions in the research agent.
- **Type Safety**: Updated the research-agent integration test to import types from the correct service and match the updated agent interface.

## [2.3.0] - 2026-02-26
### Added
- **Separated Planning & Execution**: Decoupled article content planning from execution to support quota-governed platforms.
- **Article Scheduler**: New Inngest cron service (`articleScheduler`) that processes queued articles every 30 minutes.
- **Manual Generation Route**: Restored and hardened `/api/articles/generate` with real-time quota validation.
- **Scheduling Schema**: Added `scheduled_at` to `articles` for prioritized background processing.

### Changed
- **Step 9 Article Queuing**: Now operates as a "Planning Only" stage, seeding data without triggering immediate AI writing.
- **Keyword Lifecycle**: Added `ready` status to keywords to indicate approval for generation.

## [2.2.0] - 2026-02-26

### 🚀 Article Architecture Consolidation & Enterprise Hardening
- **Consolidated**: Officially designated "Intent Engine + FSM + Inngest" as the single source of truth for article generation.
- **Removed**: Deleted legacy queue-based systems (`lib/article-generation`), redundant API routes (`app/api/articles`), and legacy migrations to eliminate architectural drift.
- **Normalized**: Updated `articles` table to use `org_id` and `intent_workflow_id`, and transition to storing content in a deterministic `sections` JSONB column.
- **Hardened**: Implemented `status: 'generating'` guards and strict section-count validation in `ArticleAssembler` to prevent race conditions and partial assembly.
- **Improved**: Added real-time production logging for terminal FSM transitions (`checkAndCompleteWorkflow`), resolving the Step 9 redirect hang.
- **Standardized**: Aligned `ArticleAssembler` and `WordPressPublisher` with the new unified JSONB storage model.

## [2.1.1] - 2026-02-25

### 🚀 Audit Logging & Workflow UX Improvements
- **Fixed**: RLS violations in `intent_audit_logs` by switching to `createServiceRoleClient` for Intent Engine background logging.
- **Standardized**: Headless audit events now correctly bypass RLS while maintaining organization isolation.
- **Improved**: Added automatic redirect to `/dashboard/articles` with a 1.5s delay when a workflow transitions to the `completed` state.
- **Enhanced**: User flow from Step 9 (Article Queueing) to Article Generation is now seamless and intentional.

## [2.1.0] - 2026-02-24

### 🚀 Quota Telemetry & Concurrency Hardening
- **Implemented**: Centralized `PLAN_LIMITS` configuration in `lib/config/plan-limits.ts`.
- **Standardized**: All quota-related `403 Forbidden` responses now include structured metadata (`limit`, `usage`, `plan`, `metric`).
- **Unified**: All usage tracking points (Articles, Keywords, CMS, Workflows) now emit `quota.*.limit_hit` telemetry logs.
- **Refactored**: Workflow concurrency guard moved from execution layer to creation boundary for architectural integrity.
- **Improved**: UI logic transformed technically-dry errors into "Upgrade" or "Deactivate" user pathways.
- **Security**: Service role client usage hardened in quota enforcement layers.

### 🧪 Technical Achievements
- 100% Zero Drift Protocol compliance (no FSM or Worker logic changes).
- Elimination of "self-blocking" race conditions on Starter plans.
- High-impact modal upgrade flows for Article generation.
- Consistent point-of-creation enforcement for active workflows.

## [2026-02-14] - DataForSEO Geo Consistency Release

### 🚀 New Features
- **Full Global Support**: Added support for all 94 DataForSEO locations and 48 languages
- **Unified Geo Architecture**: Single source of truth for location and language resolution
- **Expanded Onboarding UI**: Users can now select from all supported regions and languages

### 🔧 Backend Changes
- **Created**: `lib/config/dataforseo-geo.ts` - Shared geo configuration
- **Fixed**: Competitor-Analyze endpoint - Now uses dynamic geo resolution
- **Fixed**: Research Keywords endpoint - Removed hardcoded US/English defaults
- **Fixed**: Longtail Expander - Fixed phantom column reads (`default_location_code`)
- **Fixed**: Subtopic Generator - Fixed non-existent icp_settings reads
- **Added**: Case-insensitive geo resolution with safe fallbacks

### 🎨 Frontend Changes
- **Expanded**: Region dropdown from 10 to 94 locations
- **Expanded**: Language dropdown from 6 to 48 languages
- **Improved**: US pinned to top, remaining countries sorted alphabetically
- **Added**: Language labels for user-friendly display
- **Dynamic**: UI now reads from shared geo config (no hardcoded values)

### 🛡️ Improvements
- **Eliminated**: Geo drift between workflow steps
- **Removed**: All hardcoded location codes (2840) and language codes ('en')
- **Standardized**: All services now read from `organizations.keyword_settings`
- **Added**: Comprehensive logging for geo resolution debugging

### 📊 Technical Details
- **Files Modified**: 6 files (1 new, 5 updated)
- **Services Fixed**: 4 backend services
- **UI Components**: 1 onboarding component
- **Build Status**: ✅ TypeScript compilation successful

### 🧪 Testing
- **Germany Test Case**: Verified all 4 workflow steps resolve to `locationCode: 2276, languageCode: de`
- **Fallback Testing**: Confirmed safe defaults for missing/invalid geo settings
- **Integration Testing**: All services properly import and use shared geo config

### 📈 Impact
- **User Experience**: Full access to DataForSEO's global capabilities
- **Data Accuracy**: Geo-consistent keyword research across entire workflow
- **Maintainability**: Single point of maintenance for geo mappings
- **Global Reach**: Support for agencies targeting non-US markets

---

## Previous Versions

### [Pre-2026-02-14] - Legacy Geo Implementation
- ❌ Mixed geo sources across services
- ❌ Hardcoded US/English defaults
- ❌ Phantom database column reads
- ❌ Limited UI options (10 regions, 6 languages)
- ❌ Geo drift between workflow steps

---

**Note**: This release represents a complete architectural overhaul of the geo handling system. All geo-related functionality is now unified, consistent, and production-ready.
