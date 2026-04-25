 'use client';

/**
 * app/(auth)/login/page.tsx
 *
 * Layout system : MarketingShell (wrapper) + scoped <style> injection
 * Token source  : --bg / --accent / --surface / etc. (same as ai-content-writer)
 * Auth logic    : unchanged from original — same fetch, validation, redirects,
 *                 invitation token handling.
 */

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MarketingShell from '@/components/marketing/MarketingShell';

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
.auth-forgot {
  display: block; text-align: right;
  font-size: 12.5px; font-weight: 600; color: var(--accent);
  margin-top: 6px; text-decoration: none; transition: color .2s;
}
.auth-forgot:hover { color: #3d5df5; }
.auth-error {
  font-size: 13px; color: #f87171;
  background: rgba(239,68,68,.1);
  border: 1px solid rgba(239,68,68,.2);
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
// Inner Component (uses useSearchParams, must be wrapped in Suspense)
// ─────────────────────────────────────────────────────────────────────────────
function LoginPageInner() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const invitationToken = searchParams.get('invitation_token');

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email.');
      return;
    }
    if (!password.length) {
      setError('Password is required.');
      return;
    }

    if (invitationToken) localStorage.setItem('invitation_token', invitationToken);

    setSubmitting(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data?.redirectTo) { router.push(data.redirectTo); return; }
        setError(data?.error ?? 'Request failed.');
        return;
      }

      const storedToken = invitationToken || localStorage.getItem('invitation_token');
      if (storedToken) {
        localStorage.removeItem('invitation_token');
        router.push(`/accept-invitation?token=${storedToken}`);
        return;
      }
      if (data?.redirectTo) { router.push(data.redirectTo); return; }
      router.push('/dashboard');
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

          <h1 className="auth-heading">Welcome back</h1>
          <p className="auth-sub">Sign in to your Infin8Content account.</p>

          {error && <p className="auth-error">{error}</p>}

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
              <a href="/forgot-password" className="auth-forgot">Forgot password?</a>
            </div>

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{' '}
            <a href="/register" className="auth-switch-link">Sign up free</a>
          </p>

        </div>
      </div>
    </MarketingShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page (wrapped in Suspense)
// ─────────────────────────────────────────────────────────────────────────────
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <LoginPageInner />
    </Suspense>
  );
}

