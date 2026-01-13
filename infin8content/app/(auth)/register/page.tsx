'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import styles from './register.module.css'

function RegisterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitationToken = searchParams.get('invitation_token')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // If invitation token exists, store it in localStorage
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
    if (password.length < 8) {
      setErrors((prev) => ({ ...prev, password: 'Password must be at least 8 characters' }))
      return false
    }
    setErrors((prev) => ({ ...prev, password: undefined }))
    return true
  }

  const validateConfirmPassword = (confirmPassword: string) => {
    if (confirmPassword !== password) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }))
      return false
    }
    setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email) || !validatePassword(password) || !validateConfirmPassword(confirmPassword)) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ email: data.error || 'Registration failed' })
        return
      }

      // Redirect to OTP verification page with email and invitation token if present
      const redirectUrl = invitationToken
        ? `/verify-email?email=${encodeURIComponent(email)}&invitation_token=${invitationToken}`
        : `/verify-email?email=${encodeURIComponent(email)}`
      router.push(redirectUrl)
    } catch (error) {
      setErrors({ email: 'An error occurred. Please try again.' })
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
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>
            Join Infin8Content and start creating AI-powered content
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address *
            </label>
            <input
              id="email"
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => validatePassword(password)}
              className={styles.input}
              required
              minLength={8}
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error' : undefined}
              placeholder="Create a strong password"
            />
            {errors.password && (
              <p id="password-error" className={styles.error}>
                <span aria-hidden="true">⚠</span> {errors.password}
              </p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => validateConfirmPassword(confirmPassword)}
              className={styles.input}
              required
              aria-invalid={errors.confirmPassword ? 'true' : 'false'}
              aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className={styles.error}>
                <span aria-hidden="true">⚠</span> {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.button}
          >
            {isSubmitting ? (
              <>
                <div className={styles.spinner}></div>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Already have an account?{' '}
            <Link href="/login" className={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Loading...</h1>
        </div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  )
}

