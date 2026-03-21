# Infin8Content Pricing + Quota Implementation Spec

Goal:
One source of truth for limits
PLAN_LIMITS drives:
• quota enforcement
• pricing UI
• usage meter
• soft paywall

No duplicated numbers anywhere.

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
