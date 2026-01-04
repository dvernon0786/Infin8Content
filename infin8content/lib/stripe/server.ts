import Stripe from 'stripe'
import { validateStripeEnv } from './env'

const { STRIPE_SECRET_KEY } = validateStripeEnv()
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia', // Pin API version for stability
})

