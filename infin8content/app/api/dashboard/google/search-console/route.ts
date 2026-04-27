import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { getIntegrationMeta } from '@/lib/services/google/credential-manager'
import { fetchSearchConsoleOverview } from '@/lib/services/google/search-console-client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const meta = await getIntegrationMeta(currentUser.org_id, 'search_console')
    if (!meta || !('site_url' in meta)) {
      return NextResponse.json({ connected: false })
    }

    const data = await fetchSearchConsoleOverview(
      currentUser.org_id,
      meta.site_url,
      startDate || undefined,
      endDate || undefined
    )

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[Google Search Console API] Error:', err?.message)
    return NextResponse.json({ error: err?.message || 'Failed to fetch search console data' }, { status: 500 })
  }
}
