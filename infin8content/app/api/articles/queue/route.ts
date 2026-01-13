import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { NextResponse } from 'next/server'

/**
 * GET /api/articles/queue
 * 
 * Fetches the current queue status for article generation in the user's organization.
 * Returns articles with status "queued", "generating", and "completed" for dashboard display.
 * 
 * @param request - HTTP request with orgId query parameter
 * @returns JSON response with articles array and their queue positions
 * 
 * Query Parameters:
 * - orgId: string (required) - Organization ID to fetch queue for
 * - includeCompleted: boolean (optional) - Include completed articles (default: true)
 * - limit: number (optional) - Maximum number of articles to return (default: 50)
 * 
 * Response (Success - 200):
 * - articles: Array<{ id: string, keyword: string, status: "queued" | "generating" | "completed", created_at: string, updated_at: string, position?: number }>
 *   - position is only present for queued articles (1-based index among queued articles only)
 *   - updated_at included for real-time dashboard updates
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
    const includeCompleted = searchParams.get('includeCompleted') !== 'false' // Default to true
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100 for performance

    if (orgId !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Build the status filter based on includeCompleted parameter
    const statusFilter = includeCompleted 
      ? ['queued', 'generating', 'completed']
      : ['queued', 'generating']

    // Type assertion needed until database types are regenerated after migration
    // TODO: Remove type assertion after running: supabase gen types typescript --project-id ybsgllsnaqkpxgdjdvcz > lib/supabase/database.types.ts
    const { data: articles, error } = await (supabase
      .from('articles' as any)
      .select(`
        id, 
        keyword, 
        status, 
        created_at, 
        updated_at, 
        title,
        article_progress (
          status,
          progress_percentage,
          current_section,
          total_sections,
          current_stage,
          estimated_time_remaining,
          word_count,
          citations_count,
          api_cost,
          error_message,
          updated_at
        )
      `)
      .eq('org_id', currentUser.org_id)
      .in('status', statusFilter)
      .order('updated_at', { ascending: false })
      .limit(limit) as unknown as Promise<{ data: any[]; error: any }>)

    if (error) {
      console.error('Failed to fetch queue status:', error)
      return NextResponse.json(
        { error: 'Failed to fetch queue status' },
        { status: 500 }
      )
    }

    // Add position numbers for queued articles (only count queued articles, exclude generating and completed)
    const queuedArticles = (articles || []).filter(a => a.status === 'queued')
    const articlesWithPosition = (articles || []).map(article => {
      // Extract progress data from article_progress relationship
      const progressData = article.article_progress?.[0] || null;
      
      return {
        ...article,
        position: article.status === 'queued' 
          ? queuedArticles.findIndex(q => q.id === article.id) + 1 
          : undefined,
        // Add progress data for visualization
        progress: progressData ? {
          status: progressData.status,
          progress_percentage: progressData.progress_percentage || 0,
          current_section: progressData.current_section || 1,
          total_sections: progressData.total_sections || 1,
          current_stage: progressData.current_stage || 'Processing',
          estimated_time_remaining: progressData.estimated_time_remaining,
          word_count: progressData.word_count || 0,
          citations_count: progressData.citations_count || 0,
          api_cost: progressData.api_cost || 0,
          error_message: progressData.error_message,
          updated_at: progressData.updated_at
        } : null,
        // Remove the raw article_progress data to clean up the response
        article_progress: undefined
      };
    })

    console.log('📤 API returning', articlesWithPosition.length, 'articles:', articlesWithPosition.map(a => ({ id: a.id, status: a.status, title: a.title })));

    return NextResponse.json({
      articles: articlesWithPosition,
      total: articles?.length || 0,
      includeCompleted,
    })
  } catch (error) {
    console.error('Queue status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queue status' },
      { status: 500 }
    )
  }
}

