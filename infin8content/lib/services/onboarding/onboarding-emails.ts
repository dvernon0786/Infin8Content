// Epic 12: Story 12-7 — Onboarding Email Sequences
// New file — does NOT modify existing email files (brevo.ts, payment-notifications.ts).
// Pattern follows lib/services/brevo.ts exactly.

import * as brevo from '@getbrevo/brevo'

let brevoInstance: brevo.TransactionalEmailsApi | null = null

function getBrevoClient(): brevo.TransactionalEmailsApi {
  if (!brevoInstance) {
    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) throw new Error('BREVO_API_KEY environment variable is not set')
    brevoInstance = new brevo.TransactionalEmailsApi()
    brevoInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey)
  }
  return brevoInstance
}

const FROM = {
  email: process.env.BREVO_SENDER_EMAIL ?? 'noreply@infin8content.com',
  name: process.env.BREVO_SENDER_NAME ?? 'Infin8Content',
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.infin8content.com'

// ─── Email 1: Welcome (sent immediately after payment) ────────────────────────
export async function sendWelcomeEmail({
  to,
  userName,
}: {
  to: string
  userName: string
}) {
  const client = getBrevoClient()
  const email = new brevo.SendSmtpEmail()
  email.sender = FROM
  email.to = [{ email: to, name: userName }]
  email.subject = `Welcome to Infin8Content, ${userName}! 🚀`
  email.htmlContent = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;color:#1a1a2e">
      <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">You're in, ${userName}!</h1>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin-bottom:24px">
        Your Infin8Content account is active. Here's how to get your first article live in the next 10 minutes:
      </p>
      <ol style="color:#374151;font-size:15px;line-height:1.8;padding-left:20px;margin-bottom:32px">
        <li>Go to your <a href="${APP_URL}/dashboard" style="color:#0070f3">dashboard</a></li>
        <li>Click <strong>New Article</strong> and enter a keyword</li>
        <li>Hit Generate — we do the rest</li>
      </ol>
      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#0070f3;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
        Go to Dashboard →
      </a>
      <p style="color:#9ca3af;font-size:13px;margin-top:32px">
        Questions? Reply to this email or contact us at <a href="mailto:support@infin8content.com" style="color:#0070f3">support@infin8content.com</a>
      </p>
    </div>
  `
  await client.sendTransacEmail(email)
}

// ─── Email 2: Day 3 Tips ────────────────────────────────────────────────────
export async function sendDay3TipsEmail({
  to,
  userName,
}: {
  to: string
  userName: string
}) {
  const client = getBrevoClient()
  const email = new brevo.SendSmtpEmail()
  email.sender = FROM
  email.to = [{ email: to, name: userName }]
  email.subject = `3 tips to get more from Infin8Content`
  email.htmlContent = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;color:#1a1a2e">
      <h1 style="font-size:22px;font-weight:700;margin-bottom:16px">Quick tips, ${userName}</h1>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin-bottom:20px">
        Here are three things our best-performing users do in their first week:
      </p>
      <div style="border-left:3px solid #0070f3;padding:12px 16px;margin-bottom:16px;background:#f0f7ff;border-radius:4px">
        <strong>1. Run a Workflow</strong><br/>
        <span style="color:#6b7280;font-size:14px">Workflows map your entire content strategy from ICP to articles. Try creating one today.</span>
      </div>
      <div style="border-left:3px solid #0070f3;padding:12px 16px;margin-bottom:16px;background:#f0f7ff;border-radius:4px">
        <strong>2. Connect your CMS</strong><br/>
        <span style="color:#6b7280;font-size:14px">Connect WordPress in Settings → Integrations and one-click publish any article.</span>
      </div>
      <div style="border-left:3px solid #0070f3;padding:12px 16px;margin-bottom:24px;background:#f0f7ff;border-radius:4px">
        <strong>3. Use Keyword Research</strong><br/>
        <span style="color:#6b7280;font-size:14px">Find low-competition opportunities with our Research tab before writing.</span>
      </div>
      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#0070f3;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
        Open Dashboard →
      </a>
    </div>
  `
  await client.sendTransacEmail(email)
}

// ─── Email 3: Day 7 Success ──────────────────────────────────────────────────
export async function sendDay7SuccessEmail({
  to,
  userName,
}: {
  to: string
  userName: string
}) {
  const client = getBrevoClient()
  const email = new brevo.SendSmtpEmail()
  email.sender = FROM
  email.to = [{ email: to, name: userName }]
  email.subject = `How's your first week going?`
  email.htmlContent = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;color:#1a1a2e">
      <h1 style="font-size:22px;font-weight:700;margin-bottom:8px">One week in 🎉</h1>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin-bottom:24px">
        You've been using Infin8Content for a week now — have you hit your first content milestone?
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin-bottom:24px">
        If you haven't yet, today is a perfect day to generate your first workflow-driven article. 
        It takes about 5 minutes and the results are worth it.
      </p>
      <a href="${APP_URL}/dashboard/workflows" style="display:inline-block;background:#0070f3;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
        Start a Workflow →
      </a>
      <p style="color:#9ca3af;font-size:13px;margin-top:32px">
        Want to share feedback or need help? Just reply to this email.
      </p>
    </div>
  `
  await client.sendTransacEmail(email)
}
