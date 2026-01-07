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
      apiVersion: '2024-11-20.acacia', // Pin API version for stability (Story 1.7 requirement)
    })
  }
  return stripeInstance
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe]
  }
})

