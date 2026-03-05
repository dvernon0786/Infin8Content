// Stripe Price IDs - Update when prices change in Stripe Dashboard
// Format: { plan: { billingFrequency: 'price_xxx' } }
if (!process.env.STRIPE_PRICE_TRIAL_MONTHLY) {
  throw new Error("Missing STRIPE_PRICE_TRIAL_MONTHLY")
}

export const STRIPE_PRICE_IDS = {
  trial: {
    monthly: process.env.STRIPE_PRICE_TRIAL_MONTHLY,
    annual: process.env.STRIPE_PRICE_TRIAL_ANNUAL || 'price_trial_annual_fallback',
  },
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_xxx',
    annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || 'price_yyy',
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_zzz',
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL || 'price_aaa',
  },
  agency: {
    monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY || 'price_bbb',
    annual: process.env.STRIPE_PRICE_AGENCY_ANNUAL || 'price_ccc',
  },
} as const

export type PlanType = keyof typeof STRIPE_PRICE_IDS
export type BillingFrequency = 'monthly' | 'annual'

export function getPriceId(plan: PlanType, billingFrequency: BillingFrequency): string {
  return STRIPE_PRICE_IDS[plan][billingFrequency]
}

export const PRICE_PLAN_MAP: Record<string, PlanType> = {
  [STRIPE_PRICE_IDS.trial.monthly]: 'trial',
  [STRIPE_PRICE_IDS.trial.annual]: 'trial',
  [STRIPE_PRICE_IDS.starter.monthly]: 'starter',
  [STRIPE_PRICE_IDS.starter.annual]: 'starter',
  [STRIPE_PRICE_IDS.pro.monthly]: 'pro',
  [STRIPE_PRICE_IDS.pro.annual]: 'pro',
  [STRIPE_PRICE_IDS.agency.monthly]: 'agency',
  [STRIPE_PRICE_IDS.agency.annual]: 'agency',
}

export function getPlanFromPriceId(priceId: string): PlanType | undefined {
  return PRICE_PLAN_MAP[priceId]
}

