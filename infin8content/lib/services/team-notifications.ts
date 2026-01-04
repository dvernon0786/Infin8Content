// Brevo email service for team notifications
import * as brevo from '@getbrevo/brevo'

// Initialize Brevo API client (reuse singleton pattern from payment-notifications.ts)
let brevoApiInstance: brevo.TransactionalEmailsApi | null = null

function getBrevoClient(): brevo.TransactionalEmailsApi {
  if (!brevoApiInstance) {
    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set')
    }

    brevoApiInstance = new brevo.TransactionalEmailsApi()
    brevoApiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey)
  }

  return brevoApiInstance
}

export interface SendTeamInvitationEmailParams {
  to: string
  inviterName: string
  organizationName: string
  role: string
  invitationToken: string
}

export interface SendTeamInvitationAcceptedEmailParams {
  to: string
  memberName: string
  memberEmail: string
  organizationName: string
}

export interface SendRoleChangeEmailParams {
  to: string
  memberName: string
  oldRole: string
  newRole: string
  organizationName: string
}

export interface SendMemberRemovedEmailParams {
  to: string
  memberName: string
  organizationName: string
}

/**
 * Send team invitation email notification via Brevo
 * Notifies user about team invitation with acceptance link
 */
export async function sendTeamInvitationEmail({
  to,
  inviterName,
  organizationName,
  role,
  invitationToken,
}: SendTeamInvitationEmailParams): Promise<void> {
  const apiInstance = getBrevoClient()

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@infin8content.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'Infin8Content'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.infin8content.com'
  const invitationLink = `${appUrl}/accept-invitation?token=${invitationToken}`

  const roleDescription =
    role === 'editor'
      ? 'Editor - You can create, edit, and manage content'
      : 'Viewer - You can view content and reports'

  const sendSmtpEmail = new brevo.SendSmtpEmail()
  sendSmtpEmail.subject = `You've been invited to join ${organizationName} on Infin8Content`
  sendSmtpEmail.sender = { email: senderEmail, name: senderName }
  sendSmtpEmail.to = [{ email: to, name: to }]

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
        <h1 style="color: #3B82F6; margin-top: 0;">You've Been Invited!</h1>
        <p>Hello,</p>
        <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on Infin8Content as a <strong>${role}</strong>.</p>
        
        <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #1E40AF;">Your Role: ${roleDescription}</p>
        </div>
        
        <p>Click the button below to accept the invitation and join the team:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationLink}" 
             style="background-color: #3B82F6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Accept Invitation
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;"><strong>Important:</strong> This invitation will expire in 7 days. If you don't have an account, you'll be prompted to create one when you click the link.</p>
        
        <p>If you have any questions, please contact ${inviterName} or our support team.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">This is an automated message from Infin8Content. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `

  // Plain text fallback
  sendSmtpEmail.textContent = `
You've Been Invited!

Hello,

${inviterName} has invited you to join ${organizationName} on Infin8Content as a ${role}.

Your Role: ${roleDescription}

Click the link below to accept the invitation and join the team:
${invitationLink}

Important: This invitation will expire in 7 days. If you don't have an account, you'll be prompted to create one when you click the link.

If you have any questions, please contact ${inviterName} or our support team.

---
This is an automated message from Infin8Content. Please do not reply to this email.
  `

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail)
  } catch (error) {
    console.error('Failed to send team invitation email via Brevo:', error)
    throw new Error('Failed to send team invitation notification. Please try again.')
  }
}

/**
 * Send team invitation accepted email notification via Brevo
 * Notifies organization owner when a team member accepts an invitation
 */
export async function sendTeamInvitationAcceptedEmail({
  to,
  memberName,
  memberEmail,
  organizationName,
}: SendTeamInvitationAcceptedEmailParams): Promise<void> {
  const apiInstance = getBrevoClient()

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@infin8content.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'Infin8Content'

  const sendSmtpEmail = new brevo.SendSmtpEmail()
  sendSmtpEmail.subject = `${memberName} has joined ${organizationName}`
  sendSmtpEmail.sender = { email: senderEmail, name: senderName }
  sendSmtpEmail.to = [{ email: to, name: to }]

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
        <h1 style="color: #10B981; margin-top: 0;">Team Member Joined</h1>
        <p>Hello,</p>
        <p><strong>${memberName}</strong> (${memberEmail}) has accepted your invitation and joined <strong>${organizationName}</strong> on Infin8Content.</p>
        
        <div style="background-color: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #10B981;">They now have access to your organization's content and features.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.infin8content.com'}/settings/team" 
             style="background-color: #3B82F6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Manage Team
          </a>
        </div>
        
        <p>If you have any questions, please contact our support team.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">This is an automated message from Infin8Content. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `

  // Plain text fallback
  sendSmtpEmail.textContent = `
Team Member Joined

Hello,

${memberName} (${memberEmail}) has accepted your invitation and joined ${organizationName} on Infin8Content.

They now have access to your organization's content and features.

Manage Team: ${process.env.NEXT_PUBLIC_APP_URL || 'https://app.infin8content.com'}/settings/team

If you have any questions, please contact our support team.

---
This is an automated message from Infin8Content. Please do not reply to this email.
  `

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail)
  } catch (error) {
    console.error('Failed to send invitation accepted email via Brevo:', error)
    throw new Error('Failed to send invitation accepted notification. Please try again.')
  }
}

