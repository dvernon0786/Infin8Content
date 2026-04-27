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

    // Return mock data if not connected (for dashboard testing)
    if (!meta || !('site_url' in meta)) {
      return NextResponse.json({
        metrics: {
          clicks: 1240,
          impressions: 35800,
          ctr: 0.0346,
          position: 8.5,
        },
        topQueries: [
          { query: 'best content management system', clicks: 145, impressions: 3200, ctr: 0.045, position: 5.2 },
          { query: 'how to write better articles', clicks: 98, impressions: 2800, ctr: 0.035, position: 7.8 },
          { query: 'content automation tools', clicks: 87, impressions: 2100, ctr: 0.041, position: 6.5 },
          { query: 'SEO optimization guide', clicks: 64, impressions: 1900, ctr: 0.034, position: 9.2 },
          { query: 'blog writing tips', clicks: 52, impressions: 1600, ctr: 0.033, position: 10.1 },
        ],
        topPages: [
          { page: '/blog/content-creation-guide', clicks: 320, impressions: 5200, ctr: 0.061, position: 3.2 },
          { page: '/blog/seo-best-practices', clicks: 280, impressions: 4800, ctr: 0.058, position: 4.1 },
          { page: '/articles/ai-writing', clicks: 215, impressions: 3900, ctr: 0.055, position: 5.8 },
          { page: '/resources/templates', clicks: 185, impressions: 3400, ctr: 0.054, position: 6.5 },
          { page: '/blog/keyword-research', clicks: 160, impressions: 2900, ctr: 0.055, position: 7.2 },
        ],
      })
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
