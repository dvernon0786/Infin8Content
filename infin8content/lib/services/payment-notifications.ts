// Brevo email service for payment notifications
import * as brevo from '@getbrevo/brevo'

// Initialize Brevo API client (reuse singleton pattern from brevo.ts)
let brevoApiInstance: brevo.TransactionalEmailsApi | null = null

function getBrevoClient(): brevo.TransactionalEmailsApi {
  if (!brevoApiInstance) {
    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set')
    }
    
    // Create API instance with authentication
    brevoApiInstance = new brevo.TransactionalEmailsApi()
    // Set API key using the enum value
    brevoApiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey)
  }
  
  return brevoApiInstance
}

export interface SendPaymentFailureEmailParams {
  to: string
  userName?: string
  gracePeriodDays: number
}

export interface SendPaymentReactivationEmailParams {
  to: string
  userName?: string
}

/**
 * Send payment failure email notification via Brevo
 * Notifies user about payment failure, grace period, and suspension risk
 */
export async function sendPaymentFailureEmail({ 
  to, 
  userName, 
  gracePeriodDays 
}: SendPaymentFailureEmailParams): Promise<void> {
  const apiInstance = getBrevoClient()
  
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@infin8content.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'Infin8Content'
  
  const sendSmtpEmail = new brevo.SendSmtpEmail()
  sendSmtpEmail.subject = 'Payment Failed - Action Required'
  sendSmtpEmail.sender = { email: senderEmail, name: senderName }
  sendSmtpEmail.to = [{ email: to, name: userName || to }]
  
  // HTML email template
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
        <h1 style="color: #DC2626; margin-top: 0;">Payment Failed - Action Required</h1>
        <p>Hello${userName ? ` ${userName}` : ''},</p>
        <p>We were unable to process your payment for your Infin8Content subscription. Your account is currently in a <strong>${gracePeriodDays}-day grace period</strong>.</p>
        
        <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #DC2626;">Important: Your account will be suspended after ${gracePeriodDays} days if payment is not updated.</p>
        </div>
        
        <p>To avoid account suspension, please update your payment method:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.infin8content.com'}/payment" 
             style="background-color: #3B82F6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Update Payment Method
          </a>
        </div>
        
        <p><strong>What happens next?</strong></p>
        <ul>
          <li>You have <strong>${gracePeriodDays} days</strong> to update your payment method</li>
          <li>During this time, you can still access your dashboard</li>
          <li>After ${gracePeriodDays} days, your account will be suspended and access will be restricted</li>
          <li>Once you update your payment method, your account will be immediately reactivated</li>
        </ul>
        
        <p>If you have any questions or need assistance, please contact our support team.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">This is an automated message from Infin8Content. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `
  
  // Plain text fallback
  sendSmtpEmail.textContent = `
Payment Failed - Action Required

Hello${userName ? ` ${userName}` : ''},

We were unable to process your payment for your Infin8Content subscription. Your account is currently in a ${gracePeriodDays}-day grace period.

IMPORTANT: Your account will be suspended after ${gracePeriodDays} days if payment is not updated.

To avoid account suspension, please update your payment method:
${process.env.NEXT_PUBLIC_APP_URL || 'https://app.infin8content.com'}/payment

What happens next?
- You have ${gracePeriodDays} days to update your payment method
- During this time, you can still access your dashboard
- After ${gracePeriodDays} days, your account will be suspended and access will be restricted
- Once you update your payment method, your account will be immediately reactivated

If you have any questions or need assistance, please contact our support team.

---
This is an automated message from Infin8Content. Please do not reply to this email.
  `
  
  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail)
  } catch (error) {
    console.error('Failed to send payment failure email via Brevo:', error)
    throw new Error('Failed to send payment failure notification. Please try again.')
  }
}

/**
 * Send payment reactivation email notification via Brevo
 * Confirms successful payment and account reactivation
 */
export async function sendPaymentReactivationEmail({ 
  to, 
  userName 
}: SendPaymentReactivationEmailParams): Promise<void> {
  const apiInstance = getBrevoClient()
  
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@infin8content.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'Infin8Content'
  
  const sendSmtpEmail = new brevo.SendSmtpEmail()
  sendSmtpEmail.subject = 'Account Reactivated - Payment Confirmed'
  sendSmtpEmail.sender = { email: senderEmail, name: senderName }
  sendSmtpEmail.to = [{ email: to, name: userName || to }]
  
  // HTML email template
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
        <h1 style="color: #10B981; margin-top: 0;">Account Reactivated - Payment Confirmed</h1>
        <p>Hello${userName ? ` ${userName}` : ''},</p>
        <p>Great news! Your payment has been successfully processed and your Infin8Content account has been reactivated.</p>
        
        <div style="background-color: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #10B981;">Your account is now active and you have full access to all features.</p>
        </div>
        
        <p>You can now:</p>
        <ul>
          <li>Access your dashboard and all platform features</li>
          <li>Continue using your subscription without interruption</li>
          <li>Manage your account settings and billing</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.infin8content.com'}/dashboard" 
             style="background-color: #3B82F6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Go to Dashboard
          </a>
        </div>
        
        <p>Thank you for your continued support. If you have any questions, please don't hesitate to contact our support team.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">This is an automated message from Infin8Content. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `
  
  // Plain text fallback
  sendSmtpEmail.textContent = `
Account Reactivated - Payment Confirmed

Hello${userName ? ` ${userName}` : ''},

Great news! Your payment has been successfully processed and your Infin8Content account has been reactivated.

Your account is now active and you have full access to all features.

You can now:
- Access your dashboard and all platform features
- Continue using your subscription without interruption
- Manage your account settings and billing

Go to Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://app.infin8content.com'}/dashboard

Thank you for your continued support. If you have any questions, please don't hesitate to contact our support team.

---
This is an automated message from Infin8Content. Please do not reply to this email.
  `
  
  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail)
  } catch (error) {
    console.error('Failed to send payment reactivation email via Brevo:', error)
    throw new Error('Failed to send reactivation notification. Please try again.')
  }
}

