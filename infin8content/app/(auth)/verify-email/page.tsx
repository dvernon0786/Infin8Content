'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function VerifyOTPContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [invitationToken, setInvitationToken] = useState<string | null>(null)
  
  // Get invitation token from localStorage only on client side
  React.useEffect(() => {
    const token = searchParams.get('invitation_token') || localStorage.getItem('invitation_token')
    setInvitationToken(token)
  }, [searchParams])
  
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
      const redirectUrl = invitationToken
        ? `/accept-invitation?token=${invitationToken}` 
        : '/'
      setTimeout(() => {
        router.push(redirectUrl)
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '0 1rem' }}>
        <div style={{ width: '100%', maxWidth: '448px', padding: '2rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', color: '#111827', lineHeight: '1.2' }}>
              Email Verified
            </h1>
            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>
              Your email has been successfully verified. Redirecting to dashboard...
            </p>
            <Link
              href="/"
              style={{ display: 'block', width: '100%', textAlign: 'center', padding: '0.625rem 1rem', border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', color: 'white', backgroundColor: '#2563eb', textDecoration: 'none', transition: 'background-color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '0 1rem' }}>
      <div style={{ width: '100%', maxWidth: '448px', padding: '2rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', color: '#111827', lineHeight: '1.2' }}>
              Verify Your Email
            </h1>
            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>
              We've sent a 6-digit verification code to{' '}
              <span style={{ fontWeight: '500', color: '#111827', wordBreak: 'break-all' }}>
                {email || 'your email address'}
              </span>
              . Please enter it below.
            </p>
          </div>
          
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label 
                htmlFor="otp" 
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#111827', marginBottom: '0.5rem' }}
              >
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
                style={{ 
                  display: 'block',
                  width: '100%',
                  padding: '0.75rem',
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  letterSpacing: '0.25em',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563eb'
                  e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                  e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
                placeholder="000000"
                required
                autoComplete="one-time-code"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'otp-error' : undefined}
              />
              {error && (
                <p id="otp-error" style={{ marginTop: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#dc2626' }}>
                  <span aria-hidden="true">⚠</span> 
                  <span>{error}</span>
                </p>
              )}
              {successMessage && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#16a34a' }}>
                  <span aria-hidden="true">✓</span> 
                  <span>{successMessage}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying || otpCode.length !== 6}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '100%', 
                padding: '0.625rem 1rem', 
                minHeight: '44px',
                border: 'none', 
                borderRadius: '0.375rem', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: 'white', 
                backgroundColor: isVerifying || otpCode.length !== 6 ? '#9ca3af' : '#2563eb',
                cursor: isVerifying || otpCode.length !== 6 ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                if (!isVerifying && otpCode.length === 6) {
                  e.currentTarget.style.backgroundColor = '#1d4ed8'
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = isVerifying || otpCode.length !== 6 ? '#9ca3af' : '#2563eb'
              }}
            >
              {isVerifying ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite', marginRight: '0.5rem', height: '1rem', width: '1rem' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                style={{ 
                  fontSize: '0.875rem', 
                  color: isResending ? '#9ca3af' : '#2563eb', 
                  cursor: isResending ? 'not-allowed' : 'pointer',
                  background: 'none',
                  border: 'none',
                  textDecoration: 'underline'
                }}
                onMouseOver={(e) => {
                  if (!isResending) {
                    e.currentTarget.style.color = '#1d4ed8'
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = isResending ? '#9ca3af' : '#2563eb'
                }}
              >
                {isResending ? (
                  <>
                    <svg style={{ animation: 'spin 1s linear infinite', marginRight: '0.5rem', height: '0.75rem', width: '0.75rem', verticalAlign: 'middle' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  "Didn't receive the code? Resend"
                )}
              </button>
            </div>

            <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
              <Link 
                href="/register" 
                style={{ color: '#2563eb', textDecoration: 'underline' }}
              >
                ← Back to Registration
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '0 1rem' }}>
        <div style={{ 
          width: '100%', 
          maxWidth: '448px', 
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <svg style={{ animation: 'spin 1s linear infinite', height: '2rem', width: '2rem', color: '#2563eb' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', color: '#111827' }}>Loading...</h1>
        </div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  )
}

