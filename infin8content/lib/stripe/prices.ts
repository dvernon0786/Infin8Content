// Stripe Price IDs - Update when prices change in Stripe Dashboard
// Format: { plan: { billingFrequency: 'price_xxx' } }
export const STRIPE_PRICE_IDS = {
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

