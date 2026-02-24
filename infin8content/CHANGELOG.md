# Changelog

All notable changes to the Infin8Content platform will be documented in this file.

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
