/**
 * Stripe Environment Validation Tests
 * 
 * Unit tests for validateStripeEnv function
 * Tests cover validation of required Stripe environment variables
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateStripeEnv } from './env'

describe('validateStripeEnv', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return env vars when all required variables are present', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123'

    const result = validateStripeEnv()

    expect(result).toEqual({
      STRIPE_SECRET_KEY: 'sk_test_123',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
      STRIPE_WEBHOOK_SECRET: 'whsec_123',
    })
  })

  it('should throw error when STRIPE_SECRET_KEY is missing', () => {
    delete process.env.STRIPE_SECRET_KEY
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123'

    expect(() => validateStripeEnv()).toThrow(
      'Missing required Stripe environment variables: STRIPE_SECRET_KEY'
    )
  })

  it('should throw error when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123'

    expect(() => validateStripeEnv()).toThrow(
      'Missing required Stripe environment variables: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    )
  })

  it('should throw error when STRIPE_WEBHOOK_SECRET is missing', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123'
    delete process.env.STRIPE_WEBHOOK_SECRET

    expect(() => validateStripeEnv()).toThrow(
      'Missing required Stripe environment variables: STRIPE_WEBHOOK_SECRET'
    )
  })

  it('should throw error when multiple variables are missing', () => {
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123'

    expect(() => validateStripeEnv()).toThrow(
      'Missing required Stripe environment variables: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    )
  })

  it('should throw error when all variables are missing', () => {
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    delete process.env.STRIPE_WEBHOOK_SECRET

    expect(() => validateStripeEnv()).toThrow(
      'Missing required Stripe environment variables: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET'
    )
  })
})

