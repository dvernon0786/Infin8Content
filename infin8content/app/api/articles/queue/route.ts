import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { NextResponse } from 'next/server'

/**
 * GET /api/articles/queue
 * 
 * Fetches the current queue status for article generation in the user's organization.
 * Returns articles with status "queued" or "generating", with position numbers for queued articles.
 * 
 * @param request - HTTP request with orgId query parameter
 * @returns JSON response with articles array and their queue positions
 * 
 * Query Parameters:
 * - orgId: string (required) - Organization ID to fetch queue for
 * 
 * Response (Success - 200):
 * - articles: Array<{ id: string, keyword: string, status: "queued" | "generating", created_at: string, position?: number }>
 *   - position is only present for queued articles (1-based index among queued articles only)
 * 
 * Response (Error - 401):
 * - error: "Authentication required"
 * 
 * Response (Error - 403):
 * - error: "Unauthorized" - User doesn't belong to the specified organization
 * 
 * Response (Error - 500):
 * - error: string - Server error message
 * 
 * Authentication: Requires authenticated user session
 * Authorization: User must belong to the organization specified in orgId parameter
 */
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (orgId !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { data: articles, error } = await (supabase as any)
      .from('articles')
      .select('id, keyword, status, created_at')
      .eq('org_id', currentUser.org_id)
      .in('status', ['queued', 'generating'])
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch queue status:', error)
      return NextResponse.json(
        { error: 'Failed to fetch queue status' },
        { status: 500 }
      )
    }

    // Add position numbers for queued articles (only count queued articles, exclude generating)
    const queuedArticles = (articles || []).filter(a => a.status === 'queued')
    const articlesWithPosition = (articles || []).map(article => ({
      ...article,
      position: article.status === 'queued' 
        ? queuedArticles.findIndex(q => q.id === article.id) + 1 
        : undefined,
    }))

    return NextResponse.json({
      articles: articlesWithPosition,
    })
  } catch (error) {
    console.error('Queue status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queue status' },
      { status: 500 }
    )
  }
}

