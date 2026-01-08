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
    // RPC function returns SETOF (array), so we need to handle it properly
    // TODO: Regenerate types from Supabase Dashboard to fix RPC function types
    const { data: invitationData, error: invitationError } = await (supabase.rpc as any)(
      'get_invitation_by_token',
      { token_input: token }
    )

    if (invitationError || !invitationData || invitationData.length === 0) {
      return NextResponse.json(
        { error: 'Invitation not found or already accepted' },
        { status: 404 }
      )
    }

    // Get first invitation (should only be one since token is unique)
    const invitation = invitationData[0]
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or already accepted' },
        { status: 404 }
      )
    }

    // Check if invitation is expired (database-level check already done, but verify in JS too)
    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired. Please request a new invitation.' },
        { status: 400 }
      )
    }

    // Check if invitation status is pending
    if (invitation.status !== 'pending') {
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
    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { data: existingUser } = await (supabase as any)
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
    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { error: updateError } = await (supabase as any)
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
    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { error: invitationUpdateError } = await (supabase as any)
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
    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { data: organization, error: orgError } = await (supabase as any)
      .from('organizations')
      .select('name')
      .eq('id', invitation.org_id)
      .single()

    if (orgError) {
      console.error('Failed to fetch organization for notification:', orgError)
      // Continue with default name - don't fail the request
    }

    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { data: owner, error: ownerError } = await (supabase as any)
      .from('users')
      .select('email')
      .eq('id', invitation.created_by)
      .single()

    if (ownerError) {
      console.error('Failed to fetch owner for notification:', ownerError)
      // Continue without sending email - don't fail the request
    }

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

