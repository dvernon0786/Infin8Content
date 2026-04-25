'use client';

/**
 * app/(auth)/register/page.tsx
 *
 * Layout system : MarketingShell (wrapper) + scoped <style> injection
 * Token source  : --bg / --accent / --surface / etc. (same as ai-content-writer)
 * Auth logic    : unchanged from original — same fetch, validation, redirects,
 *                 invitation token handling.
 */

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MarketingShell from '@/components/MarketingShell';

// ─────────────────────────────────────────────────────────────────────────────
// CSS — identical token names to /ai-content-writer
// ─────────────────────────────────────────────────────────────────────────────
const css = `
.auth-wrap {
  min-height: calc(100dvh - 62px);
  display: flex; align-items: center; justify-content: center;
  padding: 48px 24px;
  position: relative; overflow: hidden;
}
.auth-wrap::before {
  content: '';
  position: absolute; top: -120px; left: 50%;
  transform: translateX(-50%);
  width: 600px; height: 500px;
  background: radial-gradient(circle, rgba(79,110,247,.18) 0%, transparent 70%);
  pointer-events: none;
"use client";

/**
 * app/(auth)/register/page.tsx
 *
 * Self-contained register page (MarketingShell wrapper + scoped <style>).
 * Auth logic maintained: fetch/validation/redirects and invitation token handling.
 */

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MarketingShell from "@/components/MarketingShell";

const css = `
.auth-wrap {
  min-height: calc(100dvh - 62px);
  display: flex; align-items: center; justify-content: center;
  padding: 48px 24px;
  position: relative; overflow: hidden;
}
.auth-card {
  position: relative; z-index: 1;
  width: 100%; max-width: 420px;
  background: var(--surface);
  border-radius: 20px;
  padding: 40px 36px;
}
.auth-logo { display:flex; justify-content:center; margin-bottom:28px; }
.auth-heading { font-family: var(--font-display); font-size:22px; font-weight:700; color:var(--white); text-align:center; margin-bottom:6px; }
.auth-sub { font-size:14px; color:var(--muted); text-align:center; margin-bottom:28px; }
.auth-field { margin-bottom:16px; }
.auth-label { display:block; font-size:13px; color:var(--text); margin-bottom:6px; }
.auth-input { width:100%; padding:11px 14px; border-radius:10px; box-sizing:border-box; }
.auth-input.pr { padding-right:52px; }
.auth-show-btn { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; }
.auth-submit { width:100%; padding:13px; border-radius:10px; border:none; cursor:pointer; color:var(--white); background:linear-gradient(to right,#217CEB,#4A42CC); }
`;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get("invitation_token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (confirm !== password) {
      setError("Passwords do not match.");
      return;
    }

    if (invitationToken) localStorage.setItem("invitation_token", invitationToken);

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data?.redirectTo) {
          router.push(data.redirectTo);
          return;
        }
        setError(data?.error ?? "Request failed.");
        return;
      }

      const nextUrl = invitationToken
        ? `/verify-email?email=${encodeURIComponent(email)}&invitation_token=${invitationToken}`
        : `/verify-email?email=${encodeURIComponent(email)}`;
      router.push(nextUrl);
    } catch (err) {
      setError("Unexpected error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MarketingShell>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/infin8content_logo.png" alt="Infin8Content" />
          </div>

          <h1 className="auth-heading">Start for free today</h1>
          <p className="auth-sub">$1 trial · Cancel anytime · No credit card required.</p>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={onSubmit} noValidate>

            <div className="auth-field">
              <label className="auth-label">Email address</label>
              <input
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap" style={{ position: 'relative' }}>
                <input
                  type={showPw ? "text" : "password"}
                  className="auth-input pr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button type="button" className="auth-show-btn" onClick={() => setShowPw((p) => !p)} aria-label="Toggle password visibility">
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Confirm password</label>
              <div className="auth-input-wrap" style={{ position: 'relative' }}>
                <input
                  type={showPw ? "text" : "password"}
                  className="auth-input pr"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button type="button" className="auth-show-btn" onClick={() => setShowPw((p) => !p)} aria-label="Toggle confirm password visibility">
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <a href="/login" className="auth-switch-link">Sign in</a>
          </p>

          <div className="auth-perks">
            <span className="auth-perk">$1 trial · 3 days</span>
            <span className="auth-perk">Cancel anytime</span>
            <span className="auth-perk">No credit card</span>
          </div>

        </div>
      </div>
    </MarketingShell>
  );
}
          <form onSubmit={onSubmit} noValidate>

            <div className="auth-field">
              <label className="auth-label">Email address</label>
              <input
                type="email"
                className="auth-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="auth-input pr"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button type="button" className="auth-show-btn" onClick={() => setShowPw(p => !p)}>
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Confirm password</label>
              <div className="auth-input-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="auth-input pr"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button type="button" className="auth-show-btn" onClick={() => setShowPw(p => !p)}>
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <a href="/login" className="auth-switch-link">Sign in</a>
          </p>

          <div className="auth-perks">
            <span className="auth-perk">$1 trial · 3 days</span>
            <span className="auth-perk">Cancel anytime</span>
            <span className="auth-perk">No credit card</span>
          </div>

        </div>
      </div>
    </MarketingShell>
  );
}
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

