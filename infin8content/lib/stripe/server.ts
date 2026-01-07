import Stripe from 'stripe'
import { validateStripeEnv } from './env'

// Lazy initialization - only validate and create Stripe client when actually used
// This prevents build-time errors when environment variables aren't available
let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    const { STRIPE_SECRET_KEY } = validateStripeEnv()
    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required')
    }
    stripeInstance = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia' as any, // Pin API version for stability (Story 1.7 requirement)
      // Note: Type assertion needed because Stripe v20 types only include newer API versions,
      // but Stripe API accepts this version string at runtime
    })
  }
  return stripeInstance
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe]
  }
})

