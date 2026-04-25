'use client';

/**
 * app/(auth)/forgot-password/page.tsx
 *
 * Layout system : MarketingShell (wrapper) + scoped <style> injection
 * Token source  : --bg / --accent / --surface / etc. (same as register & ai-content-writer)
 * Auth logic    : unchanged — same fetch, success state, redirects.
 */

import { useState } from 'react';
import Link from 'next/link';
import MarketingShell from '@/components/MarketingShell';

// ─────────────────────────────────────────────────────────────────────────────
// CSS — scoped, tokenised (same set as register page)
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
}
.auth-card {
  position: relative; z-index: 1;
  width: 100%; max-width: 420px;
  background: var(--surface);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 20px;
  padding: 40px 36px;
  box-shadow: 0 24px 64px rgba(0,0,0,.5);
}
.auth-logo {
  display: flex; justify-content: center; margin-bottom: 28px;
}
.auth-logo img { height: 28px; width: auto; display: block; }
.auth-heading {
  font-family: var(--font-display);
  font-size: 22px; font-weight: 700; letter-spacing: -.5px;
  color: var(--white); text-align: center; margin-bottom: 6px;
}
.auth-sub {
  font-size: 14px; color: var(--muted);
  text-align: center; margin-bottom: 28px; line-height: 1.55;
}
.auth-field { margin-bottom: 16px; }
.auth-label {
  display: block; font-size: 13px; font-weight: 500;
  color: var(--text); margin-bottom: 6px;
}
.auth-input-wrap { position: relative; }
.auth-input {
  width: 100%; background: var(--surface2);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 10px; padding: 11px 14px;
  font-size: 14px; color: var(--text);
  font-family: var(--font-body); outline: none;
  box-sizing: border-box; transition: border-color .2s;
}
.auth-input:focus { border-color: rgba(79,110,247,.6); }
.auth-input.pr { padding-right: 52px; }
.auth-show-btn {
  position: absolute; right: 12px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none;
  font-size: 12px; font-weight: 600;
  color: var(--muted); cursor: pointer; padding: 0;
  transition: color .2s; font-family: var(--font-body);
}
.auth-show-btn:hover { color: var(--white); }
.auth-error {
  font-size: 13px; color: #f87171;
  background: rgba(239,68,68,.1);
  border: 1px solid rgba(239,68,68,.2);
  border-radius: 8px; padding: 10px 14px;
  margin-bottom: 16px; line-height: 1.5;
}
.auth-success {
  font-size: 13px; color: var(--green);
  background: rgba(34,197,94,.1);
  border: 1px solid rgba(34,197,94,.2);
  border-radius: 8px; padding: 10px 14px;
  margin-bottom: 16px; line-height: 1.5;
}
.auth-submit {
  display: flex; align-items: center; justify-content: center;
  width: 100%; padding: 13px; margin-top: 8px;
  border-radius: 10px; border: none; cursor: pointer;
  font-family: var(--font-display); font-size: 15px; font-weight: 600;
  color: var(--white);
  background: linear-gradient(to right, #217CEB, #4A42CC);
  box-shadow: 0 0 24px rgba(79,110,247,.35);
  transition: all .2s;
}
.auth-submit:hover:not(:disabled) {
  opacity: .9;
  box-shadow: 0 0 32px rgba(79,110,247,.5);
  transform: translateY(-1px);
}
.auth-submit:disabled { opacity: .5; cursor: not-allowed; }
.auth-switch {
  text-align: center; font-size: 13.5px;
  color: var(--muted); margin-top: 20px;
}
.auth-switch-link {
  color: var(--accent); font-weight: 600;
  text-decoration: none; transition: color .2s;
}
.auth-switch-link:hover { color: #3d5df5; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email.');
      return;
    }

    setSubmitting(true);
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? 'Request failed.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Unexpected error. Please try again.');
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

          <h1 className="auth-heading">Reset password</h1>
          <p className="auth-sub">Enter your email and we'll send you a reset link.</p>

          {success && (
            <p className="auth-success">
              ✓ Check your email — a reset link is on its way.
            </p>
          )}

          {error && <p className="auth-error">{error}</p>}

          {!success && (
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

              <button type="submit" className="auth-submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}

          <p className="auth-switch">
            <Link href="/login" className="auth-switch-link">← Back to sign in</Link>
          </p>

        </div>
      </div>
    </MarketingShell>
  );
}