/**
 * Send role change email notification via Brevo
 * Notifies team member when their role is changed
 */
export async function sendRoleChangeEmail({
  to,
  memberName,
  oldRole,
  newRole,
  organizationName,
}: SendRoleChangeEmailParams): Promise<void> {
  const apiInstance = getBrevoClient()

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@infin8content.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'Infin8Content'

  const newRoleDescription =
    newRole === 'editor'
      ? 'Editor - You can create, edit, and manage content'
      : 'Viewer - You can view content and reports'

  const sendSmtpEmail = new brevo.SendSmtpEmail()
  sendSmtpEmail.subject = `Your role has been updated in ${organizationName}`
  sendSmtpEmail.sender = { email: senderEmail, name: senderName }
  sendSmtpEmail.to = [{ email: to, name: memberName || to }]

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
        <h1 style="color: #3B82F6; margin-top: 0;">Role Updated</h1>
        <p>Hello${memberName ? ` ${memberName}` : ''},</p>
        <p>Your role in <strong>${organizationName}</strong> has been updated.</p>
        
        <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Previous Role:</strong> ${oldRole}</p>
          <p style="margin: 0;"><strong>New Role:</strong> ${newRole}</p>
          <p style="margin: 10px 0 0 0; font-weight: bold; color: #1E40AF;">${newRoleDescription}</p>
        </div>
        
        <p>This change takes effect immediately. You may need to refresh your browser to see the updated permissions.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.infin8content.com'}/dashboard" 
             style="background-color: #3B82F6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Go to Dashboard
          </a>
        </div>
        
        <p>If you have any questions, please contact your organization owner or our support team.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">This is an automated message from Infin8Content. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `

  // Plain text fallback
  sendSmtpEmail.textContent = `
Role Updated

Hello${memberName ? ` ${memberName}` : ''},

Your role in ${organizationName} has been updated.

Previous Role: ${oldRole}
New Role: ${newRole}
${newRoleDescription}

This change takes effect immediately. You may need to refresh your browser to see the updated permissions.

Go to Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://app.infin8content.com'}/dashboard

If you have any questions, please contact your organization owner or our support team.

---
This is an automated message from Infin8Content. Please do not reply to this email.
  `

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail)
  } catch (error) {
    console.error('Failed to send role change email via Brevo:', error)
    throw new Error('Failed to send role change notification. Please try again.')
  }
}

/**
 * Send member removed email notification via Brevo
 * Notifies team member when they are removed from an organization
 */
export async function sendMemberRemovedEmail({
  to,
  memberName,
  organizationName,
}: SendMemberRemovedEmailParams): Promise<void> {
  const apiInstance = getBrevoClient()

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@infin8content.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'Infin8Content'

  const sendSmtpEmail = new brevo.SendSmtpEmail()
  sendSmtpEmail.subject = `You've been removed from ${organizationName}`
  sendSmtpEmail.sender = { email: senderEmail, name: senderName }
  sendSmtpEmail.to = [{ email: to, name: memberName || to }]

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
        <h1 style="color: #DC2626; margin-top: 0;">Access Revoked</h1>
        <p>Hello${memberName ? ` ${memberName}` : ''},</p>
        <p>You have been removed from <strong>${organizationName}</strong> on Infin8Content.</p>
        
        <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #DC2626;">Your access to this organization's content and features has been revoked.</p>
        </div>
        
        <p>If you believe this was done in error, please contact your organization owner or our support team.</p>
        
        <p>If you have any questions, please contact our support team.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">This is an automated message from Infin8Content. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `

  // Plain text fallback
  sendSmtpEmail.textContent = `
Access Revoked

Hello${memberName ? ` ${memberName}` : ''},

You have been removed from ${organizationName} on Infin8Content.

Your access to this organization's content and features has been revoked.

If you believe this was done in error, please contact your organization owner or our support team.

If you have any questions, please contact our support team.

---
This is an automated message from Infin8Content. Please do not reply to this email.
  `

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail)
  } catch (error) {
    console.error('Failed to send member removed email via Brevo:', error)
    throw new Error('Failed to send member removed notification. Please try again.')
  }
}

