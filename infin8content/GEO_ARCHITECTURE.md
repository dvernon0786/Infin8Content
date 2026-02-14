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

// Resolver functions
export function resolveLocationCode(region?: string): number
export function resolveLanguageCode(code?: string): string
```

### 2. Data Flow Architecture

```
User Selection (Onboarding UI)
        ↓
organizations.keyword_settings
        ↓
resolveLocationCode() / resolveLanguageCode()
        ↓
DataForSEO API (location_code, language_code)
```

## 🔧 Service Integration

### Backend Services (4 Total)

| Service | File | Geo Source | Status |
|---------|------|------------|--------|
| Competitor-Analyze | `app/api/intent/workflows/[workflow_id]/steps/competitor-analyze/route.ts` | keyword_settings | ✅ |
| Research Keywords | `app/api/research/keywords/route.ts` | keyword_settings | ✅ |
| Longtail Expander | `lib/services/intent-engine/longtail-keyword-expander.ts` | keyword_settings | ✅ |
| Subtopic Generator | `lib/services/keyword-engine/subtopic-generator.ts` | keyword_settings | ✅ |

### Frontend Components

| Component | File | Geo Source | Status |
|----------|------|------------|--------|
| Onboarding Settings | `components/onboarding/StepKeywordSettings.tsx` | LOCATION_CODE_MAP | ✅ |

## 🛡️ Error Handling & Fallbacks

### Resolution Logic
```typescript
// Location resolution
if (!region) return 2840 // US fallback
const normalized = region.trim().toLowerCase()
const match = Object.entries(LOCATION_CODE_MAP).find(
  ([key]) => key.toLowerCase() === normalized
)
return match ? match[1] : 2840 // US fallback

// Language resolution  
if (!code) return 'en' // English fallback
const normalized = code.trim().toLowerCase()
return SUPPORTED_LANGUAGE_CODES.has(normalized)
  ? normalized
  : 'en' // English fallback
```

### Safety Features
- Case-insensitive matching
- Whitespace normalization
- Safe defaults (US/English)
- No exceptions thrown

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
- Hardcoded values
- Geo drift between services

### After (Fixed)
- Single source of truth
- Consistent resolution
- Dynamic UI options
- No geo drift

## 🧪 Testing Strategy

### Unit Tests
- Resolver function edge cases
- Case-insensitive matching
- Fallback behavior

### Integration Tests
- Service geo resolution
- UI form submission
- Backend API calls

### End-to-End Tests
- Germany test case workflow
- All 4 workflow steps consistency
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
- [ ] Germany test case passes
- [ ] All services log correct geo settings
- [ ] No TypeScript errors
- [ ] Build successful

### Post-deployment
- [ ] Monitor logs for geo resolution
- [ ] Check for any 2840 fallbacks
- [ ] Verify user adoption of new regions
- [ ] Performance monitoring

---

**Architecture Status**: ✅ Production Ready
**Last Updated**: 2026-02-14
**Version**: 1.0.0
