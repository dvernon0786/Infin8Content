# Infin8Content Pricing + Quota Implementation Spec

**Last Updated**: 2026-04-24  
**Status**: ✅ Production — Marketing mirror implemented  
**Route (implemented)**: `/pricing` → `/app/(marketing-pages)/pricing/`

Note: A static marketing mirror was added under `(marketing-pages)` to exactly match `/ai-content-writer` via `MarketingShell` + `MarketingPageBody`. The dynamic componentized version under `(i8c-mkt)` remains viable for future refactor to `MktLayout` tokens.

---

## 🎯 Goal

One source of truth for limits  
PLAN_LIMITS drives:
• quota enforcement  
• pricing UI  
• usage meter  
• soft paywall  

No duplicated numbers anywhere.

---

## 📁 Route Structure

**Updated 2026-04-24**: Implemented as a marketing mirror at `(marketing-pages)/pricing` using `MarketingShell` for token parity with `/ai-content-writer`. Keep `(i8c-mkt)` route plan documented below for potential migration back to `MktLayout`.

```
app/
├─ (i8c-mkt)/                          # Uses MktLayout with --mkt-* CSS vars (planned)
│  ├─ layout.tsx                       # MktLayout wrapper (planned)
│  ├─ pricing/                         # (planned)
│  │  ├─ layout.tsx                    # Pass-through (inherits parent MktLayout)
│  │  └─ page.tsx                      # Pricing page components
│  ├─ solutions/                       # Agency, E-commerce, Local, SaaS
│  └─ resources/                       # Blog, Case Studies, Learn
├─ (marketing-pages)/                  # Uses MarketingShell with --* CSS vars (implemented)
│  ├─ layout.tsx                       # MarketingShell wrapper
│  ├─ pricing/                         # IMPLEMENTED mirror (static HTML+CSS)
│  │  └─ page.tsx                      # Injects HTML/CSS via MarketingPageBody
│  ├─ ai-content-writer/
│  ├─ ai-seo-agent/
│  ├─ ai-seo-editor/
│  ├─ autopublish/
│  └─ llm-tracker/
```

**Why the route change?**  
Pricing visual parity with `/ai-content-writer` was prioritized. The mirror under `(marketing-pages)` guarantees exact token behavior now; a later migration can swap to `(i8c-mkt)` + `MktLayout` without changing content.

---

## ✅ 2026-04-24 Implementation Notes

- Files added/changed:
  - `app/(marketing-pages)/pricing/page.tsx` — static HTML+CSS mirror rendered via `MarketingPageBody`
  - `components/marketing/MarketingPageBody.tsx` — wired `window._setPricing(mode)` and button listeners (monthly/annual) for this page
- Commit: `d9948f86` on `test-main-all`
- Layout: inherits `MarketingShell` from `app/(marketing-pages)/layout.tsx`
- Behavior: Billing toggle and FAQ accordion handled by `MarketingPageBody` `useEffect`

---

# 1. Source of Truth

File:
`/lib/config/plan-limits.ts`

```ts
export const PLAN_LIMITS = {
  article_generation: {
    trial: 1,
    starter: 10,
    pro: 50,
    agency: 150,
  },
  keyword_research: {
    trial: 5,
    starter: 50,
    pro: 200,
    agency: null,
  },
  cms_connection: {
    trial: 0,
    starter: 1,
    pro: 3,
    agency: null,
  },
  workflow_active: {
    trial: null,
    starter: 1,
    pro: 5,
    agency: null,
  },
  image_storage_gb: {
    trial: 1,
    starter: 5,
    pro: 25,
    agency: 100,
  }
} as const
```

Rules:
null = unlimited
number = quota

---

# 2. Pricing UI Alignment

- **File**: `components/marketing/pricing/PricingPlans.tsx`
- **Rule**: Never hardcode prices or limits in JSX. Always pull from `PLAN_LIMITS` or `PRICING_PLANS`.

---

# 3. Quota Enforcement

- **Backend**: `app/api/articles/generate/route.ts` and `lib/inngest/functions/scheduler.ts`.
- **Logic**: Retrieve user plan from `organizations` and check against `PLAN_LIMITS`.

---

# 4. Status Hardening

- **File**: `lib/constants/status-configs.ts`
- **Rule**: All database statuses must be mapped to a visual style. Unknown statuses should fallback to a safe 'Draft' state with console warnings.
- **Statuses**: `draft`, `queued`, `processing`, `completed`, `failed`, `cancelled`, `reviewing`, `generating`.
