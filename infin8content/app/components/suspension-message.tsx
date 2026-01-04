'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface SuspensionMessageProps {
  redirectTo?: string
  suspendedAt?: string | null
  gracePeriodStartedAt?: string | null
}

/**
 * Suspension Message Component
 * Displays account suspension message with payment retry option
 * Story 1.9: Account Suspension and Reactivation Workflow
 */
export default function SuspensionMessage({ 
  redirectTo = '/dashboard',
  suspendedAt,
  gracePeriodStartedAt
}: SuspensionMessageProps) {
  const searchParams = useSearchParams()
  const redirectParam = searchParams?.get('redirect') || redirectTo
  
  // Build payment URL with redirect parameter for post-reactivation redirect
  const paymentUrl = `/payment?suspended=true${redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : ''}`
  
  // Format suspension date if available
  const formattedSuspensionDate = suspendedAt 
    ? new Date(suspendedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null
  
  // Calculate grace period info if available
  let gracePeriodInfo: { daysRemaining: number | null; formattedStartDate: string | null } = {
    daysRemaining: null,
    formattedStartDate: null,
  }
  
  if (gracePeriodStartedAt) {
    const gracePeriodStart = new Date(gracePeriodStartedAt).getTime()
    const now = Date.now()
    const gracePeriodDurationMs = 7 * 24 * 60 * 60 * 1000 // 7 days
    const elapsed = now - gracePeriodStart
    const remaining = gracePeriodDurationMs - elapsed
    
    if (remaining > 0) {
      gracePeriodInfo.daysRemaining = Math.ceil(remaining / (24 * 60 * 60 * 1000))
    }
    gracePeriodInfo.formattedStartDate = new Date(gracePeriodStartedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8" role="alert" aria-live="polite">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="suspension-page-title">
              Account Suspended
            </h1>
            
            {/* Message */}
            <div className="text-left mt-6 space-y-4">
              <p className="text-gray-700">
                Your account has been suspended due to payment failure after the grace period expired.
              </p>
              
              {formattedSuspensionDate && (
                <p className="text-gray-700">
                  <strong>Suspended on:</strong> {formattedSuspensionDate}
                </p>
              )}
              
              {gracePeriodInfo.formattedStartDate && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <p className="text-sm text-blue-700">
                    <strong>Grace Period Information:</strong> Your grace period started on {gracePeriodInfo.formattedStartDate}.
                    {gracePeriodInfo.daysRemaining !== null && gracePeriodInfo.daysRemaining > 0 && (
                      <> You had {gracePeriodInfo.daysRemaining} {gracePeriodInfo.daysRemaining === 1 ? 'day' : 'days'} remaining when the grace period expired.</>
                    )}
                  </p>
                </div>
              )}
              
              <p className="text-gray-700">
                To reactivate your account and regain access to all features, please update your payment method.
              </p>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                <p className="text-sm text-yellow-700">
                  <strong>Note:</strong> Once payment is confirmed, your account will be automatically reactivated and all your data and settings will be restored.
                </p>
              </div>
            </div>
            
            {/* Action Button */}
            <div className="mt-8">
              <Link
                href={paymentUrl}
                data-testid="retry-payment-button"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                aria-label="Retry payment to reactivate account"
              >
                Retry Payment
              </Link>
            </div>
            
            {/* Help Text */}
            <p className="mt-6 text-sm text-gray-500">
              Need help? Contact our support team for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

