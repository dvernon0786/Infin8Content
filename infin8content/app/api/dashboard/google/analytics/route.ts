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
    if (!meta || !('property_id' in meta)) {
      return NextResponse.json({ connected: false })
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
