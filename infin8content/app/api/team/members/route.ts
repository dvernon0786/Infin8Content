import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'

// TypeScript response types
export interface TeamMember {
  id: string
  email: string
  role: string
  createdAt: string
}

export interface PendingInvitation {
  id: string
  email: string
  role: string
  expiresAt: string
  createdAt: string
}

export interface GetTeamMembersSuccessResponse {
  members: TeamMember[]
  pendingInvitations: PendingInvitation[]
}

export interface GetTeamMembersErrorResponse {
  error: string
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const supabase = await createClient()

    // Query users table: All users with org_id = currentUser.org_id
    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { data: members, error: membersError } = await (supabase as any)
      .from('users')
      .select('id, email, role, created_at')
      .eq('org_id', currentUser.org_id)
      .order('created_at', { ascending: false })

    if (membersError) {
      console.error('Failed to fetch team members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      )
    }

    // Query team_invitations table: All pending invitations for organization
    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { data: pendingInvitations, error: invitationsError } = await (supabase as any)
      .from('team_invitations')
      .select('id, email, role, expires_at, created_at, created_by')
      .eq('org_id', currentUser.org_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (invitationsError) {
      console.error('Failed to fetch pending invitations:', invitationsError)
      // Don't fail the request, just return empty array
    }

    return NextResponse.json({
      members: ((members || []) as any[]).map((member: any) => ({
        id: member.id,
        email: member.email,
        role: member.role,
        createdAt: member.created_at,
      })),
      pendingInvitations: ((pendingInvitations || []) as any[]).map((invitation: any) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at,
      })),
    })
  } catch (error) {
    console.error('Get team members error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

