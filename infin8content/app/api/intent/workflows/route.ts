import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { logIntentActionAsync } from '@/lib/services/intent-engine/intent-audit-logger'
import { AuditAction } from '@/types/audit'
import { isFeatureFlagEnabled } from '@/lib/utils/feature-flags'
import { FEATURE_FLAG_KEYS } from '@/lib/types/feature-flag'
import { validateOnboardingComplete } from '@/lib/validators/onboarding-validator'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import type { 
  CreateIntentWorkflowRequest, 
  CreateIntentWorkflowResponse,
  IntentWorkflowStatus,
  IntentWorkflow
} from '@/lib/types/intent-workflow'

/**
 * Zod schema for intent workflow creation request validation
 * Validates and sanitizes user input before processing
 */
const createWorkflowSchema = z.object({
  name: z.string()
    .min(1, 'Workflow name must not be empty')
    .max(200, 'Workflow name must be less than 200 characters')
    .trim(),
  organization_id: z.string().uuid().optional()
})

/**
 * POST /api/intent/workflows
 * 
 * Creates a new intent workflow with proper organizational context.
 * 
 * @param request - HTTP request containing workflow creation parameters
 * @returns JSON response with workflow details, or error details
 * 
 * Request Body:
 * - name: string (required, 1-200 chars) - Workflow name
 * - organization_id: string (optional, UUID) - Organization ID (uses user's org if not provided)
 * 
 * Response (Success - 200):
 * - id: string (UUID)
 * - name: string
 * - organization_id: string (UUID)
 * - status: string (IntentWorkflowStatus)
 * - created_at: string (ISO timestamp)
 * 
 * Response (Error):
 * - 401: Authentication required
 * - 403: Insufficient permissions
 * - 400: Validation error
 * - 409: Duplicate workflow name
 * - 500: Server error
 */
export async function POST(request: Request) {
  try {
    // Get current authenticated user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has admin role in their organization
    if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin role required.' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createWorkflowSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { name, organization_id } = validationResult.data

    // Use user's organization if not specified
    const targetOrgId = organization_id || currentUser.org_id

    // Verify user belongs to the target organization
    if (targetOrgId !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'Cannot create workflows for other organizations' },
        { status: 403 }
      )
    }

    // Check if intent engine feature flag is enabled for this organization
    const isIntentEngineEnabled = await isFeatureFlagEnabled(
      targetOrgId, 
      FEATURE_FLAG_KEYS.ENABLE_INTENT_ENGINE
    )
    
    if (!isIntentEngineEnabled) {
      console.warn(`Intent engine not enabled for organization ${targetOrgId}`)
      return NextResponse.json(
        { error: 'Intent engine not enabled for this organization' },
        { status: 403 }
      )
    }

    // --- Onboarding validation gate (A-6)
    const validation = await validateOnboardingComplete(targetOrgId)

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'ONBOARDING_INCOMPLETE',
          details: validation.errors,
          missingSteps: validation.missingSteps,
          suggestedAction: 'Complete onboarding at /onboarding'
        },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Check for duplicate workflow name within the organization
    const { data: existingWorkflow, error: checkError } = await supabase
      .from('intent_workflows')
      .select('id, name')
      .eq('organization_id', targetOrgId)
      .eq('name', name.trim())
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      return NextResponse.json(
        { error: 'Database error checking duplicate workflows' },
        { status: 500 }
      )
    }

    if (existingWorkflow) {
      const existing = existingWorkflow as unknown as { id: string; name: string }
      return NextResponse.json(
        { 
          error: 'Workflow with this name already exists in your organization',
          existing_workflow: {
            id: existing.id,
            name: existing.name
          }
        },
        { status: 409 }
      )
    }

    // Create the workflow
    const insertPayload = {
      name: name.trim(),
      organization_id: targetOrgId,
      created_by: currentUser.id,
      status: 'step_0_auth' as IntentWorkflowStatus,
      workflow_data: {}
    }

    const { data: workflowData, error: insertError } = await supabase
      .from('intent_workflows')
      .insert(insertPayload)
      .select(`
        id,
        name,
        organization_id,
        status,
        created_at,
        updated_at
      `)
      .single()

    if (insertError || !workflowData) {
      console.error('Error creating intent workflow:', insertError)
      return NextResponse.json(
        { error: 'Failed to create workflow' },
        { status: 500 }
      )
    }

    const workflow = workflowData as unknown as CreateIntentWorkflowResponse & { updated_at: string }

    // Log the workflow creation action
    try {
      await logActionAsync({
        orgId: targetOrgId,
        userId: currentUser.id,
        action: AuditAction.INTENT_WORKFLOW_CREATED,
        details: {
          workflow_id: workflow.id,
          workflow_name: workflow.name,
          workflow_status: workflow.status
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Failed to log workflow creation:', logError)
    }

    // Log the Intent audit trail entry (Story 37.4)
    try {
      logIntentActionAsync({
        organizationId: targetOrgId,
        workflowId: workflow.id,
        entityType: 'workflow',
        entityId: workflow.id,
        actorId: currentUser.id,
        action: AuditAction.WORKFLOW_CREATED,
        details: {
          workflow_name: workflow.name,
          workflow_status: workflow.status,
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (intentLogError) {
      // Don't fail the request if intent logging fails
      console.error('Failed to log intent audit entry:', intentLogError)
    }

    // Return success response
    const response: CreateIntentWorkflowResponse = {
      id: workflow.id,
      name: workflow.name,
      organization_id: workflow.organization_id,
      status: workflow.status,
      created_at: workflow.created_at
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Unexpected error in POST /api/intent/workflows:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/intent/workflows
 * 
 * Retrieves all workflows for the current user's organization.
 * 
 * @param request - HTTP request
 * @returns JSON response with workflows list, or error details
 * 
 * Response (Success - 200):
 * - workflows: Array of workflow objects
 * - total: number (total count)
 * 
 * Response (Error):
 * - 401: Authentication required
 * - 500: Server error
 */
export async function GET(request: Request) {
  try {
    // Get current authenticated user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Get workflows for the user's organization
    const { data: workflows, error, count } = await supabase
      .from('intent_workflows')
      .select(`
        id,
        name,
        status,
        created_at,
        updated_at,
        created_by (id, email)
      `, { count: 'exact' })
      .eq('organization_id', currentUser.org_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching intent workflows:', error)
      return NextResponse.json(
        { error: 'Failed to fetch workflows' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      workflows: workflows || [],
      total: count || 0,
      page,
      limit,
      has_more: (count || 0) > offset + limit
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/intent/workflows:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
