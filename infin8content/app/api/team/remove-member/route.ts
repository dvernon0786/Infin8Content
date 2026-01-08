import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { sendMemberRemovedEmail } from '@/lib/services/team-notifications'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'

const removeMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

// TypeScript response types
export interface RemoveMemberSuccessResponse {
  success: true
}

export interface RemoveMemberErrorResponse {
  error: string
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id || currentUser.role !== 'owner') {
      return NextResponse.json(
        { error: "You don't have permission to remove members" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId } = removeMemberSchema.parse(body)

    // Validate: Cannot remove self
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get target user to validate and get email for notification
    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { data: targetUser, error: targetUserError } = await (supabase as any)
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found in organization' },
        { status: 404 }
      )
    }

    // Validate: Cannot remove owner
    if (targetUser.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove organization owner' },
        { status: 400 }
      )
    }

    // Get user email before removal for notification
    const memberEmail = targetUser.email

    // Remove user from organization: Set users.org_id = NULL
    // Note: We filter by org_id BEFORE the update, not after (since we're setting it to null)
    const { error: updateError } = await supabase
      .from('users')
      .update({ org_id: null })
      .eq('id', userId)
      .eq('org_id', currentUser.org_id)

    if (updateError) {
      console.error('Failed to remove user from organization:', updateError)
      return NextResponse.json(
        { error: 'Failed to remove member. Please try again.' },
        { status: 500 }
      )
    }

    // Get organization name for email
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', currentUser.org_id)
      .single()

    // Send removal notification email (non-blocking)
    try {
      await sendMemberRemovedEmail({
        to: memberEmail,
        memberName: memberEmail,
        organizationName: organization?.name || 'the organization',
      })
    } catch (emailError) {
      console.error('Failed to send member removed email:', emailError)
      // Don't fail the request if email fails
    }

    // Log audit event for compliance
    logActionAsync({
      orgId: currentUser.org_id,
      userId: currentUser.id,
      action: AuditAction.TEAM_MEMBER_REMOVED,
      details: {
        removedUserId: userId,
        removedUserEmail: memberEmail,
        removedUserRole: targetUser.role,
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

    console.error('Remove member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

