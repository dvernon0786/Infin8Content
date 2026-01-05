import Stripe from 'stripe'
import { validateStripeEnv } from './env'

const { STRIPE_SECRET_KEY } = validateStripeEnv()
if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required')
}
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover', // Pin API version for stability
})

