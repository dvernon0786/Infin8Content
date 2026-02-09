/**
 * API Endpoint: GET /api/intent/workflows/[workflow_id]/articles/progress
 * Story 38.2: Track Article Generation Progress
 * 
 * Provides read-only access to article generation progress for intent workflows.
 * Supports filtering, pagination, and returns comprehensive progress statistics.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { 
  getWorkflowArticleProgress,
  formatProgressResponse,
  validateWorkflowAccess
} from '@/lib/services/intent-engine/article-progress-tracker'
import { logActionAsync } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflow_id: string }> }
) {
  try {
    // Get current user and validate authentication
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Await the params object (Next.js 16.1.1 change)
    const { workflow_id: workflowId } = await params
    if (!workflowId) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Workflow ID is required' } },
        { status: 400 }
      )
    }

    // Validate user has access to the workflow
    const hasAccess = await validateWorkflowAccess(currentUser.id, workflowId)
    if (!hasAccess) {
      return NextResponse.json(
        { 
          error: { 
            code: 'FORBIDDEN', 
            message: 'Workflow does not exist or you do not have access' 
          } 
        },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filters = {
      status: searchParams.get('status') as 
        'queued' | 'generating' | 'completed' | 'failed' | undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      limit: Math.min(parseInt(searchParams.get('limit') || '100'), 1000), // Cap at 1000
      offset: parseInt(searchParams.get('offset') || '0')
    }

    // Validate date formats if provided
    if (filters.date_from && isNaN(Date.parse(filters.date_from))) {
      return NextResponse.json(
        { 
          error: { 
            code: 'INVALID_DATE_FORMAT', 
            message: 'date_from must be a valid ISO 8601 date' 
          } 
        },
        { status: 400 }
      )
    }

    if (filters.date_to && isNaN(Date.parse(filters.date_to))) {
      return NextResponse.json(
        { 
          error: { 
            code: 'INVALID_DATE_FORMAT', 
            message: 'date_to must be a valid ISO 8601 date' 
          } 
        },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (filters.status && !['queued', 'generating', 'completed', 'failed'].includes(filters.status)) {
      return NextResponse.json(
        { 
          error: { 
            code: 'INVALID_STATUS', 
            message: 'Status must be one of: queued, generating, completed, failed' 
          } 
        },
        { status: 400 }
      )
    }

    // Fetch article progress data
    const articles = await getWorkflowArticleProgress(workflowId, filters)
    
    // Format response with summary statistics
    const response = formatProgressResponse(articles, workflowId)

    // Log audit event for progress query
    await logActionAsync({
      orgId: currentUser.org_id || '',
      userId: currentUser.id,
      action: AuditAction.WORKFLOW_ARTICLE_GENERATION_PROGRESS_QUERIED,
      details: {
        workflow_id: workflowId,
        article_count: articles.length,
        filters_applied: filters
      },
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in article progress endpoint:', error)
    
    // Log error event
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        // Await the params object (Next.js 16.1.1 change)
        const { workflow_id } = await params
        await logActionAsync({
          orgId: currentUser.org_id || '',
          userId: currentUser.id,
          action: AuditAction.WORKFLOW_ARTICLE_GENERATION_PROGRESS_ERROR,
          details: {
            workflow_id,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          ipAddress: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        })
      }
    } catch (logError) {
      // Ignore logging errors to avoid infinite loops
    }

    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'An error occurred while fetching article progress' 
        } 
      },
      { status: 500 }
    )
  }
}
