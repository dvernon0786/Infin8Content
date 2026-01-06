import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { sendTeamInvitationAcceptedEmail } from '@/lib/services/team-notifications'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'

const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
})

// TypeScript response types
export interface AcceptInvitationSuccessResponse {
  success: true
  redirectUrl: string
}

export interface AcceptInvitationRequiresRegistrationResponse {
  success: false
  requiresRegistration: true
  redirectUrl: string
}

export interface AcceptInvitationErrorResponse {
  error: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token } = acceptInvitationSchema.parse(body)

    const supabase = await createClient()

    // Validate: Token exists and is valid (not expired, status = 'pending')
    // Use database-level expiration check to avoid timezone issues and race conditions
    // Validate: Token exists and is valid (not expired, status = 'pending')
    // Use database-level expiration check to avoid timezone issues and race conditions
    const { data: invitation, error: invitationError } = await supabase
      .rpc('get_invitation_by_token', { token_input: token })
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (invitationError || !invitation) {
      // Check if invitation exists but is expired
      const { data: expiredInvitation } = await supabase
        .rpc('get_invitation_by_token', { token_input: token })
        .select('id, expires_at')
        .single()

      if (expiredInvitation) {
        return NextResponse.json(
          { error: 'This invitation has expired. Please request a new invitation.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Invitation not found or already accepted' },
        { status: 404 }
      )
    }

    // Get current user (may be null if not authenticated)
    const currentUser = await getCurrentUser()

    // Edge Case: Check if authenticated user already has org_id set
    if (currentUser && currentUser.org_id) {
      return NextResponse.json(
        { error: 'You already belong to an organization. Please leave your current organization first.' },
        { status: 400 }
      )
    }

    // Check if user exists (by invitation email)
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', invitation.email)
      .single()

    // If user doesn't exist, return redirect URL to registration with invitation token
    if (!existingUser) {
      return NextResponse.json({
        success: false,
        requiresRegistration: true,
        redirectUrl: `/register?invitation_token=${token}`,
      })
    }

    // Validate: User doesn't already belong to this organization
    if (existingUser.org_id === invitation.org_id) {
      return NextResponse.json(
        { error: 'User already belongs to this organization' },
        { status: 400 }
      )
    }

    // If user exists: Add user to organization
    const { error: updateError } = await supabase
      .from('users')
      .update({
        org_id: invitation.org_id,
        role: invitation.role,
      })
      .eq('id', existingUser.id)

    if (updateError) {
      console.error('Failed to update user organization:', updateError)
      return NextResponse.json(
        { error: 'Failed to accept invitation. Please try again.' },
        { status: 500 }
      )
    }

    // Update invitation: status = 'accepted', accepted_at = NOW()
    const { error: invitationUpdateError } = await supabase
      .from('team_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id)

    if (invitationUpdateError) {
      console.error('Failed to update invitation status:', invitationUpdateError)
      // Don't fail the request, invitation is already processed
    }

    // Get organization owner email for notification
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', invitation.org_id)
      .single()

    const { data: owner } = await supabase
      .from('users')
      .select('email')
      .eq('id', invitation.created_by)
      .single()

    // Send notification email to organization owner (non-blocking)
    if (owner?.email && organization?.name) {
      try {
        await sendTeamInvitationAcceptedEmail({
          to: owner.email,
          memberName: existingUser.email,
          memberEmail: existingUser.email,
          organizationName: organization.name,
        })
      } catch (emailError) {
        console.error('Failed to send invitation accepted email:', emailError)
        // Don't fail the request if email fails
      }
    }

    // Log audit event for compliance
    logActionAsync({
      orgId: invitation.org_id,
      userId: existingUser.id,
      action: AuditAction.TEAM_INVITATION_ACCEPTED,
      details: {
        invitationId: invitation.id,
        role: invitation.role,
        memberEmail: existingUser.email,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    return NextResponse.json({
      success: true,
      redirectUrl: '/dashboard',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0]
      return NextResponse.json(
        { error: firstError?.message || 'Validation error' },
        { status: 400 }
      )
    }

    console.error('Accept invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

