import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { sendRoleChangeEmail } from '@/lib/services/team-notifications'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'

const updateRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['editor', 'viewer'], {
    message: 'Role must be editor or viewer',
  }),
})

// TypeScript response types
export interface UpdateRoleSuccessResponse {
  success: true
}

export interface UpdateRoleErrorResponse {
  error: string
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id || currentUser.role !== 'owner') {
      return NextResponse.json(
        { error: "You don't have permission to update roles" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, role } = updateRoleSchema.parse(body)

    // Validate: Cannot change own role
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get target user to validate and get old role
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

    // Validate: Cannot change owner role
    if (targetUser.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot change owner role' },
        { status: 400 }
      )
    }

    // Get old role before update for email notification
    const oldRole = targetUser.role

    // Update users.role in database
    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { error: updateError } = await (supabase as any)
      .from('users')
      .update({ role })
      .eq('id', userId)
      .eq('org_id', currentUser.org_id)

    if (updateError) {
      console.error('Failed to update user role:', updateError)
      return NextResponse.json(
        { error: 'Failed to update role. Please try again.' },
        { status: 500 }
      )
    }

    // Get organization name for email
    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { data: organization, error: orgError } = await (supabase as any)
      .from('organizations')
      .select('name')
      .eq('id', currentUser.org_id)
      .single()

    if (orgError || !organization) {
      console.error('Failed to fetch organization:', orgError)
      // Continue with default name - don't fail the request
    }

    // Send role change notification email (non-blocking)
    try {
      await sendRoleChangeEmail({
        to: targetUser.email,
        memberName: targetUser.email,
        oldRole,
        newRole: role,
        organizationName: organization?.name || 'the organization',
      })
    } catch (emailError) {
      console.error('Failed to send role change email:', emailError)
      // Don't fail the request if email fails
    }

    // Log audit event for compliance
    logActionAsync({
      orgId: currentUser.org_id,
      userId: currentUser.id,
      action: AuditAction.ROLE_CHANGED,
      details: {
        targetUserId: userId,
        targetUserEmail: targetUser.email,
        oldRole,
        newRole: role,
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

    console.error('Update role error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

