import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { getWorkflowDashboard } from '@/lib/services/intent-engine/workflow-dashboard-service'

/**
 * GET /api/intent/workflows/dashboard
 * 
 * Returns dashboard data for all workflows in the user's organization
 * with real-time status, progress, and filtering capabilities.
 * 
 * Story 39.6: Create Workflow Status Dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch dashboard data
    const supabase = await createClient()
    const dashboardData = await getWorkflowDashboard(supabase, currentUser.org_id)

    // Log dashboard view
    logActionAsync({
      orgId: currentUser.org_id,
      userId: currentUser.id,
      action: AuditAction.DASHBOARD_VIEWED,
      details: {
        endpoint: '/api/intent/workflows/dashboard',
        workflow_count: dashboardData.workflows.length,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    return NextResponse.json(dashboardData)
  } catch (err: unknown) {
    console.error('Dashboard error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
