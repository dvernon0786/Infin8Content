/**
 * Payment status utility functions for grace period and suspension logic
 * Story 1.8: Payment-First Access Control (Paywall Implementation)
 */

import type { Database } from '@/lib/supabase/database.types'

type Organization = Database['public']['Tables']['organizations']['Row']

/**
 * Check if grace period has expired
 * Grace period duration is 7 days from grace_period_started_at
 * 
 * @param gracePeriodStartedAt - Timestamp when grace period started (null if not started)
 * @returns true if grace period expired (more than 7 days ago), false otherwise
 */
export function checkGracePeriodExpired(gracePeriodStartedAt: Date | null): boolean {
  if (!gracePeriodStartedAt) {
    return false // No grace period started, so not expired
  }

  const now = Date.now()
  const gracePeriodStart = new Date(gracePeriodStartedAt).getTime()
  const gracePeriodDurationMs = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

  return (now - gracePeriodStart) > gracePeriodDurationMs
}

/**
 * Get payment access status for an organization
 * Determines current access level based on payment status and grace period
 * 
 * @param org - Organization record from database
 * @returns Payment access status: 'active' | 'grace_period' | 'suspended' | 'pending_payment'
 */
export function getPaymentAccessStatus(org: Organization): 'active' | 'grace_period' | 'suspended' | 'pending_payment' {
  const paymentStatus = org.payment_status || 'pending_payment'
  const gracePeriodStartedAt = org.grace_period_started_at ? new Date(org.grace_period_started_at) : null

  // Active payment - full access
  if (paymentStatus === 'active') {
    return 'active'
  }

  // Past due - check if grace period expired
  if (paymentStatus === 'past_due') {
    const gracePeriodExpired = checkGracePeriodExpired(gracePeriodStartedAt)
    if (gracePeriodExpired) {
      return 'suspended' // Grace period expired, account should be suspended
    }
    return 'grace_period' // Still in grace period, allow access
  }

  // Suspended - no access
  if (paymentStatus === 'suspended') {
    return 'suspended'
  }

  // Pending payment or canceled - no access
  if (paymentStatus === 'pending_payment' || paymentStatus === 'canceled') {
    return 'pending_payment'
  }

  // Default to pending_payment for unknown statuses
  return 'pending_payment'
}

