// Stripe Price IDs - Update when prices change in Stripe Dashboard
// Format: { plan: { billingFrequency: 'price_xxx' } }
const requiredPriceEnvVars = [
  'STRIPE_PRICE_TRIAL_MONTHLY',
  'STRIPE_PRICE_STARTER_MONTHLY',
  'STRIPE_PRICE_STARTER_ANNUAL',
  'STRIPE_PRICE_PRO_MONTHLY',
  'STRIPE_PRICE_PRO_ANNUAL',
  'STRIPE_PRICE_AGENCY_MONTHLY',
  'STRIPE_PRICE_AGENCY_ANNUAL',
] as const

// Validation moved to getPriceId to prevent build-time crashes

export const STRIPE_PRICE_IDS = {
  trial: {
    monthly: process.env.STRIPE_PRICE_TRIAL_MONTHLY as string,
    // Trial annual is genuinely optional (in many SaaS contexts it doesn't exist)
    annual: process.env.STRIPE_PRICE_TRIAL_ANNUAL as string | undefined,
  },
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY as string,
    annual: process.env.STRIPE_PRICE_STARTER_ANNUAL as string,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY as string,
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL as string,
  },
  agency: {
    monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY as string,
    annual: process.env.STRIPE_PRICE_AGENCY_ANNUAL as string,
  },
} as const

export type PlanType = keyof typeof STRIPE_PRICE_IDS
export type BillingFrequency = 'monthly' | 'annual'

export function getPriceId(plan: PlanType, billingFrequency: BillingFrequency): string | undefined {
  // Validate env vars at request time instead of build/startup time
  for (const envVar of requiredPriceEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required Stripe price env var: ${envVar}`)
    }
  }

  const priceId = STRIPE_PRICE_IDS[plan][billingFrequency]
  if (!priceId && plan !== 'trial') { // trial may not have an annual definition
    throw new Error(`Missing Stripe price ID for ${plan}/${billingFrequency}`)
  }
  return priceId
}

export const PRICE_PLAN_MAP: Record<string, PlanType> = {
  [STRIPE_PRICE_IDS.trial.monthly]: 'trial',
  [STRIPE_PRICE_IDS.starter.monthly]: 'starter',
  [STRIPE_PRICE_IDS.starter.annual]: 'starter',
  [STRIPE_PRICE_IDS.pro.monthly]: 'pro',
  [STRIPE_PRICE_IDS.pro.annual]: 'pro',
  [STRIPE_PRICE_IDS.agency.monthly]: 'agency',
  [STRIPE_PRICE_IDS.agency.annual]: 'agency',
}

// Don't generate placeholder map keys for optional plans
if (STRIPE_PRICE_IDS.trial.annual) {
  PRICE_PLAN_MAP[STRIPE_PRICE_IDS.trial.annual] = 'trial'
}

export function getPlanFromPriceId(priceId: string): PlanType | undefined {
  return PRICE_PLAN_MAP[priceId]
}

