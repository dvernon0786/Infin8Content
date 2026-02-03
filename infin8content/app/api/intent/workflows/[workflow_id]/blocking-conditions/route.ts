/**
 * Blocking Conditions API Endpoint
 * Story 39-7: Display Workflow Blocking Conditions
 *
 * GET /api/intent/workflows/{workflow_id}/blocking-conditions
 *
 * Returns the blocking condition for a workflow if it is blocked at a gate.
 * Provides clear explanation of what is required to unblock.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { BlockingConditionResolver } from '@/lib/services/intent-engine/blocking-condition-resolver'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'

/**
 * GET /api/intent/workflows/{workflow_id}/blocking-conditions
 *
 * Query blocking condition for a workflow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { workflow_id: string } }
) {
  try {
    // Authenticate user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const workflowId = params.workflow_id
    const organizationId = currentUser.org_id

    // Validate workflow_id format (UUID)
    if (!isValidUUID(workflowId)) {
      return NextResponse.json(
        { error: 'Invalid workflow_id format' },
        { status: 400 }
      )
    }

    // Resolve blocking condition
    const resolver = new BlockingConditionResolver()
    const blockingCondition = await resolver.resolveBlockingCondition(
      workflowId,
      organizationId
    )

    // Log the query for audit trail
    try {
      await logIntentAction({
        organizationId,
        workflowId,
        entityType: 'workflow',
        entityId: workflowId,
        actorId: currentUser.id,
        action: 'workflow.blocking_conditions.queried',
        details: {
          is_blocked: blockingCondition !== null,
          blocking_gate: blockingCondition?.blocking_gate || null,
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (auditError) {
      console.error('Failed to log blocking condition query:', auditError)
      // Non-blocking - don't let audit logging failures affect the response
    }

    return NextResponse.json({
      workflow_id: workflowId,
      blocking_condition: blockingCondition,
      queried_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error querying blocking condition:', error)
    return NextResponse.json(
      { error: 'Failed to query blocking condition' },
      { status: 500 }
    )
  }
}

/**
 * Validates UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Extracts IP address from request headers
 */
function extractIpAddress(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return headers.get('x-real-ip') || null
}

/**
 * Extracts user agent from request headers
 */
function extractUserAgent(headers: Headers): string | null {
  return headers.get('user-agent')
}
