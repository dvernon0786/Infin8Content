/**
 * Content Notifications
 *
 * Brevo transactional emails for the article scheduling lifecycle:
 *   - sendArticleDraftReadyEmail  → fires when generation completes
 *   - sendPublishReminderEmail    → fires on the user's chosen publish_at date
 *
 * Follows the same singleton + inline-HTML pattern as payment-notifications.ts.
 * Add this file at: lib/services/content-notifications.ts
 */

import * as brevo from '@getbrevo/brevo'

// ── Brevo singleton ──────────────────────────────────────────────────────────

let brevoApiInstance: brevo.TransactionalEmailsApi | null = null

function getBrevoClient(): brevo.TransactionalEmailsApi {
    if (!brevoApiInstance) {
        const apiKey = process.env.BREVO_API_KEY
        if (!apiKey) throw new Error('BREVO_API_KEY environment variable is not set')
        brevoApiInstance = new brevo.TransactionalEmailsApi()
        brevoApiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey)
    }
    return brevoApiInstance
}

const SENDER_EMAIL = () => process.env.BREVO_SENDER_EMAIL || 'noreply@infin8content.com'
const SENDER_NAME = () => process.env.BREVO_SENDER_NAME || 'Infin8Content'
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'https://app.infin8content.com'

// ── Shared HTML shell ────────────────────────────────────────────────────────

function htmlShell(accentColor: string, body: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    ${body}
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #6b7280; font-size: 12px; margin: 0;">
      This is an automated message from Infin8Content. Please do not reply to this email.
    </p>
  </div>
</body>
</html>`
}

function ctaButton(href: string, label: string): string {
    return `<div style="text-align: center; margin: 30px 0;">
  <a href="${href}"
     style="background-color: #3B82F6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
    ${label}
  </a>
</div>`
}

// ── 1. Article Draft Ready ───────────────────────────────────────────────────

export interface SendArticleDraftReadyEmailParams {
    to: string
    userName?: string
    articleTitle: string
    articleId: string
    publishAt?: string   // ISO — shown to user as their scheduled publish date
}

/**
 * Sent when a scheduled article finishes generation and lands in CMS as draft.
 * The human must review and manually publish it.
 */
export async function sendArticleDraftReadyEmail({
    to,
    userName,
    articleTitle,
    articleId,
    publishAt,
}: SendArticleDraftReadyEmailParams): Promise<void> {
    const apiInstance = getBrevoClient()
    const articleUrl = `${APP_URL()}/dashboard/articles/${articleId}`

    const publishNote = publishAt
        ? `<p>You scheduled this article to be published on <strong>${new Date(publishAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>. We'll send you a reminder on that date.</p>`
        : ''

    const htmlBody = `
    <h1 style="color: #10B981; margin-top: 0;">✅ Your Article Is Ready as a Draft</h1>
    <p>Hello${userName ? ` ${userName}` : ''},</p>
    <p>Great news — your scheduled article has finished generating and is now sitting in your CMS as a <strong>draft</strong>, ready for your review.</p>

    <div style="background-color: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #10B981;">
        📄 "${articleTitle}"
      </p>
    </div>

    ${publishNote}

    <p><strong>What to do next:</strong></p>
    <ul>
      <li>Review the article in your dashboard</li>
      <li>Make any final edits or additions</li>
      <li>Publish it when you're happy — we won't publish it automatically</li>
    </ul>

    ${ctaButton(articleUrl, 'Review Draft →')}

    <p style="color: #6b7280; font-size: 13px;">
      Article ID: <code>${articleId}</code>
    </p>
  `

    const textBody = `Your Article Is Ready as a Draft

Hello${userName ? ` ${userName}` : ''},

Your scheduled article "${articleTitle}" has finished generating and is now a draft in your CMS.

${publishAt ? `You scheduled this article to be published on ${new Date(publishAt).toLocaleDateString()}. We'll send you a reminder on that date.\n` : ''}

What to do next:
- Review the article in your dashboard
- Make any final edits
- Publish it when you're ready — we won't publish automatically

Review it here: ${articleUrl}

---
This is an automated message from Infin8Content.`

    const email = new brevo.SendSmtpEmail()
    email.subject = `Draft Ready: "${articleTitle}"`
    email.sender = { email: SENDER_EMAIL(), name: SENDER_NAME() }
    email.to = [{ email: to, name: userName || to }]
    email.htmlContent = htmlShell('#10B981', htmlBody)
    email.textContent = textBody

    try {
        await apiInstance.sendTransacEmail(email)
    } catch (error) {
        console.error('[ContentNotifications] Failed to send draft-ready email:', error)
        throw new Error('Failed to send draft-ready notification.')
    }
}

// ── 2. Publish Reminder ──────────────────────────────────────────────────────

export interface SendPublishReminderEmailParams {
    to: string
    userName?: string
    articleTitle: string
    articleId: string
    publishAt: string   // ISO — the date the user originally chose
}

/**
 * Sent on the user's chosen publish_at date.
 * Reminds them to log in and manually publish the draft.
 */
export async function sendPublishReminderEmail({
    to,
    userName,
    articleTitle,
    articleId,
    publishAt,
}: SendPublishReminderEmailParams): Promise<void> {
    const apiInstance = getBrevoClient()
    const articleUrl = `${APP_URL()}/dashboard/articles/${articleId}`
    const formattedDate = new Date(publishAt).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    const htmlBody = `
    <h1 style="color: #3B82F6; margin-top: 0;">📅 Time to Publish Your Article</h1>
    <p>Hello${userName ? ` ${userName}` : ''},</p>
    <p>This is your scheduled publish reminder. You planned to publish the following article <strong>today (${formattedDate})</strong>:</p>

    <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #1D4ED8;">
        📄 "${articleTitle}"
      </p>
    </div>

    <p>The article is currently sitting as a <strong>draft</strong> in your CMS. Head to your dashboard to review and publish it.</p>

    ${ctaButton(articleUrl, 'Publish Now →')}

    <p><strong>Remember:</strong> We never auto-publish. Publishing is always a deliberate human action.</p>

    <p style="color: #6b7280; font-size: 13px;">
      Article ID: <code>${articleId}</code>
    </p>
  `

    const textBody = `Time to Publish Your Article

Hello${userName ? ` ${userName}` : ''},

This is your scheduled publish reminder for today (${formattedDate}).

Article: "${articleTitle}"

The article is sitting as a draft in your CMS. Go to your dashboard to review and publish it:
${articleUrl}

Remember: We never auto-publish. Publishing is always your call.

---
This is an automated message from Infin8Content.`

    const email = new brevo.SendSmtpEmail()
    email.subject = `Publish Reminder: "${articleTitle}" — Scheduled for Today`
    email.sender = { email: SENDER_EMAIL(), name: SENDER_NAME() }
    email.to = [{ email: to, name: userName || to }]
    email.htmlContent = htmlShell('#3B82F6', htmlBody)
    email.textContent = textBody

    try {
        await apiInstance.sendTransacEmail(email)
    } catch (error) {
        console.error('[ContentNotifications] Failed to send publish-reminder email:', error)
        throw new Error('Failed to send publish-reminder notification.')
    }
}
