import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { getIntegrationMeta } from '@/lib/services/google/credential-manager'
import { fetchAnalyticsOverview } from '@/lib/services/google/analytics-client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate') || '30daysAgo'
  const endDate = searchParams.get('endDate') || 'today'

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const meta = await getIntegrationMeta(currentUser.org_id, 'analytics')

    // Return mock data if not connected (for dashboard testing)
    if (!meta || !('property_id' in meta)) {
      return NextResponse.json({
        total_sessions: 3250,
        total_users: 1820,
        total_pageviews: 8450,
        avg_bounce_rate: 0.35,
        avg_session_duration: 245,
        daily: [
          { date: '2024-01-01', sessions: 420, pageviews: 1120, users: 280, bounce_rate: 0.38, avg_session_duration: 240 },
          { date: '2024-01-02', sessions: 385, pageviews: 980, users: 265, bounce_rate: 0.40, avg_session_duration: 235 },
          { date: '2024-01-03', sessions: 520, pageviews: 1450, users: 340, bounce_rate: 0.32, avg_session_duration: 260 },
          { date: '2024-01-04', sessions: 480, pageviews: 1320, users: 310, bounce_rate: 0.34, avg_session_duration: 250 },
          { date: '2024-01-05', sessions: 465, pageviews: 1200, users: 300, bounce_rate: 0.36, avg_session_duration: 245 },
        ],
      })
    }

    const data = await fetchAnalyticsOverview(
      currentUser.org_id,
      meta.property_id,
      startDate,
      endDate
    )

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[Google Analytics API] Error:', err?.message)
    return NextResponse.json({ error: err?.message || 'Failed to fetch analytics' }, { status: 500 })
  }
}
