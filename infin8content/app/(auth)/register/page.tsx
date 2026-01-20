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
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; form?: string }>({})
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
        setErrors({ form: data.error || 'Registration failed' })
        return
      }

      // Redirect to OTP verification page with email and invitation token if present
      const redirectUrl = invitationToken
        ? `/verify-email?email=${encodeURIComponent(email)}&invitation_token=${invitationToken}`
        : `/verify-email?email=${encodeURIComponent(email)}`
      router.push(redirectUrl)
    } catch (error) {
      setErrors({ form: 'An error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>

        {/* LEFT — REGISTER CARD */}
        <div className={styles.left}>
          <section className="order-1 lg:order-2 relative font-lato">
            <div className="group relative w-full h-full">

              {/* Animated background blur */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="absolute -inset-10 bg-gradient-to-r from-transparent via-[#217CEB]/25 to-transparent blur-xl opacity-60 animate-spin [animation-duration:12s]" />
                <div className="absolute -inset-20 bg-gradient-to-r from-transparent via-[#4A42CC]/20 to-transparent blur-2xl opacity-40 animate-spin [animation-duration:20s] [animation-direction:reverse]" />
              </div>

              {/* Border */}
              <div className="absolute inset-0 rounded-2xl p-px bg-gradient-to-b from-[#217CEB]/40 via-[#4A42CC]/50 to-neutral-900/60" />

              {/* Card */}
              <div
                className={`${styles.loginCard} ${styles.authCard} relative h-full overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-inner transition-all duration-300 hover:-translate-y-0.5 hover:ring-[#217CEB]/40 hover:shadow-[0_10px_40px_-10px_rgba(33,124,235,0.35)]`}
              >
                <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col h-full">

                  {/* Header */}
                  <div className="mb-8">
                    <img src="/infin8content-logo.png" alt="Infin8Content" className={styles.brandLogo} />

                    <div className="flex items-center gap-2 text-xs text-neutral-400 mb-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#217CEB]" />
                      Secure area
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-poppins">
                      Create account
                    </h2>

                    <p className="text-sm text-neutral-400 mt-2">
                      Join Infin8Content and start creating AI-powered content.
                    </p>
                  </div>

                  {errors.form && (
                    <div className={styles.formError}>
                      ⚠ {errors.form}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className={styles.form}>

                    {/* Email */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Email</label>
                      <input
                        className={styles.input}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => validateEmail(email)}
                        placeholder="you@example.com"
                        aria-invalid={errors.email ? 'true' : 'false'}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                      {errors.email && <p className={styles.error}>⚠ {errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Password</label>
                      <div className="relative">
                        <input
                          className={`${styles.input} pr-10`}
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onBlur={() => validatePassword(password)}
                          placeholder="••••••••"
                          aria-invalid={errors.password ? 'true' : 'false'}
                          aria-describedby={errors.password ? 'password-error' : undefined}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#217CEB]"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.password && <p className={styles.error}>⚠ {errors.password}</p>}
                    </div>

                    {/* Confirm */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Confirm password</label>
                      <div className="relative">
                        <input
                          className={`${styles.input} ${styles.confirmPasswordInput} pr-10`}
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onBlur={() => validateConfirmPassword(confirmPassword)}
                          placeholder="••••••••"
                          aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                          aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#217CEB]"
                          aria-label="Toggle confirm password visibility"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className={styles.error}>⚠ {errors.confirmPassword}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={styles.button}
                    >
                      {isSubmitting ? (
                        <>
                          <div className={styles.spinner}></div>
                          Creating account…
                        </>
                      ) : (
                        'Create account'
                      )}
                    </button>

                  </form>

                  {/* Footer */}
                  <div className="mt-8 text-xs text-neutral-500 flex justify-between">
                    <p>
                      Already have an account?{' '}
                      <Link href="/login" className="text-white hover:underline">
                        Sign in
                      </Link>
                    </p>
                    <div className="flex gap-3">
                      <a href="#" className="hover:text-white">Terms</a>
                      <span>•</span>
                      <a href="#" className="hover:text-white">Privacy</a>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </section>
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
            <section className="order-1 lg:order-2 relative font-lato">
              <div className="group relative w-full h-full">
                <div className={`${styles.loginCard} ${styles.authCard} relative h-full overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-inner`}>
                  <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col h-full">
                    <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-poppins">
                      Loading...
                    </h2>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  )
}

