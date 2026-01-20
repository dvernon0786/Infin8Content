'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import styles from './register.module.css'

function RegisterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitationToken = searchParams.get('invitation_token')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
    <div className={styles.page}>
      <div className={styles.layout}>
        
        {/* LEFT — SIGNUP CARD */}
        <div className={styles.left}>
          <div className={styles.signupCardWrapper}>
            <div className={styles.container}>
              <div className={styles.card} style={{
                backgroundColor: '#0B1220 !important',
                backgroundImage: 'radial-gradient(at 90% 40%, rgba(74,66,204,0.25), transparent 70%), radial-gradient(at 10% 80%, rgba(33,124,235,0.2), transparent 70%) !important',
                borderRadius: '15px !important',
                border: '1px solid rgba(255, 255, 255, 0.1) !important',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3) !important'
              }}>
                <div className={styles.header} style={{ textAlign: 'left' as any }}>
                  {/* Brand Logo */}
                  <img
                    src="/infin8content-logo.png"
                    alt="Infin8Content"
                    className={styles.brandLogo}
                  />

                  {/* Secure Area Indicator */}
                  <div className={styles.secure}>
                    <span className={styles.dot} />
                    <span>Secure area</span>
                  </div>

                  {/* Existing logo - Hidden */}
                  <div className={styles.logo} style={{ display: 'none' }}>
                    <span className={styles.logoText}>IC</span>
                  </div>
                  
                  <h1 className={styles.title} style={{ color: 'white !important', fontFamily: 'var(--font-poppins) !important' }}>Create Account</h1>
                  <p className={styles.subtitle} style={{ color: '#A3A3A3 !important' }}>
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
              style={{
                backgroundColor: 'rgba(255,255,255,0.08) !important',
                color: '#ffffff !important',
                border: '1px solid rgba(255, 255, 255, 0.2) !important'
              }}
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
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => validatePassword(password)}
                className={`${styles.input} pr-10`}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08) !important',
                  color: '#ffffff !important',
                  border: '1px solid rgba(255, 255, 255, 0.2) !important'
                }}
                required
                minLength={8}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
                placeholder="Create a strong password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#217CEB] cursor-pointer p-1"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
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
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => validateConfirmPassword(confirmPassword)}
                className={`${styles.input} pr-10`}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08) !important',
                  color: '#ffffff !important',
                  border: '1px solid rgba(255, 255, 255, 0.2) !important'
                }}
                required
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#217CEB] cursor-pointer p-1"
                aria-label="Toggle confirm password visibility"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
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
          <p className={styles.footerText} style={{ color: '#737373 !important' }}>
            Already have an account?{' '}
            <Link href="/login" className={styles.link} style={{ color: '#217CEB !important' }}>
              Sign in
            </Link>
          </p>
        </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — TRUST / SOCIAL PROOF */}
        <div className={styles.right}>
          <div className={styles.proof}>
            
            {/* Rating + avatars */}
            <div className={styles.rating}>
              <div className={styles.avatars}>
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className={styles.avatar}>
                    {i}
                  </div>
                ))}
              </div>
              <div>
                <div className={styles.stars}>★★★★★</div>
                <p className={styles.trusted}>Join 20,000+ marketers & agencies</p>
              </div>
            </div>

            {/* Quote */}
            <blockquote className={styles.quote}>
              "Teams choose Infin8Content to scale content without losing control.  
              The AI quality is exceptional, and the ROI is immediate."
            </blockquote>

            {/* Author */}
            <div className={styles.author}>
              <div className={styles.authorAvatar} />
              <div>
                <p className={styles.authorName}>Sarah Chen</p>
                <p className={styles.authorRole}>Content Director, Tech Startup</p>
              </div>
            </div>

            {/* Benefits */}
            <div>
              <p className="text-sm text-neutral-500 mb-4">Why teams choose Infin8Content</p>
              <div className={styles.logos}>
                <span>Quality</span>
                <span>Speed</span>
                <span>Scale</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <div className={styles.layout}>
          <div className={styles.left}>
            <div className={styles.signupCardWrapper}>
              <div className={styles.container}>
                <div className={styles.card}>
                  <h1 className={styles.title}>Loading...</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  )
}

