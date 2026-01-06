import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'

const cancelInvitationSchema = z.object({
  invitationId: z.string().uuid('Invalid invitation ID'),
})

// TypeScript response types
export interface CancelInvitationSuccessResponse {
  success: true
}

export interface CancelInvitationErrorResponse {
  error: string
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id || currentUser.role !== 'owner') {
      return NextResponse.json(
        { error: "You don't have permission to cancel invitations" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { invitationId } = cancelInvitationSchema.parse(body)

    const supabase = await createClient()

    // Validate: Invitation exists and belongs to organization
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('id', invitationId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Update invitation: status = 'expired'
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({ status: 'expired' })
      .eq('id', invitationId)

    if (updateError) {
      console.error('Failed to cancel invitation:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel invitation. Please try again.' },
        { status: 500 }
      )
    }

    // Log audit event for compliance
    logActionAsync({
      orgId: currentUser.org_id,
      userId: currentUser.id,
      action: AuditAction.TEAM_INVITATION_REVOKED,
      details: {
        invitationId,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

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

    console.error('Cancel invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

