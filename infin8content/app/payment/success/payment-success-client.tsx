'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface PaymentSuccessClientProps {
  status: 'active' | 'pending' | 'processing'
  plan?: string
  redirectTo?: string
  isReactivation?: boolean
}

export default function PaymentSuccessClient({
  status,
  plan,
  redirectTo = '/dashboard',
  isReactivation = false,
}: PaymentSuccessClientProps) {
  useEffect(() => {
    if (status === 'active') {
      const timer = setTimeout(() => {
        window.location.href = redirectTo
      }, 3000)
      return () => clearTimeout(timer)
    } else if (status === 'pending') {
      const timer = setTimeout(() => {
        window.location.reload()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [status, redirectTo])

  if (status === 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isReactivation ? 'Account Reactivated!' : 'Payment Confirmed!'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isReactivation ? (
              <>
                Payment successful! Your account is being reactivated and all your data and settings have been restored. You can now access all features of your{' '}
                <span className="font-semibold capitalize">{plan || 'selected'}</span>{' '}
                plan.
              </>
            ) : (
              <>
                Your account is now active. You can start using all features of your{' '}
                <span className="font-semibold capitalize">{plan || 'selected'}</span>{' '}
                plan.
              </>
            )}
          </p>
          <div className="space-y-3">
            <Link
              href={redirectTo}
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              {redirectTo === '/dashboard' ? 'Go to Dashboard' : 'Continue'}
            </Link>
            <p className="text-sm text-gray-500">
              Redirecting automatically in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg
                className="h-6 w-6 text-blue-600 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Received
          </h1>
          <p className="text-gray-600 mb-6">
            Your payment has been received. We're activating your account now.
            This usually takes just a few seconds.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Status
            </button>
            <p className="text-sm text-gray-500">
              Page will auto-refresh every 3 seconds...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Processing/fallback state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Processing Payment
        </h1>
        <p className="text-gray-600 mb-6">
          Payment received. Your account is being activated. Please refresh in a
          moment.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  )
}

