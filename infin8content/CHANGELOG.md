# Changelog

All notable changes to the Infin8Content platform will be documented in this file.

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
