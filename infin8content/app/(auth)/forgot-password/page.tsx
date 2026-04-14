'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from '../login/login.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setSuccess(true)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.left}>
          <section className="order-1 lg:order-2 relative font-lato">
            <div className="group relative w-full h-full">
              {/* Rotating brand blur background */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="pointer-events-none absolute -inset-10 rounded-full bg-linear-to-r from-transparent via-[#217CEB]/25 to-transparent blur-xl opacity-60 animate-spin [animation-duration:10s]" />
                <div className="pointer-events-none absolute -inset-20 rounded-full bg-linear-to-r from-transparent via-[#4A42CC]/20 to-transparent blur-2xl opacity-40 animate-spin [animation-duration:18s] [animation-direction:reverse]" />
              </div>

              {/* Border gradient */}
              <div className="absolute inset-0 rounded-2xl p-px bg-linear-to-b from-[#217CEB]/40 via-[#4A42CC]/50 to-neutral-900/60" />

              {/* Card */}
              <div
                className={`${styles.loginCard} ${styles.authCard} relative h-full overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-inner transition-all duration-300 hover:-translate-y-0.5 hover:ring-[#217CEB]/40 hover:shadow-[0_10px_40px_-10px_rgba(33,124,235,0.35)]`}
              >
                <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col h-full">
                  {/* Header */}
                  <div className="mb-8">
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
                      Reset password
                    </h2>
                    <p className="text-sm text-neutral-400 mt-2">
                      Enter your email and we&apos;ll send you a reset link.
                    </p>
                  </div>

                  {success ? (
                    <div className={styles.formSuccess} role="status" aria-live="polite">
                      <span aria-hidden="true">✓</span> Check your email — a reset link is on its way.
                    </div>
                  ) : (
                    <>
                      {error && (
                        <div className={styles.formError} role="alert" aria-live="polite">
                          <span aria-hidden="true">⚠</span> {error}
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                          <label htmlFor="email" className={styles.label}>
                            Email
                          </label>
                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                            required
                            placeholder="you@example.com"
                            autoComplete="email"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={styles.submitButton}
                        >
                          {isSubmitting ? 'Sending...' : 'Send reset link'}
                        </button>
                      </form>
                    </>
                  )}

                  <p className="mt-6 text-center text-sm text-neutral-400">
                    <Link href="/login" className={styles.link}>
                      ← Back to sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
