import { loadStripe } from '@stripe/stripe-js'

export const getStripe = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!publishableKey) throw new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
  return loadStripe(publishableKey)
}

