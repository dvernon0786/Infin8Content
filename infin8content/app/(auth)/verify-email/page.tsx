'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const verified = searchParams.get('verified')
  const error = searchParams.get('error')

  if (error === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <h1 className="text-2xl font-bold text-center">Verification Failed</h1>
          <p className="text-center text-gray-600">
            The verification link is invalid or has expired. Please request a new verification email.
          </p>
          <Link
            href="/login"
            className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (verified === 'true') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <h1 className="text-2xl font-bold text-center">Email Verified</h1>
          <p className="text-center text-gray-600">
            Your email has been successfully verified. You can now access your account.
          </p>
          <Link
            href="/"
            className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">Check Your Email</h1>
        <p className="text-center text-gray-600">
          We've sent a verification link to your email address. Please click the link in the email to verify your account.
        </p>
        <p className="text-center text-sm text-gray-500">
          Didn't receive the email? Check your spam folder or{' '}
          <Link href="/register" className="text-blue-600 hover:text-blue-500">
            try registering again
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <h1 className="text-2xl font-bold text-center">Loading...</h1>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

