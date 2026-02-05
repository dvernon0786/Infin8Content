import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { calculateArticleProgress } from '@/lib/services/article-generation/progress-calculator'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { ProgressApiResponse, ProgressApiErrorResponse } from '@/types/article'
import { NextResponse } from 'next/server'

/**
 * GET /api/articles/[article_id]/progress
 * 
 * Returns real-time progress of article generation for a specific article.
 * 
 * @param request - HTTP request
 * @param params - Route parameters containing article_id
 * @returns JSON response with article progress data, or error details
 * 
 * Response (Success - 200):
 * - success: boolean
 * - data: ArticleProgress object containing:
 *   - articleId: string
 *   - status: 'queued' | 'generating' | 'completed' | 'failed'
 *   - progress: {
 *     - completedSections: number
 *     - totalSections: number
 *     - percentage: number
 *     - currentSection?: { id, section_order, section_header, status }
 *   }
 *   - timing: {
 *     - startedAt?: string
 *     - estimatedCompletionAt?: string
 *     - averageSectionDurationSeconds?: number
 *   }
 *   - error?: { message, failedSectionOrder?, failedAt? }
 * 
 * Response (Error - 401):
 * - success: false
 * - error: 'Authentication required'
 * 
 * Response (Error - 403):
 * - success: false
 * - error: 'Access denied'
 * 
 * Response (Error - 404):
 * - success: false
 * - error: 'Article not found'
 * 
 * Security:
 * - Authentication required (user must be logged in)
 * - Organization isolation enforced (user can only access their org's articles)
 * - Article ID validation and sanitization
 * 
 * Performance:
 * - Target: < 200ms response time
 * - Single database query with sections join
 * - Safe to cache (read-only data)
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ article_id: string }> }
) {
  const { article_id: articleId } = await context.params
  
  try {
    // Authenticate user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json<ProgressApiErrorResponse>(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const organizationId = currentUser.org_id

    // Validate article ID format
    if (!articleId || typeof articleId !== 'string' || articleId.length < 10) {
      return NextResponse.json<ProgressApiErrorResponse>(
        { success: false, error: 'Invalid article ID', code: 'INVALID_REQUEST' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Query article with sections, enforcing organization isolation
    const { data: articleData, error: articleError } = await (supabase
      .from('articles' as any)
      .select(`
        id,
        status,
        generation_started_at,
        organization_id,
        article_sections (
          id,
          section_order,
          section_header,
          status,
          updated_at
        )
      `)
      .eq('id', articleId)
      .eq('organization_id', organizationId)  // Defensive filtering
      .single() as any);

    if (articleError) {
      if (articleError.code === 'PGRST116') {
        // No rows returned - article not found or access denied
        return NextResponse.json(
          { success: false, error: 'Article not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      )
    }

    if (!articleData) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      )
    }

    // Additional security check: ensure article belongs to user's organization
    if ((articleData as any).organization_id !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Calculate progress using the pure function
    const progress = calculateArticleProgress({
      article: {
        id: (articleData as any).id,
        status: (articleData as any).status,
        generation_started_at: (articleData as any).generation_started_at,
        organization_id: (articleData as any).organization_id
      },
      sections: (articleData as any).article_sections || []
    })

    // Log the progress query for audit (non-blocking)
    // Fire and forget - don't await or handle errors to avoid blocking response
    setTimeout(async () => {
      try {
        await logActionAsync({
          orgId: organizationId,
          userId: currentUser.id,
          action: AuditAction.WORKFLOW_ARTICLE_GENERATION_PROGRESS_QUERIED,
          details: {
            articleId: articleId,
            articleStatus: (articleData as any).status,
            progressPercentage: progress.progress.percentage,
            completedSections: progress.progress.completedSections,
            totalSections: progress.progress.totalSections
          },
          ipAddress: extractIpAddress(request.headers),
          userAgent: extractUserAgent(request.headers),
        })
      } catch (error) {
        // Audit logging failure should not block the response
      }
    }, 0)

    return NextResponse.json({
      success: true,
      data: progress
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
