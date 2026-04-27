'use client';

/**
 * app/(auth)/verify-email/page.tsx
 *
 * Layout system : MarketingShell (wrapper) + scoped <style> injection
 * Token source  : --bg / --accent / --surface / etc. (same as login & register)
 * Auth logic    : unchanged — same fetch, OTP verify, resend, redirects.
 */

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MarketingShell from '@/components/marketing/MarketingShell';

// ─────────────────────────────────────────────────────────────────────────────
// CSS — identical token names to login / register pages
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
.auth-sub strong { color: var(--text); font-weight: 500; word-break: break-all; }
.auth-field { margin-bottom: 16px; }
.auth-label {
  display: block; font-size: 13px; font-weight: 500;
  color: var(--text); margin-bottom: 6px;
}
.auth-otp-input {
  width: 100%; background: var(--surface2);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 10px; padding: 14px;
  font-size: 28px; font-weight: 700;
  letter-spacing: .35em; text-align: center;
  color: var(--white); font-family: var(--font-display);
  outline: none; box-sizing: border-box;
  transition: border-color .2s;
}
.auth-otp-input:focus { border-color: rgba(79,110,247,.6); }
.auth-otp-input::placeholder { color: var(--muted2); font-size: 22px; letter-spacing: .2em; }
.auth-error {
  font-size: 13px; color: #f87171;
  background: rgba(239,68,68,.1);
  border: 1px solid rgba(239,68,68,.2);
  border-radius: 8px; padding: 10px 14px;
  margin-bottom: 16px; line-height: 1.5;
  display: flex; align-items: center; gap: 6px;
}
.auth-success-msg {
  font-size: 13px; color: #4ade80;
  background: rgba(34,197,94,.1);
  border: 1px solid rgba(34,197,94,.2);
  border-radius: 8px; padding: 10px 14px;
  margin-bottom: 16px; line-height: 1.5;
  display: flex; align-items: center; gap: 6px;
}
.auth-submit {
  display: flex; align-items: center; justify-content: center; gap: 8px;
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
.auth-submit:disabled { opacity: .4; cursor: not-allowed; transform: none; box-shadow: none; }
.auth-divider {
  border: none; border-top: 1px solid rgba(255,255,255,.07);
  margin: 24px 0;
}
.auth-resend-btn {
  display: block; width: 100%; text-align: center;
  font-size: 13.5px; font-weight: 500; color: var(--muted);
  background: none; border: none; cursor: pointer;
  font-family: var(--font-body); padding: 0;
  transition: color .2s;
}
.auth-resend-btn:hover:not(:disabled) { color: var(--white); }
.auth-resend-btn:disabled { opacity: .5; cursor: not-allowed; }
.auth-resend-btn span { color: var(--accent); font-weight: 600; }
.auth-switch {
  text-align: center; font-size: 13px;
  color: var(--muted); margin-top: 16px;
}
.auth-switch-link {
  color: var(--accent); font-weight: 600;
  text-decoration: none; transition: color .2s;
}
.auth-switch-link:hover { color: #3d5df5; }

/* success state */
.auth-success-state { text-align: center; }
.auth-success-icon {
  font-size: 40px; margin-bottom: 16px;
}
.auth-success-cta {
  display: flex; align-items: center; justify-content: center;
  width: 100%; padding: 13px; margin-top: 20px;
  border-radius: 10px; border: none; cursor: pointer;
  font-family: var(--font-display); font-size: 15px; font-weight: 600;
  color: var(--white);
  background: linear-gradient(to right, #217CEB, #4A42CC);
  box-shadow: 0 0 24px rgba(79,110,247,.35);
  text-decoration: none;
  transition: all .2s;
}
.auth-success-cta:hover {
  opacity: .9; box-shadow: 0 0 32px rgba(79,110,247,.5);
  transform: translateY(-1px);
}

/* spinner */
@keyframes spin { to { transform: rotate(360deg); } }
.spinner {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  animation: spin .7s linear infinite; flex-shrink: 0;
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Inner content — separated so Suspense can wrap useSearchParams
// ─────────────────────────────────────────────────────────────────────────────
function VerifyOTPContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const email        = searchParams.get('email');

  const [invitationToken, setInvitationToken] = React.useState<string | null>(null);
  React.useEffect(() => {
    const token = searchParams.get('invitation_token') || localStorage.getItem('invitation_token');
    setInvitationToken(token);
  }, [searchParams]);

  const [otpCode, setOtpCode]             = useState('');
  const [error, setError]                 = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isVerifying, setIsVerifying]     = useState(false);
  const [isResending, setIsResending]     = useState(false);
  const [success, setSuccess]             = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!email)           { setError('Email address is required.'); return; }
    if (otpCode.length !== 6) { setError('Please enter the 6-digit verification code.'); return; }

    setIsVerifying(true);
    setError('');
    try {
      const res  = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Verification failed.'); return; }

      setSuccess(true);
      const redirectUrl = data.redirectTo || '/login?verified=true';
      setTimeout(() => router.push(redirectUrl), 2000);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!email) { setError('Email address is required.'); return; }

    setIsResending(true);
    setError('');
    try {
      const res  = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to resend code.'); return; }

      setSuccessMessage(data.message || 'Verification code sent.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/infin8content_logo.png" alt="Infin8Content" />
          </div>
          <div className="auth-success-state">
            <div className="auth-success-icon">✅</div>
            <h1 className="auth-heading">Email Verified</h1>
            <p className="auth-sub">Your email has been verified. Redirecting you now…</p>
            <a href="/dashboard" className="auth-success-cta">Go to Dashboard</a>
          </div>
        </div>
      </div>
    );
  }

  // ── Default state ──────────────────────────────────────────────────────
  return (
    <div className="auth-wrap">
      <div className="auth-card">

        <div className="auth-logo">
          <img src="/infin8content_logo.png" alt="Infin8Content" />
        </div>

        <h1 className="auth-heading">Verify your email</h1>
        <p className="auth-sub">
          We sent a 6-digit code to{' '}
          <strong>{email || 'your email address'}</strong>.
          Enter it below to continue.
        </p>

        {error          && <p className="auth-error"><span>⚠</span>{error}</p>}
        {successMessage && <p className="auth-success-msg"><span>✓</span>{successMessage}</p>}

        <form onSubmit={handleVerify} noValidate>
          <div className="auth-field">
            <label className="auth-label">Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              className="auth-otp-input"
              value={otpCode}
              onChange={e => {
                setOtpCode(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="000000"
              required
              autoComplete="one-time-code"
              aria-invalid={!!error}
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={isVerifying || otpCode.length !== 6}
          >
            {isVerifying && <span className="spinner" />}
            {isVerifying ? 'Verifying…' : 'Verify email'}
          </button>
        </form>

        <hr className="auth-divider" />

        <button
          type="button"
          className="auth-resend-btn"
          onClick={handleResend}
          disabled={isResending}
        >
          {isResending
            ? <><span className="spinner" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />Sending…</>
            : <>Didn't receive it? <span>Resend code</span></>}
        </button>

        <p className="auth-switch">
          <a href="/register" className="auth-switch-link">← Back to registration</a>
        </p>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page export
// ─────────────────────────────────────────────────────────────────────────────
export default function VerifyEmailPage() {
  return (
    <MarketingShell>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <Suspense fallback={
        <div className="auth-wrap">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div className="auth-logo">
              <img src="/infin8content_logo.png" alt="Infin8Content" />
            </div>
            <p className="auth-sub">Loading…</p>
          </div>
        </div>
      }>
        <VerifyOTPContent />
      </Suspense>
    </MarketingShell>
  );
}

