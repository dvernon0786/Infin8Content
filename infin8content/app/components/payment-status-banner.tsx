'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Database } from '@/lib/supabase/database.types'
import { getPaymentAccessStatus, checkGracePeriodExpired } from '@/lib/utils/payment-status'
import { GRACE_PERIOD_DURATION_MS, GRACE_PERIOD_DAYS } from '@/lib/config/payment'

type Organization = Database['public']['Tables']['organizations']['Row']

interface PaymentStatusBannerProps {
  organization: Organization
}

/**
 * Payment Status Banner Component
 * Displays payment status to user with appropriate messaging and actions
 * Story 1.8: Payment-First Access Control (Paywall Implementation)
 */
export default function PaymentStatusBanner({ organization }: PaymentStatusBannerProps) {
  const router = useRouter()
  const [gracePeriodDaysRemaining, setGracePeriodDaysRemaining] = useState<number | null>(null) // Explicitly initialized as null

  // Calculate grace period days remaining
  // Note: This uses client-side Date.now() for display purposes only.
  // Actual grace period enforcement happens server-side in middleware.
  // TODO: Consider fetching server-side calculated value for production to prevent client manipulation
  useEffect(() => {
    // Note: 'past_due' is handled as 'suspended' in the current schema
    // Note: grace_period_started_at is not in current schema, using updated_at as fallback
    const gracePeriodStartedAt = (organization as any).grace_period_started_at || organization.updated_at
    if ((organization.payment_status === 'suspended' || (organization.payment_status as any) === 'past_due') && gracePeriodStartedAt) {
      const gracePeriodStart = new Date(gracePeriodStartedAt).getTime()
      const now = Date.now()
      const elapsed = now - gracePeriodStart
      const remaining = GRACE_PERIOD_DURATION_MS - elapsed
      
      if (remaining > 0) {
        const daysRemaining = Math.ceil(remaining / (24 * 60 * 60 * 1000))
        setGracePeriodDaysRemaining(daysRemaining)
      } else {
        setGracePeriodDaysRemaining(0)
      }
    } else {
      setGracePeriodDaysRemaining(null)
    }
  }, [organization.payment_status, organization.updated_at])

  const accessStatus = getPaymentAccessStatus(organization)

  // Don't show banner for active accounts
  if (accessStatus === 'active') {
    return null
  }

  // Grace period banner
  if (accessStatus === 'grace_period') {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4" role="alert" aria-live="polite">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Payment Failed - Action Required
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Your payment could not be processed. You have{' '}
                <strong>{gracePeriodDaysRemaining !== null ? gracePeriodDaysRemaining : GRACE_PERIOD_DAYS}</strong>{' '}
                {gracePeriodDaysRemaining === 1 ? 'day' : 'days'} remaining to update your payment method
                before your account is suspended.
              </p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push('/payment')}
                data-testid="grace-period-retry-payment-button"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-500 transition-colors font-semibold"
              >
                Retry Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Suspended banner
  if (accessStatus === 'suspended') {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4" role="alert" aria-live="polite">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Account Suspended - Payment Required
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                Your account has been suspended due to payment failure. Please update your payment method
                to reactivate your account and regain access to all features.
              </p>
            </div>
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex">
                <Link
                  href="/payment?suspended=true"
                  className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                  Update Payment Method
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Pending payment banner
  if (accessStatus === 'pending_payment') {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4" role="alert" aria-live="polite">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              Payment Required
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Please complete payment to access the dashboard and all platform features.
              </p>
            </div>
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex">
                <Link
                  href="/payment"
                  className="bg-blue-50 px-2 py-1.5 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-600"
                >
                  Complete Payment
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

