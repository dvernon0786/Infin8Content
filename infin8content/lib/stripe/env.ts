// Environment variable validation for Stripe
export function validateStripeEnv() {
  const requiredEnvVars = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  }
  const missing: string[] = []
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) missing.push(key)
  }
  if (missing.length > 0) {
    throw new Error(`Missing required Stripe environment variables: ${missing.join(', ')}`)
  }
  return requiredEnvVars
}

