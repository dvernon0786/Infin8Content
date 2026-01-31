/**
 * ICP Generation API Endpoint
 * Story 34.1: Generate ICP Document via Perplexity AI
 * 
 * POST /api/intent/workflows/{workflow_id}/steps/icp-generate
 * Triggers ICP generation for a workflow step
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import {
  generateICPDocument,
  storeICPGenerationResult,
  handleICPGenerationFailure,
  type ICPGenerationRequest
} from '@/lib/services/intent-engine/icp-generator'

// Rate limiting: Track ICP generation requests per organization
// Key: organization_id, Value: { count: number, resetAt: number }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 3600000 // 1 hour
const MAX_REQUESTS_PER_HOUR = 10 // Max 10 ICP generations per organization per hour

function checkRateLimit(organizationId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const existing = rateLimitMap.get(organizationId)

  if (!existing || now > existing.resetAt) {
    // Reset window
    rateLimitMap.set(organizationId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR - 1 }
  }

  if (existing.count >= MAX_REQUESTS_PER_HOUR) {
    return { allowed: false, remaining: 0 }
  }

  existing.count++
  return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR - existing.count }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { workflow_id: string } }
) {
  const workflowId = params.workflow_id
  let organizationId: string | undefined

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

    // Check rate limit
    const rateLimit = checkRateLimit(organizationId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Maximum 10 ICP generations per organization per hour'
        },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()
    const icpRequest: ICPGenerationRequest = {
      organizationName: body.organization_name,
      organizationUrl: body.organization_url,
      organizationLinkedInUrl: body.organization_linkedin_url
    }

    // Validate request
    if (!icpRequest.organizationName || !icpRequest.organizationUrl || !icpRequest.organizationLinkedInUrl) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'organization_name, organization_url, and organization_linkedin_url are required'
        },
        { status: 400 }
      )
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

    // Type assertion for workflow data
    const typedWorkflow = workflow as unknown as { id: string; status: string; organization_id: string }

    // Check if workflow is in correct state for ICP generation
    if (typedWorkflow.status !== 'step_0_auth' && typedWorkflow.status !== 'step_1_icp') {
      return NextResponse.json(
        {
          error: 'Invalid workflow state',
          message: `Workflow must be in step_0_auth or step_1_icp state, currently in ${typedWorkflow.status}`
        },
        { status: 400 }
      )
    }

    // Check for idempotency - if ICP already generated, return existing result
    const { data: existingWorkflow, error: fetchError } = await supabase
      .from('intent_workflows')
      .select('icp_data, step_1_icp_completed_at')
      .eq('id', workflowId)
      .eq('organization_id', organizationId)
      .single()

    if (!fetchError && existingWorkflow && (existingWorkflow as any).icp_data) {
      console.log(`[ICP-Generate] ICP already exists for workflow ${workflowId}, returning cached result`)
      return NextResponse.json({
        success: true,
        workflow_id: workflowId,
        status: 'step_1_icp',
        icp_data: (existingWorkflow as any).icp_data,
        cached: true,
        metadata: {
          generated_at: (existingWorkflow as any).step_1_icp_completed_at
        }
      })
    }

    // Generate ICP document
    const icpResult = await generateICPDocument(icpRequest, organizationId)

    // Store result in workflow
    await storeICPGenerationResult(workflowId, organizationId, icpResult)

    // Emit analytics event for workflow step completion
    try {
      const analyticsEvent = {
        event_type: 'workflow_step_completed',
        workflow_id: workflowId,
        organization_id: organizationId,
        step: 'step_1_icp',
        status: 'success',
        metadata: {
          tokens_used: icpResult.tokensUsed,
          model_used: icpResult.modelUsed,
          generated_at: icpResult.generatedAt
        },
        timestamp: new Date().toISOString()
      }
      console.log(`[ICP-Generate] Analytics event: ${JSON.stringify(analyticsEvent)}`)
    } catch (analyticsError) {
      console.error(`[ICP-Generate] Failed to emit analytics event:`, analyticsError)
    }

    // Log activity
    console.log(`[ICP-Generate] Successfully generated ICP for workflow ${workflowId}`)

    return NextResponse.json({
      success: true,
      workflow_id: workflowId,
      status: 'step_1_icp',
      icp_data: icpResult.icp_data,
      metadata: {
        tokens_used: icpResult.tokensUsed,
        model_used: icpResult.modelUsed,
        generated_at: icpResult.generatedAt
      }
    })
  } catch (error) {
    // Log error
    console.error(`[ICP-Generate] Error generating ICP:`, error)

    // Update workflow with error status if we have the necessary IDs
    if (workflowId && organizationId) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await handleICPGenerationFailure(workflowId, organizationId, new Error(errorMessage))
    }

    // Return error response
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate ICP document'
    return NextResponse.json(
      {
        error: 'ICP generation failed',
        message: errorMessage,
        workflow_id: workflowId
      },
      { status: 500 }
    )
  }
}
