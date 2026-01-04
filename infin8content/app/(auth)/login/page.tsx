'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitationToken = searchParams.get('invitation_token')
  
  // Check for expired session message
  useEffect(() => {
    const expired = searchParams.get('expired')
    if (expired === 'true') {
      setErrors((prev) => ({
        ...prev,
        form: 'Your session has expired. Please log in again.',
      }))
    }
  }, [searchParams])
  
  // Store invitation token in localStorage if present
  useEffect(() => {
    if (invitationToken) {
      localStorage.setItem('invitation_token', invitationToken)
    }
  }, [invitationToken])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }))
      return false
    }
    setErrors((prev) => ({ ...prev, email: undefined }))
    return true
  }

  const validatePassword = (password: string) => {
    if (!password || password.length === 0) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }))
      return false
    }
    setErrors((prev) => ({ ...prev, password: undefined }))
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear form-level errors
    setErrors({})
    
    if (!validateEmail(email) || !validatePassword(password)) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle redirect for email verification
        if (data.redirectTo) {
          router.push(data.redirectTo)
          return
        }
        // Display error message
        setErrors({ form: data.error || 'Login failed. Please try again.' })
        return
      }

      // If invitation token exists, redirect to accept invitation page
      // Otherwise redirect based on payment status
      const storedToken = invitationToken || localStorage.getItem('invitation_token')
      if (storedToken) {
        localStorage.removeItem('invitation_token')
        router.push(`/accept-invitation?token=${storedToken}`)
      } else if (data.redirectTo) {
        router.push(data.redirectTo)
      } else {
        // Default redirect to dashboard
        router.push('/dashboard')
      }
    } catch (error) {
      setErrors({ form: 'An error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center text-gray-900">Sign In</h1>
        
        {errors.form && (
          <div
            className="mt-1 text-sm flex items-center gap-1 text-red-600 bg-red-50 p-3 rounded-md border border-red-200"
            role="alert"
            aria-live="polite"
          >
            <span aria-hidden="true">⚠</span> {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900">
              Email Address *
            </label>
            <input
              id="email"
              data-testid="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => validateEmail(email)}
              className="mt-1 block w-full px-3 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm flex items-center gap-1 text-red-600">
                <span aria-hidden="true">⚠</span> {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-900">
              Password *
            </label>
            <input
              id="password"
              data-testid="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => validatePassword(password)}
              className="mt-1 block w-full px-3 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <p id="password-error" className="mt-1 text-sm flex items-center gap-1 text-red-600">
                <span aria-hidden="true">⚠</span> {errors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/forgot-password" className="text-blue-600 hover:text-blue-500">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            data-testid="login-button"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 h-10 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:text-blue-500">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <h1 className="text-2xl font-bold text-center">Loading...</h1>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}

