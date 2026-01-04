'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function VerifyOTPContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const invitationToken = searchParams.get('invitation_token') || localStorage.getItem('invitation_token')
  
  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Email address is required')
      return
    }
    
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Verification failed')
        return
      }

      setSuccess(true)
      // If invitation token exists, redirect to accept invitation page
      // Otherwise redirect to dashboard
      const redirectUrl = invitationToken
        ? `/accept-invitation?token=${invitationToken}`
        : '/'
      setTimeout(() => {
        router.push(redirectUrl)
        // Clear invitation token from localStorage
        if (invitationToken) {
          localStorage.removeItem('invitation_token')
        }
      }, 2000)
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      setError('Email address is required')
      return
    }

    setIsResending(true)
    setError('')

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to resend code')
        setSuccessMessage('')
        return
      }

      setError('')
      setSuccessMessage(data.message || 'Verification code has been sent to your email.')
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 5000)
    } catch (error) {
      setError('Failed to resend code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <h1 className="text-2xl font-bold text-center text-gray-900">Email Verified</h1>
          <p className="text-center text-gray-600">
            Your email has been successfully verified. Redirecting to dashboard...
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
        <h1 className="text-2xl font-bold text-center text-gray-900">Verify Your Email</h1>
        <p className="text-center text-gray-600">
          We've sent a 6-digit verification code to {email || 'your email address'}. Please enter it below.
        </p>
        
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-900">
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otpCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setOtpCode(value)
                setError('')
              }}
              className="mt-1 block w-full px-3 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="000000"
              required
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'otp-error' : undefined}
            />
            {error && (
              <p id="otp-error" className="mt-1 text-sm flex items-center gap-1 text-red-600">
                <span aria-hidden="true">⚠</span> {error}
              </p>
            )}
            {successMessage && (
              <p className="mt-1 text-sm flex items-center gap-1 text-green-600">
                <span aria-hidden="true">✓</span> {successMessage}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isVerifying || otpCode.length !== 6}
            className="w-full flex justify-center py-2.5 px-4 h-10 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isVerifying ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
          >
            {isResending ? 'Sending...' : "Didn't receive the code? Resend"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          <Link href="/register" className="text-blue-600 hover:text-blue-500">
            Back to Registration
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <h1 className="text-2xl font-bold text-center">Loading...</h1>
        </div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  )
}

