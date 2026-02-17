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
import { WorkflowFSM } from '@/lib/fsm/workflow-fsm'

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

    // 1️⃣ AUTH: Already handled above
    
    // 2️⃣ FETCH WORKFLOW (READ ONLY)
    const supabase = createServiceRoleClient()
    const { data: workflow, error } = await supabase
      .from('intent_workflows')
      .select('id, state, organization_id')
      .eq('id', workflowId)
      .eq('organization_id', currentUser.org_id)
      .single() as { data: { id: string; state: string; organization_id: string } | null; error: any }

    if (error || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    const currentState = workflow.state

    // 3️⃣ IDEMPOTENCY CASE
    // If not exactly at this step — return success safely (future-proof)
    if (currentState !== 'step_6_clustering') {
      return NextResponse.json({
        success: true,
        workflow_id: workflowId,
        workflow_state: currentState,
        cached: true
      })
    }

    // 4️⃣ STRICT FSM GUARD
    if (!WorkflowFSM.canTransition(currentState as any, 'CLUSTERING_START')) {
      return NextResponse.json(
        {
          error: 'INVALID_STATE',
          message: `Workflow must be in step_6_clustering. Current state: ${currentState}` 
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
        current_state: currentState
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    // 5️⃣ EXECUTE BUSINESS LOGIC
    // DEFENSE IN DEPTH: Verify sufficient user-selected keywords exist for clustering
    const { count: keywordCount, error: keywordError } = await supabase
      .from('keywords')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('workflow_id', workflowId)
      .eq('user_selected', true) // CRITICAL: Only cluster user-selected keywords
      .is('parent_seed_keyword_id', null)  // Match Step 3 filter - only seed keywords

    if (keywordError) {
      return NextResponse.json(
        { error: 'Failed to verify keyword count for clustering' },
        { status: 500 }
      )
    }

    // ENTERPRISE GUARD: Cap clustering input to prevent compute explosion
    if (!keywordCount || keywordCount < 2) {
      return NextResponse.json(
        {
          error: 'Insufficient keywords for clustering',
          message: 'At least 2 selected keywords are required for clustering. Please select more keywords in Step 3.',
          code: 'INSUFFICIENT_KEYWORDS_FOR_CLUSTERING'
        },
        { status: 400 }
      )
    }

    if (keywordCount > 100) {
      return NextResponse.json(
        {
          error: 'Too many keywords selected for clustering',
          message: 'Maximum 100 keywords can be selected for clustering. Please deselect some keywords or use bulk actions to select top keywords by volume.',
          code: 'TOO_MANY_KEYWORDS_SELECTED',
          maxAllowed: 100,
          currentSelected: keywordCount
        },
        { status: 400 }
      )
    }

    console.log(`[ClusterTopics] Found ${keywordCount} seed keywords available for clustering`)

    // Initialize clusterer and perform clustering on user-selected keywords only
    const clusterer = new KeywordClusterer()
    const clusterResult = await clusterer.clusterKeywords(workflowId, {
      similarityThreshold: 0.6,
      maxSpokesPerHub: 8,
      minClusterSize: 3,
      userSelectedOnly: true // CRITICAL: Only cluster user-selected keywords
    })

    // BLOCK advancement if no clusters created
    if (clusterResult.cluster_count === 0) {
      return NextResponse.json(
        {
          error: 'No clusters created',
          message: 'Clustering produced no valid clusters. Try adjusting clustering parameters or adding more diverse keywords.',
          code: 'NO_CLUSTERS_CREATED'
        },
        { status: 400 }
      )
    }

    // Update workflow metadata
    const { error: updateError } = await supabase
      .from('intent_workflows')
      .update({
        cluster_count: clusterResult.cluster_count,
        keywords_clustered: clusterResult.keywords_clustered
      })
      .eq('id', workflowId)
      .eq('organization_id', organizationId)  // CRITICAL: Add tenant isolation

    if (updateError) {
      console.error('Failed to update workflow metadata:', updateError)
      return NextResponse.json(
        {
          error: 'Failed to update workflow metadata',
          message: 'Clustering completed but workflow metadata could not be updated.',
          code: 'WORKFLOW_UPDATE_FAILED'
        },
        { status: 500 }
      )
    }

    // 6️⃣ FSM TRANSITION (ONLY STATE CHANGE POINT)
    const nextState = await WorkflowFSM.transition(
      workflowId,
      'CLUSTERING_START',
      { userId: currentUser.id }
    )

    // 7️⃣ RETURN AUTHORITATIVE NEXT STATE
    return NextResponse.json({
      success: true,
      workflow_id: workflowId,
      workflow_state: nextState,
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
    if (workflowId && organizationId) {
      const supabase = createServiceRoleClient()
      await supabase
        .from('intent_workflows')
        .update({
          // Note: Error handling removed - step_6_clustering_error_message column no longer exists
        })
        .eq('id', workflowId)
        .eq('organization_id', organizationId)  // CRITICAL: Add tenant isolation to error path
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
