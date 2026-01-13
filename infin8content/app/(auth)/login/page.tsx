'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from './login.module.css'

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
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoText}>IC</span>
          </div>
          <h1 className={styles.title}>Sign In</h1>
          <p className={styles.subtitle}>
            Welcome back to Infin8Content
          </p>
        </div>
        
        {errors.form && (
          <div
            className={styles.formError}
            role="alert"
            aria-live="polite"
          >
            <span aria-hidden="true">⚠</span> {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address *
            </label>
            <input
              id="email"
              data-testid="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => validateEmail(email)}
              className={styles.input}
              required
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p id="email-error" className={styles.error}>
                <span aria-hidden="true">⚠</span> {errors.email}
              </p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password *
            </label>
            <input
              id="password"
              data-testid="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => validatePassword(password)}
              className={styles.input}
              required
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error' : undefined}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p id="password-error" className={styles.error}>
                <span aria-hidden="true">⚠</span> {errors.password}
              </p>
            )}
          </div>

          <div className={styles.forgotPassword}>
            <Link href="/forgot-password" className={styles.forgotPasswordLink}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            data-testid="login-button"
            disabled={isSubmitting}
            className={styles.button}
          >
            {isSubmitting ? (
              <>
                <div className={styles.spinner}></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className={styles.link}>
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Loading...</h1>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}

