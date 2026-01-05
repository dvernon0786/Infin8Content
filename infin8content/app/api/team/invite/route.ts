import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'
import { sendTeamInvitationEmail } from '@/lib/services/team-notifications'

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['editor', 'viewer'], {
    message: 'Role must be editor or viewer',
  }),
})

// TypeScript response types
export interface InviteTeamMemberSuccessResponse {
  success: true
  invitationId: string
}

export interface InviteTeamMemberErrorResponse {
  error: string
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id || currentUser.role !== 'owner') {
      return NextResponse.json(
        { error: "You don't have permission to invite team members" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, role } = inviteTeamMemberSchema.parse(body)

    const supabase = await createClient()

    // Validate: User doesn't already exist in organization
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('org_id', currentUser.org_id)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already belongs to this organization' },
        { status: 400 }
      )
    }

    // Validate: No pending invitation exists for this email + org
    const { data: existingInvitation } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('email', email)
      .eq('org_id', currentUser.org_id)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'A pending invitation already exists for this email' },
        { status: 400 }
      )
    }

    // Generate unique invitation token
    const token = randomUUID()

    // Set expires_at to 7 days from now
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // Insert invitation record
    const { data: invitation, error: insertError } = await supabase
      .from('team_invitations')
      .insert({
        email,
        org_id: currentUser.org_id,
        role,
        token,
        expires_at: expiresAt.toISOString(),
        created_by: currentUser.id,
      })
      .select()
      .single()

    if (insertError || !invitation) {
      console.error('Failed to create invitation:', insertError)
      return NextResponse.json(
        { error: 'Failed to create invitation. Please try again.' },
        { status: 500 }
      )
    }

    // Send invitation email (non-blocking)
    try {
      await sendTeamInvitationEmail({
        to: email,
        inviterName: currentUser.email,
        organizationName: currentUser.organizations?.name || 'the organization',
        role,
        invitationToken: token,
      })
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      invitationId: invitation.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0]
      return NextResponse.json(
        { error: firstError?.message || 'Validation error' },
        { status: 400 }
      )
    }

    console.error('Team invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

