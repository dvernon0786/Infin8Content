/**
 * Link Articles API Endpoint
 * Story 38.3: Link Generated Articles to Intent Workflow
 * 
 * POST /api/intent/workflows/{workflow_id}/steps/link-articles
 * Links completed articles back to their originating intent workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import {
  linkArticlesToWorkflow,
  validateWorkflowAccess,
  type LinkingResult
} from '@/lib/services/intent-engine/article-workflow-linker'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflow_id: string }> }
) {
  const { workflow_id } = await params
  const workflowId = workflow_id
  let organizationId: string = ''
  let userId: string = ''

  try {
    // Authenticate user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    organizationId = currentUser.org_id
    userId = currentUser.id

    // Verify user has access to workflow
    const hasAccess = await validateWorkflowAccess(userId, workflowId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Verify workflow exists and belongs to user's organization
    const supabase = await createServiceRoleClient()
    const { data: workflow, error: workflowError } = await supabase
      .from('intent_workflows')
      .select('id, state, organization_id')
      .eq('id', workflowId)
      .eq('organization_id', organizationId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Type assertion for workflow data
    const typedWorkflow = workflow as unknown as { id: string; status: string; organization_id: string }

    // Check if workflow is in correct state for article linking
    if (typedWorkflow.status !== 'step_9_articles') {
      return NextResponse.json(
        {
          error: 'Invalid workflow state',
          message: `Workflow must be in step_9_articles state, currently in ${typedWorkflow.status}`
        },
        { status: 400 }
      )
    }

    // Log action start
    try {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_ARTICLES_LINKING_STARTED,
        details: {
          workflow_id: workflowId,
          workflow_status: typedWorkflow.status
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      console.error('Failed to log workflow start:', logError)
      // Continue anyway - logging is non-blocking
    }

    console.log(`[LinkArticles] Starting article linking for workflow ${workflowId}`)

    // Execute article linking
    const startTime = Date.now()
    const linkingResult = await linkArticlesToWorkflow(workflowId, userId)
    const duration = Date.now() - startTime

    console.log(`[LinkArticles] Completed linking in ${duration}ms`)

    // Log completion
    try {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_ARTICLES_LINKING_COMPLETED,
        details: {
          workflow_id: workflowId,
          workflow_status: linkingResult.workflow_status,
          total_articles: linkingResult.total_articles,
          linked_articles: linkingResult.linked_articles,
          failed_articles: linkingResult.failed_articles,
          processing_time_seconds: linkingResult.processing_time_seconds
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      console.error('Failed to log workflow completion:', logError)
      // Continue anyway - logging is non-blocking
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: linkingResult
    })

  } catch (error) {
    console.error('[LinkArticles] Error:', error)

    // Log failure
    try {
      await logActionAsync({
        orgId: organizationId || '',
        userId: userId || '',
        action: AuditAction.WORKFLOW_ARTICLES_LINKING_FAILED,
        details: {
          workflow_id: workflowId,
          error_details: error instanceof Error ? error.message : 'Unknown error'
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      console.error('Failed to log workflow failure:', logError)
      // Continue anyway - logging is non-blocking
    }

    // Return error response
    return NextResponse.json(
      {
        error: 'Failed to link articles to workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
