# DataForSEO Geo Architecture

## 🏗️ Architecture Overview

This document outlines the unified geo configuration architecture for DataForSEO integration across the Infin8Content platform.

## 📋 Core Components

### 1. Single Source of Truth
**File**: `lib/config/dataforseo-geo.ts`

```typescript
// Location mapping (94 countries)
export const LOCATION_CODE_MAP: Record<string, number> = {
  'United States': 2840,
  'United Kingdom': 2826,
  'Germany': 2276,
  // ... 91 more
}

// Language support (48 languages)
export const SUPPORTED_LANGUAGE_CODES = new Set([
  'en', 'de', 'fr', 'es', 'it', 'ja',
  // ... 42 more
])

// STRICT resolvers (production-safe)
export function resolveLocationCodeStrict(region?: string): number
export function resolveLanguageCodeStrict(code?: string): string
export async function getOrganizationGeoOrThrow(supabase: any, orgId: string): Promise<{locationCode: number, languageCode: string}>
```

### 2. Data Flow Architecture

```
User Selection (Onboarding UI)
        ↓
organizations.keyword_settings
        ↓
getOrganizationGeoOrThrow() → resolveLocationCodeStrict() / resolveLanguageCodeStrict()
        ↓
DataForSEO API (location_code, language_code)
```

## 🔧 Service Integration

### Backend Services (5 Total)

| Service | File | Geo Source | Fallback | Status |
|---------|------|------------|----------|--------|
| Competitor-Analyze | `app/api/intent/workflows/[workflow_id]/steps/competitor-analyze/route.ts` | getOrganizationGeoOrThrow() | ❌ | ✅ |
| Research Keywords | `app/api/research/keywords/route.ts` | getOrganizationGeoOrThrow() | ❌ | ✅ |
| Longtail Expander | `lib/services/intent-engine/longtail-keyword-expander.ts` | getOrganizationGeoOrThrow() | ❌ | ✅ |
| Subtopic Generator | `lib/services/keyword-engine/subtopic-generator.ts` | getOrganizationGeoOrThrow() | ❌ | ✅ |
| Research Service | `lib/research/keyword-research.ts` | getOrganizationGeoOrThrow() | ❌ | ✅ |

### Frontend Components

| Component | File | Geo Source | Status |
|----------|------|------------|--------|
| Onboarding Settings | `components/onboarding/StepKeywordSettings.tsx` | LOCATION_CODE_MAP | ✅ |

## 🛡️ Production-Safe Error Handling

### STRICT Resolution Logic
```typescript
// Location resolution (STRICT - NO FALLBACKS)
if (!region || region.trim().length < 2) {
  throw new Error('Organization target_region is not configured')
}
const normalized = region.trim().toLowerCase()
const match = Object.entries(LOCATION_CODE_MAP).find(
  ([key]) => key.toLowerCase() === normalized
)
if (!match) {
  throw new Error(`Unsupported target_region: "${region}"`)
}
return match[1]

// Language resolution (STRICT - NO FALLBACKS)
if (!code || code.trim().length < 2) {
  throw new Error('Organization language_code is not configured')
}
const normalized = code.trim().toLowerCase()
if (!SUPPORTED_LANGUAGE_CODES.has(normalized)) {
  throw new Error(`Unsupported language_code: "${code}"`)
}
return normalized
```

### Production Safety Features
- ❌ **No silent fallbacks**
- ❌ **No hardcoded defaults**
- ✅ **Immediate error throwing**
- ✅ **Case-insensitive matching**
- ✅ **Whitespace normalization**
- ✅ **Fail-fast enterprise behavior**

## 📊 Database Schema

### Organizations Table
```sql
keyword_settings JSONB DEFAULT '{}'
```

### Sample Data Structure
```json
{
  "target_region": "Germany",
  "language_code": "de",
  "auto_generate_keywords": true,
  "monthly_keyword_limit": 100
}
```

## 🔄 Migration Path

### Before (Broken)
- Mixed geo sources
- Phantom column reads
- Hardcoded values (2840, 'en')
- Silent US fallbacks
- Geo drift between services

### After (Production-Safe)
- Single source of truth
- Strict resolution only
- No fallback logic
- Fail-fast errors
- Full pipeline consistency

## 🧪 Testing Strategy

### Unit Tests
- Strict resolver function edge cases
- Case-insensitive matching
- Error throwing scenarios

### Integration Tests
- Service geo resolution
- UI form submission
- Backend API calls with strict validation

### End-to-End Tests
- Germany test case workflow (2276, de)
- United Kingdom test case (2826, en)
- All 5 workflow steps consistency
- Error handling scenarios

## 📈 Performance Considerations

### Resolver Efficiency
- O(n) lookup for location codes
- O(1) lookup for language codes
- Minimal memory footprint

### UI Performance
- Native select elements (no virtualization needed)
- 94 options manageable for browsers
- Alphabetical sorting for quick discovery

## 🔮 Future Enhancements

### UX Improvements
- Searchable dropdown component
- Continent grouping
- Smart defaults (browser locale)

### Advanced Features
- Geo validation API
- Usage analytics
- A/B testing for popular regions

## 🚀 Deployment Checklist

### Pre-deployment
- [x] Germany test case passes (2276, de)
- [x] All services log correct geo settings
- [x] No TypeScript errors
- [x] Build successful
- [x] Fallback logic removed from exports

### Post-deployment
- [ ] Monitor logs for geo resolution
- [ ] Verify no silent US fallbacks
- [ ] Check user adoption of new regions
- [ ] Performance monitoring

---

**Architecture Status**: ✅ Production Safe & Complete  
**Last Updated**: 2026-02-20  
**Version**: 2.0.0 (Production-Safe)
