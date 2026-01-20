'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import styles from './login.module.css'

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <div className={styles.page}>
      <div className={styles.layout}>
        
        {/* LEFT — LOGIN CARD */}
        <div className={styles.left}>
          <section className="order-1 lg:order-2 relative font-lato">
            <div className="group relative w-full h-full">
              
              {/* Rotating brand blur background */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="pointer-events-none absolute -inset-10 rounded-full bg-gradient-to-r from-transparent via-[#217CEB]/25 to-transparent blur-xl opacity-60 animate-spin [animation-duration:10s]" />
                <div className="pointer-events-none absolute -inset-20 rounded-full bg-gradient-to-r from-transparent via-[#4A42CC]/20 to-transparent blur-2xl opacity-40 animate-spin [animation-duration:18s] [animation-direction:reverse]" />
              </div>

              {/* Border gradient */}
              <div className="absolute inset-0 rounded-2xl p-px bg-gradient-to-b from-[#217CEB]/40 via-[#4A42CC]/50 to-neutral-900/60" />

              {/* Card */}
              <div
                className="relative h-full overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-inner transition-all duration-300 hover:-translate-y-0.5 hover:ring-[#217CEB]/40 hover:shadow-[0_10px_40px_-10px_rgba(33,124,235,0.35)]"
                style={{
                  backgroundColor: '#0B1220',
                  backgroundImage: `
                    radial-gradient(at 90% 40%, rgba(74,66,204,0.25), transparent 70%),
                    radial-gradient(at 10% 80%, rgba(33,124,235,0.2), transparent 70%)
                  `
                }}
              >
                <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col h-full">

                  {/* Header */}
                  <div className="mb-8">
                    {/* Brand Logo */}
                    <img
                      src="/infin8content-logo.png"
                      alt="Infin8Content"
                      className={styles.brandLogo}
                    />

                    <div className="flex items-center gap-2 text-xs text-neutral-400 mb-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#217CEB]" />
                      <span>Secure area</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-poppins">
                      Sign in
                    </h2>

                    <p className="text-sm text-neutral-400 mt-2">
                      Use your email and password, or continue with a provider.
                    </p>
                  </div>

                  {/* EXISTING LOGIN FORM - UNCHANGED LOGIC */}
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
                        Email
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
                        placeholder="you@example.com"
                      />
                      {errors.email && (
                        <p id="email-error" className={styles.error}>
                          <span aria-hidden="true">⚠</span> {errors.email}
                        </p>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="password" className={styles.label}>
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          data-testid="password-input"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onBlur={() => validatePassword(password)}
                          className={`${styles.input} pr-10`}
                          required
                          aria-invalid={errors.password ? 'true' : 'false'}
                          aria-describedby={errors.password ? 'password-error' : undefined}
                          placeholder="••••••••"
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

                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="accent-[#217CEB]" />
                        Remember me
                      </label>
                      <Link href="/forgot-password" className="hover:text-white underline-offset-4 hover:underline">
                        Trouble signing in?
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
                        'Sign in'
                      )}
                    </button>

                    {/* Divider */}
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-transparent px-2 text-[10px] uppercase tracking-wide text-neutral-500">
                          or
                        </span>
                      </div>
                    </div>

                    {/* Provider */}
                    <button
                      type="button"
                      className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-200 bg-white/5 ring-1 ring-white/15 hover:bg-white/10 hover:ring-[#217CEB]/40 transition"
                    >
                      Continue with GitHub
                    </button>
                  </form>

                  {/* Footer */}
                  <div className="mt-8 text-xs text-neutral-500">
                    <div className="flex items-center justify-between">
                      <p>
                        Don't have an account?{' '}
                        <Link href="/register" className="text-white hover:underline underline-offset-4">
                          Sign up
                        </Link>
                      </p>
                      <div className="flex items-center gap-3">
                        <a href="#" className="hover:text-white">Terms</a>
                        <span>•</span>
                        <a href="#" className="hover:text-white">Privacy</a>
                      </div>
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
                  <div
                    key={i}
                    className={styles.avatar}
                  >
                    {i}
                  </div>
                ))}
              </div>
              <div>
                <div className={styles.stars}>
                  ★★★★★
                </div>
                <p className={styles.trusted}>
                  Trusted by 20,000+ marketers & agencies
                </p>
              </div>
            </div>

            {/* Quote */}
            <blockquote className={styles.quote}>
              "We manage SEO for dozens of clients.  
              When we saw Infin8Content, it was obvious —  
              this is built for scale."
            </blockquote>

            {/* Author */}
            <div className={styles.author}>
              <div className={styles.authorAvatar} />
              <div>
                <p className={styles.authorName}>
                  Elliot Dean
                </p>
                <p className={styles.authorRole}>
                  Agency Owner, Performance Marketing
                </p>
              </div>
            </div>

            {/* Logos */}
            <div>
              <p className="text-sm text-neutral-500 mb-4">
                Used by leading content teams and agencies
              </p>
              <div className={styles.logos}>
                <span>Scale</span>
                <span>Growth</span>
                <span>Trust</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <div className={styles.layout}>
          <div className={styles.left}>
            <div className="w-full h-96 bg-neutral-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}

