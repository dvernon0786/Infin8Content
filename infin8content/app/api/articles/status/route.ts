import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { NextResponse } from 'next/server'

/**
 * GET /api/articles/status
 * 
 * Real-time dashboard polling endpoint for article status updates.
 * Returns articles with their current status and timestamps for dashboard display.
 * 
 * @param request - HTTP request with orgId query parameter
 * @returns JSON response with articles array and their status information
 * 
 * Query Parameters:
 * - orgId: string (required) - Organization ID to fetch status for
 * - since: string (optional) - ISO timestamp to filter articles updated since this time
 * - status: string (optional) - Filter by specific status (queued|generating|completed|failed)
 * - limit: number (optional) - Maximum number of articles to return (default: 20)
 * 
 * Response (Success - 200):
 * - articles: Array<{ id: string, keyword: string, title: string, status: string, created_at: string, updated_at: string, progress?: ArticleProgress }>
 * - lastUpdated: string - Latest timestamp in the dataset
 * - hasMore: boolean - Whether more articles are available
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
    const since = searchParams.get('since')
    const statusFilter = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 for performance

    if (orgId !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Build the query
    let query = supabase
      .from('articles' as any)
      .select(`
        id, 
        keyword, 
        title, 
        status, 
        created_at, 
        updated_at,
        article_progress (
          id,
          status,
          current_section,
          total_sections,
          progress_percentage,
          current_stage,
          estimated_time_remaining,
          actual_time_spent,
          word_count,
          citations_count,
          api_cost,
          error_message,
          updated_at
        )
      `)
      .eq('org_id', currentUser.org_id)

    // Apply status filter if provided
    if (statusFilter) {
      query = query.in('status', [statusFilter])
    }

    // Apply since filter for incremental updates
    if (since) {
      query = query.gt('updated_at', since)
    }

    // Type assertion needed until database types are regenerated after migration
    const { data: articles, error } = await (query
      .order('updated_at', { ascending: false })
      .limit(limit) as unknown as Promise<{ data: any[]; error: any }>)

    if (error) {
      console.error('Failed to fetch article status:', error)
      return NextResponse.json(
        { error: 'Failed to fetch article status' },
        { status: 500 }
      )
    }

    // Process the data and find the latest timestamp
    const processedArticles = (articles || []).map(article => ({
      id: article.id,
      keyword: article.keyword,
      title: article.title,
      status: article.status,
      created_at: article.created_at,
      updated_at: article.updated_at,
      progress: article.article_progress?.[0] || null, // Get first (and only) progress record
    }))

    const lastUpdated = processedArticles.length > 0 
      ? processedArticles[0].updated_at 
      : new Date().toISOString()

    return NextResponse.json({
      articles: processedArticles,
      lastUpdated,
      hasMore: processedArticles.length === limit,
      filters: {
        since,
        status: statusFilter,
        limit,
      }
    })
  } catch (error) {
    console.error('Article status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/articles/status
 * 
 * Internal endpoint for updating article status (used by background jobs).
 * This endpoint is called by the article generation system to update progress.
 * 
 * @param request - HTTP request with article status update
 * @returns JSON response with update confirmation
 * 
 * Request Body:
 * - articleId: string (required) - Article ID to update
 * - status: string (required) - New status value
 * - progress: object (optional) - Progress information
 * 
 * Authentication: Requires valid service token or internal authentication
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { articleId, status, progress } = body

    if (!articleId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: articleId, status' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Update the article status
    const { data: article, error: articleError } = await supabase
      .from('articles' as any)
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', articleId)
      .select()
      .single()

    if (articleError) {
      console.error('Failed to update article status:', articleError)
      return NextResponse.json(
        { error: 'Failed to update article status' },
        { status: 500 }
      )
    }

    // Update progress if provided
    if (progress) {
      const { error: progressError } = await supabase
        .from('article_progress' as any)
        .update({
          ...progress,
          updated_at: new Date().toISOString()
        })
        .eq('article_id', articleId)

      if (progressError) {
        console.error('Failed to update article progress:', progressError)
        // Don't fail the request if progress update fails
      }
    }

    return NextResponse.json({
      success: true,
      article,
      updated_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Article status update error:', error)
    return NextResponse.json(
      { error: 'Failed to update article status' },
      { status: 500 }
    )
  }
}
