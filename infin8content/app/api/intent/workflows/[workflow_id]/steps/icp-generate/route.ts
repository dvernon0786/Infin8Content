/**
 * ICP Generation API Endpoint
 * Story 34.1: Generate ICP Document via Perplexity AI
 * Story 34.3: Harden ICP Generation with Automatic Retry & Failure Recovery
 * 
 * POST /api/intent/workflows/{workflow_id}/steps/icp-generate
 * Triggers ICP generation for a workflow step with automatic retry on transient failures
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { checkRateLimit, type RateLimitConfig } from '@/lib/services/rate-limiting/persistent-rate-limiter'
import { emitAnalyticsEvent } from '@/lib/services/analytics/event-emitter'
import {
  generateICPDocument,
  storeICPGenerationResult,
  handleICPGenerationFailure,
  type ICPGenerationRequest
} from '@/lib/services/intent-engine/icp-generator'

// Rate limit configuration for ICP generation
const RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 3600000, // 1 hour
  maxRequests: 10, // Max 10 ICP generations per organization per hour
  keyPrefix: 'icp_generation'
}

// Schema for ICP generation request
const icpGenerationSchema = z.object({
  organization_name: z.string().min(1, 'Organization name is required'),
  organization_url: z.string().url('Invalid website URL format'),
  organization_linkedin_url: z.string().url('Invalid LinkedIn URL format'),
})

// Concurrent prevention handled by database status gate (step_0_auth only)
// This provides multi-instance safety and restart resilience

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflow_id: string }> }
) {
  const { workflow_id } = await params
  const workflowId = workflow_id
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

    // Rate limiting check persistent rate limit
    const rateLimit = await checkRateLimit(organizationId, RATE_LIMIT_CONFIG)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Maximum 10 ICP generations per organization per hour',
          retryAfter: rateLimit.retryAfter
        },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = icpGenerationSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'INVALID_ICP_INPUT',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const icpRequest = validationResult.data

    // Map to expected interface format
    const mappedRequest: ICPGenerationRequest = {
      organizationName: icpRequest.organization_name,
      organizationUrl: icpRequest.organization_url,
      organizationLinkedInUrl: icpRequest.organization_linkedin_url,
    }

    // Verify workflow exists and belongs to user's organization
    const supabase = createServiceRoleClient()
    const { data: workflow, error: workflowError } = await supabase
      .from('intent_workflows')
      .select('id, status, organization_id, current_step')
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
    const typedWorkflow = workflow as unknown as { id: string; status: string; organization_id: string; current_step: number }

    // CANONICAL GUARD: Only allow step 1 when current_step = 1
    if (typedWorkflow.current_step !== 1) {
      return NextResponse.json(
        {
          error: 'INVALID_STEP_ORDER',
          message: `Workflow must be at step 1 (ICP generation), currently at step ${typedWorkflow.current_step}`
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

    // Generate deterministic idempotency key at request boundary
    const idempotencyKey = `${workflowId}:step_1_icp`

    // Generate ICP document with automatic retry
    const icpResult = await generateICPDocument(mappedRequest, organizationId, 300000, undefined, workflowId, idempotencyKey)

    // Store result in workflow with retry metadata (consolidated in single update)
    await storeICPGenerationResult(workflowId, organizationId, icpResult, idempotencyKey)

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
          ai_cost: icpResult.cost,
          generated_at: icpResult.generatedAt,
          retry_count: icpResult.retryCount || 0
        },
        timestamp: new Date().toISOString()
      }
      await emitAnalyticsEvent(analyticsEvent)
      console.log(`[ICP-Generate] Analytics event emitted: ${JSON.stringify(analyticsEvent)}`)
    } catch (analyticsError) {
      console.error(`[ICP-Generate] Failed to emit analytics event:`, analyticsError)
    }

    // Log activity
    if (icpResult.retryCount && icpResult.retryCount > 0) {
      console.log(`[ICP-Generate] Successfully generated ICP for workflow ${workflowId} after ${icpResult.retryCount} retry attempt(s)`)
    } else {
      console.log(`[ICP-Generate] Successfully generated ICP for workflow ${workflowId}`)
    }

    return NextResponse.json({
      success: true,
      workflow_id: workflowId,
      status: 'step_1_icp',
      icp_data: icpResult.icp_data,
      metadata: {
        tokens_used: icpResult.tokensUsed,
        model_used: icpResult.modelUsed,
        generated_at: icpResult.generatedAt,
        retry_count: icpResult.retryCount || 0
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
