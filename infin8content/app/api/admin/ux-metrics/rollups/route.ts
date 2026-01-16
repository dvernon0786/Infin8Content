import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'

/**
 * GET /api/admin/ux-metrics/rollups
 * 
 * Returns UX metrics weekly rollups for the authenticated user's organization.
 * Only organization owners can access this endpoint.
 * 
 * Query Parameters:
 * - limit (optional): number of weeks to return (default: 12)
 * 
 * Response (Success - 200):
 * - success: true
 * - rollups: Array of weekly rollup objects
 * 
 * Response (Error - 401): Unauthorized
 * - error: string
 * 
 * Response (Error - 403): Forbidden (not an owner)
 * - error: string
 * 
 * Response (Error - 500): Internal server error
 * - error: string
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's organization and role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Only owners can access UX metrics
    if (profile.role !== 'owner') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only organization owners can access UX metrics.' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '12', 10), 1), 52) // 1-52 weeks (1 year)

    // Fetch weekly rollups for the organization
    const { data: rollups, error: rollupsError } = await (supabase
      .from('ux_metrics_weekly_rollups' as any)
      .select('*')
      .eq('org_id', profile.org_id)
      .order('week_start', { ascending: false })
      .limit(limit) as unknown as Promise<{
        data: Array<{
          id: string
          org_id: string
          week_start: string
          metrics: Json
          created_at: string
        }> | null
        error: any
      }>)

    if (rollupsError) {
      console.error('Failed to fetch UX metrics rollups:', rollupsError)
      return NextResponse.json(
        { error: 'Failed to fetch UX metrics rollups' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      rollups: rollups || [],
    })
  } catch (error: any) {
    console.error('UX metrics rollups API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
