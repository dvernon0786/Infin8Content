/**
 * GET /api/dashboard/google/indexing
 *
 * Fetch Google Search Console URL indexing status and submission history.
 * Returns metrics about discovered, indexed, and crawl-error URLs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { getValidTokens } from '@/lib/services/google/credential-manager'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.org_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tokens = await getValidTokens(user.org_id)

    // Return mock data regardless of connection status for now
    // In production, would call real Google Search Console API with tokens
    const indexingData = {
      indexedUrls: 1247,
      discoveredUrls: 1563,
      crawlErrors: 8,
      pendingUrls: 156,
      lastSubmission: new Date().toLocaleDateString(),
      submissionHistory: [
        { date: '2024-01-01', count: 15, status: 'success' as const },
        { date: '2024-01-02', count: 23, status: 'success' as const },
        { date: '2024-01-03', count: 18, status: 'success' as const },
        { date: '2024-01-04', count: 31, status: 'success' as const },
        { date: '2024-01-05', count: 12, status: 'success' as const },
        { date: '2024-01-06', count: 27, status: 'success' as const },
        { date: '2024-01-07', count: 19, status: 'pending' as const },
      ],
    }

    return NextResponse.json(indexingData)
  } catch (error) {
    console.error('Indexing API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch indexing data' },
      { status: 500 }
    )
  }
}
