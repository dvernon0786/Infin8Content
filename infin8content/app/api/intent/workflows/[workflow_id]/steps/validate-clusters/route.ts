/**
 * Cluster Validation API Endpoint
 * Story 36.3: Validate Cluster Coherence and Structure
 * 
 * POST /api/intent/workflows/{workflow_id}/steps/validate-clusters
 * Validates hub-and-spoke keyword clusters for structural correctness and semantic coherence
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { ClusterValidator } from '@/lib/services/intent-engine/cluster-validator'
import { retryWithPolicy } from '@/lib/services/intent-engine/retry-utils'
import { enforceICPGate } from '@/lib/middleware/intent-engine-gate'
import { WorkflowFSM } from '@/lib/fsm/workflow-fsm'

// Custom retry policy for cluster validation (2s → 4s → 8s as per story requirements)
const CLUSTER_VALIDATION_RETRY_POLICY = {
  maxAttempts: 3,
  initialDelayMs: 2000,  // 2 seconds
  backoffMultiplier: 2,
  maxDelayMs: 8000       // 8 seconds max
}

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
    if (currentState !== 'step_7_validation') {
      return NextResponse.json({
        success: true,
        workflow_id: workflowId,
        workflow_state: currentState,
        cached: true
      })
    }

    // 4️⃣ STRICT FSM GUARD
    if (!WorkflowFSM.canTransition(currentState as any, 'VALIDATION_COMPLETED')) {
      return NextResponse.json(
        {
          error: 'INVALID_STATE',
          message: `Workflow must be in step_7_validation. Current state: ${currentState}` 
        },
        { status: 409 }
      )
    }

    // Log audit action
    await logActionAsync({
      orgId: organizationId,
      userId: userId,
      action: AuditAction.WORKFLOW_CLUSTER_VALIDATION_STARTED,
      details: {
        workflow_id: workflowId,
        current_state: currentState
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    // 5️⃣ EXECUTE BUSINESS LOGIC
    // Perform cluster validation with retry logic
    const validationSummary = await retryWithPolicy(
      async () => {
        // Fetch clusters for the workflow
        const { data: clusters, error: clustersError } = await supabase
          .from('topic_clusters')
          .select('*')
          .eq('workflow_id', workflowId)

        if (clustersError) {
          throw new Error(`Failed to fetch clusters: ${clustersError.message}`)
        }

        if (!clusters || clusters.length === 0) {
          throw new Error('No clusters found for validation')
        }

        // Fetch keywords for the clusters
        const keywordIds = [
          ...clusters.map((c: any) => c.hub_keyword_id),
          ...clusters.map((c: any) => c.spoke_keyword_id)
        ].filter((id: string, index: number, arr: string[]) => arr.indexOf(id) === index) // Remove duplicates

        const { data: keywords, error: keywordsError } = await supabase
          .from('keywords')
          .select('*')
          .in('id', keywordIds)

        if (keywordsError) {
          throw new Error(`Failed to fetch keywords: ${keywordsError.message}`)
        }

        if (!keywords || keywords.length === 0) {
          throw new Error('No keywords found for validation')
        }

        // Initialize validator and perform validation
        const validator = new ClusterValidator()
        return await validator.validateWorkflowClusters(workflowId, clusters as any, keywords as any)
      },
      CLUSTER_VALIDATION_RETRY_POLICY,
      'cluster validation'
    )

    // Clear previous validation results for idempotency
    const { error: clearError } = await supabase
      .from('cluster_validation_results')
      .delete()
      .eq('workflow_id', workflowId)

    if (clearError) {
      console.error('Failed to clear previous validation results:', clearError)
      // Don't fail the request, but log the error
    }

    // Store validation results
    const validationResults = validationSummary.results
    for (const result of validationResults) {
      const { error: insertError } = await supabase
        .from('cluster_validation_results')
        .insert({
          workflow_id: result.workflow_id,
          hub_keyword_id: result.hub_keyword_id,
          validation_status: result.validation_status,
          avg_similarity: result.avg_similarity,
          spoke_count: result.spoke_count
        })

      if (insertError) {
        console.error('Failed to store validation result:', insertError)
        // Don't fail the request, but log the error
      }
    }

    // Update workflow metadata
    const { error: updateError } = await supabase
      .from('intent_workflows')
      .update({
        valid_cluster_count: validationSummary.valid_clusters,
        invalid_cluster_count: validationSummary.invalid_clusters
      })
      .eq('id', workflowId)

    if (updateError) {
      console.error('Failed to update workflow metadata:', updateError)
      // Don't fail the request, but log the error
    }

    // 6️⃣ FSM TRANSITION (ONLY STATE CHANGE POINT)
    const nextState = await WorkflowFSM.transition(
      workflowId,
      'VALIDATION_COMPLETED',
      { userId: currentUser.id }
    )

    // 7️⃣ RETURN AUTHORITATIVE NEXT STATE
    return NextResponse.json({
      success: true,
      workflow_id: workflowId,
      workflow_state: nextState,
      total_clusters: validationSummary.total_clusters,
      valid_clusters: validationSummary.valid_clusters,
      invalid_clusters: validationSummary.invalid_clusters,
      completed_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cluster validation failed:', error)

    // Log error audit action
    if (organizationId && userId) {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_CLUSTER_VALIDATION_FAILED,
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
          // Note: Error handling removed - step_7_validation_error_message column no longer exists
        })
        .eq('id', workflowId)
    }

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('No clusters found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      
      if (error.message.includes('No keywords found')) {
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
      { error: 'Cluster validation failed' },
      { status: 500 }
    )
  }
}
