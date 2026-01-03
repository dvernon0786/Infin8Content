// Brevo (formerly Sendinblue) email service for OTP verification
import * as brevo from '@getbrevo/brevo'

// Initialize Brevo API client
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

export interface SendOTPEmailParams {
  to: string
  otpCode: string
  userName?: string
}

/**
 * Send OTP verification email via Brevo
 */
export async function sendOTPEmail({ to, otpCode, userName }: SendOTPEmailParams): Promise<void> {
  const apiInstance = getBrevoClient()
  
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@infin8content.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'Infin8Content'
  
  const sendSmtpEmail = new brevo.SendSmtpEmail()
  sendSmtpEmail.subject = 'Verify your email address'
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
        <h1 style="color: #3B82F6; margin-top: 0;">Verify Your Email Address</h1>
        <p>Hello${userName ? ` ${userName}` : ''},</p>
        <p>Thank you for registering with Infin8Content. Please use the following code to verify your email address:</p>
        <div style="background-color: #ffffff; border: 2px solid #3B82F6; border-radius: 6px; padding: 20px; text-align: center; margin: 20px 0;">
          <h2 style="color: #3B82F6; margin: 0; font-size: 32px; letter-spacing: 4px;">${otpCode}</h2>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">This is an automated message from Infin8Content. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `
  
  // Plain text fallback
  sendSmtpEmail.textContent = `
Verify Your Email Address

Hello${userName ? ` ${userName}` : ''},

Thank you for registering with Infin8Content. Please use the following code to verify your email address:

${otpCode}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

---
This is an automated message from Infin8Content. Please do not reply to this email.
  `
  
  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail)
  } catch (error) {
    console.error('Failed to send OTP email via Brevo:', error)
    throw new Error('Failed to send verification email. Please try again.')
  }
}

