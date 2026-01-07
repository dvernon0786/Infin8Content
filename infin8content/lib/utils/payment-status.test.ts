/**
 * Payment Status Utility Tests
 * 
 * Unit tests for payment status utility functions
 * Story 1.8: Payment-First Access Control (Paywall Implementation)
 */

import { describe, it, expect } from 'vitest'
import { checkGracePeriodExpired, getPaymentAccessStatus } from './payment-status'
import type { Database } from '@/lib/supabase/database.types'

type Organization = Database['public']['Tables']['organizations']['Row']

describe('checkGracePeriodExpired', () => {
  it('should return false when grace period not started (null)', () => {
    const result = checkGracePeriodExpired(null)
    expect(result).toBe(false)
  })

  it('should return false when grace period started less than 7 days ago', () => {
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    const result = checkGracePeriodExpired(sixDaysAgo)
    expect(result).toBe(false)
  })

  it('should return false when grace period started exactly 7 days ago (boundary)', () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const result = checkGracePeriodExpired(sevenDaysAgo)
    expect(result).toBe(false)
  })

  it('should return true when grace period started more than 7 days ago', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    const result = checkGracePeriodExpired(eightDaysAgo)
    expect(result).toBe(true)
  })

  it('should return true when grace period started 30 days ago', () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const result = checkGracePeriodExpired(thirtyDaysAgo)
    expect(result).toBe(true)
  })
})

describe('getPaymentAccessStatus', () => {
  const baseOrg: Partial<Organization> = {
    id: 'test-org-id',
    name: 'Test Organization',
    plan: 'starter',
    payment_status: 'pending_payment',
    payment_confirmed_at: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    grace_period_started_at: null,
    suspended_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    white_label_settings: null,
  }

  describe('active payment status', () => {
    it('should return active for active payment status', () => {
      const org = {
        ...baseOrg,
        payment_status: 'active' as const,
      } as Organization

      const result = getPaymentAccessStatus(org)
      expect(result).toBe('active')
    })
  })

  describe('past_due payment status', () => {
    it('should return grace_period when past_due and grace period not expired', () => {
      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      const org = {
        ...baseOrg,
        payment_status: 'past_due' as const,
        grace_period_started_at: sixDaysAgo.toISOString(),
      } as Organization

      const result = getPaymentAccessStatus(org)
      expect(result).toBe('grace_period')
    })

    it('should return suspended when past_due and grace period expired', () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      const org = {
        ...baseOrg,
        payment_status: 'past_due' as const,
        grace_period_started_at: eightDaysAgo.toISOString(),
      } as Organization

      const result = getPaymentAccessStatus(org)
      expect(result).toBe('suspended')
    })

    it('should return suspended when past_due and grace_period_started_at is null (edge case)', () => {
      const org = {
        ...baseOrg,
        payment_status: 'past_due' as const,
        grace_period_started_at: null,
      } as Organization

      const result = getPaymentAccessStatus(org)
      // If payment failed but no grace period was started, account should be suspended
      expect(result).toBe('suspended')
    })
  })

  describe('suspended payment status', () => {
    it('should return suspended for suspended payment status', () => {
      const org = {
        ...baseOrg,
        payment_status: 'suspended' as const,
        suspended_at: new Date().toISOString(),
      } as Organization

      const result = getPaymentAccessStatus(org)
      expect(result).toBe('suspended')
    })
  })

  describe('pending_payment status', () => {
    it('should return pending_payment for pending_payment status', () => {
      const org = {
        ...baseOrg,
        payment_status: 'pending_payment' as const,
      } as Organization

      const result = getPaymentAccessStatus(org)
      expect(result).toBe('pending_payment')
    })
  })

  describe('canceled payment status', () => {
    it('should return pending_payment for canceled payment status', () => {
      const org = {
        ...baseOrg,
        payment_status: 'canceled' as const,
      } as Organization

      const result = getPaymentAccessStatus(org)
      expect(result).toBe('pending_payment')
    })
  })

  describe('edge cases', () => {
    it('should return pending_payment when payment_status is null', () => {
      const org = {
        ...baseOrg,
        payment_status: null,
      } as Organization

      const result = getPaymentAccessStatus(org)
      expect(result).toBe('pending_payment')
    })

    it('should handle grace period boundary correctly (exactly 7 days)', () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const org = {
        ...baseOrg,
        payment_status: 'past_due' as const,
        grace_period_started_at: sevenDaysAgo.toISOString(),
      } as Organization

      const result = getPaymentAccessStatus(org)
      // Should still be in grace period (not expired yet)
      expect(result).toBe('grace_period')
    })
  })
})

