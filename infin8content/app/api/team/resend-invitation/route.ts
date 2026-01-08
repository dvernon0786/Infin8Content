import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'
import { sendTeamInvitationEmail } from '@/lib/services/team-notifications'

const resendInvitationSchema = z.object({
  invitationId: z.string().uuid('Invalid invitation ID'),
})

// TypeScript response types
export interface ResendInvitationSuccessResponse {
  success: true
}

export interface ResendInvitationErrorResponse {
  error: string
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id || currentUser.role !== 'owner') {
      return NextResponse.json(
        { error: "You don't have permission to resend invitations" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { invitationId } = resendInvitationSchema.parse(body)

    const supabase = await createClient()

    // Validate: Invitation exists and belongs to organization
    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { data: invitation, error: invitationError } = await (supabase as any)
      .from('team_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Generate new token and update expires_at (7 days from now)
    const newToken = randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // Update invitation: status = 'pending' (if expired), expires_at, token
    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { error: updateError } = await (supabase as any)
      .from('team_invitations')
      .update({
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        token: newToken,
      })
      .eq('id', invitationId)

    if (updateError) {
      console.error('Failed to update invitation:', updateError)
      return NextResponse.json(
        { error: 'Failed to resend invitation. Please try again.' },
        { status: 500 }
      )
    }

    // Get organization name for email
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', currentUser.org_id)
      .single()

    if (orgError || !organization) {
      console.error('Failed to fetch organization:', orgError)
      // This is a data integrity issue - organization should exist if user has org_id
      // Continue with default name for email, but log the error for investigation
    }

    // Send invitation email (non-blocking)
    try {
      await sendTeamInvitationEmail({
        to: invitation.email,
        inviterName: currentUser.email,
        organizationName: organization?.name || 'the organization',
        role: invitation.role,
        invitationToken: newToken,
      })
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0]
      return NextResponse.json(
        { error: firstError?.message || 'Validation error' },
        { status: 400 }
      )
    }

    console.error('Resend invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

