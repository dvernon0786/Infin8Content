/**
 * Topic Clustering API Endpoint
 * Story 36.2: Cluster Keywords into Hub-and-Spoke Structure
 * 
 * POST /api/intent/workflows/{workflow_id}/steps/cluster-topics
 * Triggers semantic clustering of filtered keywords into hub-and-spoke topic model
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { emitAnalyticsEvent } from '@/lib/services/analytics/event-emitter'
import { KeywordClusterer } from '@/lib/services/intent-engine/keyword-clusterer'
import { enforceICPGate } from '@/lib/middleware/intent-engine-gate'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflow_id: string }> }
) {
  const { workflow_id } = await params
  const workflowId = workflow_id
  let organizationId: string | undefined
  let userId: string | undefined

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

    // ENFORCE ICP GATE - Check if ICP is complete before proceeding
    const gateResponse = await enforceICPGate(workflowId, 'cluster-topics')
    if (gateResponse) {
      return gateResponse
    }

    // Verify workflow exists and belongs to user's organization
    const supabase = createServiceRoleClient()
    const { data: workflow, error: workflowError } = await supabase
      .from('intent_workflows')
      .select('id, status, organization_id')
      .eq('id', workflowId)
      .eq('organization_id', organizationId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Type guard: ensure workflow is properly typed
    const typedWorkflow = workflow as unknown as { id: string; status: string; organization_id: string }

    // Validate workflow state - must be at step_5_filtering
    if (typedWorkflow.status !== 'step_5_filtering') {
      return NextResponse.json(
        { 
          error: 'Invalid workflow state',
          current_status: typedWorkflow.status,
          required_status: 'step_5_filtering'
        },
        { status: 409 }
      )
    }

    // Log audit action
    await logActionAsync({
      orgId: organizationId,
      userId: userId,
      action: AuditAction.WORKFLOW_TOPIC_CLUSTERING_STARTED,
      details: {
        workflow_id: workflowId,
        current_status: typedWorkflow.status
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    // Initialize clusterer and perform clustering
    const clusterer = new KeywordClusterer()
    const clusterResult = await clusterer.clusterKeywords(workflowId, {
      similarityThreshold: 0.6,
      maxSpokesPerHub: 8,
      minClusterSize: 3
    })

    // Update workflow status to step_6_clustering
    const { error: updateError } = await supabase
      .from('intent_workflows')
      .update({
        status: 'step_6_clustering',
        step_6_clustering_completed_at: new Date().toISOString(),
        cluster_count: clusterResult.cluster_count,
        keywords_clustered: clusterResult.keywords_clustered
      })
      .eq('id', workflowId)

    if (updateError) {
      console.error('Failed to update workflow status:', updateError)
      // Don't fail the request, but log the error
    }

    // Log completion audit action
    await logActionAsync({
      orgId: organizationId,
      userId: userId,
      action: AuditAction.WORKFLOW_TOPIC_CLUSTERING_COMPLETED,
      details: {
        workflow_id: workflowId,
        cluster_count: clusterResult.cluster_count,
        keywords_clustered: clusterResult.keywords_clustered,
        avg_cluster_size: clusterResult.avg_cluster_size
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    // Return success response
    return NextResponse.json({
      workflow_id: workflowId,
      status: 'step_6_clustering',
      cluster_count: clusterResult.cluster_count,
      keywords_clustered: clusterResult.keywords_clustered,
      avg_cluster_size: clusterResult.avg_cluster_size,
      completed_at: clusterResult.completed_at
    })

  } catch (error) {
    console.error('Topic clustering failed:', error)

    // Log error audit action
    if (organizationId && userId) {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_TOPIC_CLUSTERING_FAILED,
        details: {
          workflow_id: workflowId,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    }

    // Update workflow with error state
    if (workflowId) {
      const supabase = createServiceRoleClient()
      await supabase
        .from('intent_workflows')
        .update({
          step_6_clustering_error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', workflowId)
    }

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Insufficient keywords')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      
      if (error.message.includes('Workflow not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Topic clustering failed' },
      { status: 500 }
    )
  }
}
