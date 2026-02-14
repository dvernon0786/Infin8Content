/**
 * Step 3 POST Handler - SCHEMA ALIGNED
 * For workflow step transitions with proper schema compliance
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'

interface PostRequestBody {
  selectedKeywordIds: string[]
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
    // 1. AUTHENTICATION
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    organizationId = currentUser.org_id
    userId = currentUser.id

    // 2. INPUT VALIDATION
    const body = await request.json()
    const { selectedKeywordIds } = body as PostRequestBody

    if (!Array.isArray(selectedKeywordIds) || selectedKeywordIds.length < 2) {
      return NextResponse.json(
        {
          error: 'Invalid selection',
          message: 'At least 2 keywords must be selected',
          code: 'INSUFFICIENT_KEYWORDS_SELECTED'
        },
        { status: 400 }
      )
    }

    if (selectedKeywordIds.length > 100) {
      return NextResponse.json(
        {
          error: 'Too many keywords selected',
          message: 'Maximum 100 keywords can be selected',
          code: 'TOO_MANY_KEYWORDS_SELECTED',
          maxAllowed: 100,
          currentSelected: selectedKeywordIds.length
        },
        { status: 400 }
      )
    }

    // 3. DATABASE OPERATIONS
    const supabase = createServiceRoleClient()

    // Clear existing selections
    const { error: clearError } = await supabase
      .from('keywords')
      .update({
        user_selected: false,
        selection_source: 'bulk_deselect',
        selection_timestamp: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('workflow_id', workflowId)
      .is('parent_seed_keyword_id', null)

    if (clearError) {
      console.error('Error clearing selections:', clearError)
      return NextResponse.json(
        { error: 'Failed to clear existing selections' },
        { status: 500 }
      )
    }

    // Set new selections
    const { error: selectError } = await supabase
      .from('keywords')
      .update({
        user_selected: true,
        selection_source: 'user',
        selection_timestamp: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('workflow_id', workflowId)
      .in('id', selectedKeywordIds)

    if (selectError) {
      console.error('Error setting selections:', selectError)
      return NextResponse.json(
        { error: 'Failed to update selections' },
        { status: 500 }
      )
    }

    // 4. WORKFLOW STATE TRANSITION - SCHEMA ALIGNED
    const { error: workflowError } = await supabase
      .from('intent_workflows')
      .update({
        state: 'step_4_longtails', // Valid state from CHECK constraint
        keywords_count: selectedKeywordIds.length, // Real column that exists
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId)
      .eq('organization_id', organizationId)

    if (workflowError) {
      console.error('Error updating workflow:', workflowError)
      return NextResponse.json(
        { error: 'Failed to advance workflow' },
        { status: 500 }
      )
    }

    // 5. AUDIT LOGGING
    await logActionAsync({
      orgId: organizationId,
      userId: userId,
      action: AuditAction.WORKFLOW_STEP_COMPLETED,
      details: {
        workflow_id: workflowId,
        keywords_selected: selectedKeywordIds.length,
        step: 3,
        new_state: 'step_4_longtails'
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    // 6. SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      data: {
        keywordsSelected: selectedKeywordIds.length,
        message: 'Step 3 completed successfully',
        nextState: 'step_4_longtails'
      }
    })

  } catch (error: any) {
    console.error('Step 3 POST failed:', error)
    
    // 7. ERROR HANDLING & AUDIT
    if (organizationId && userId) {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_STEP_FAILED,
        details: {
          workflow_id: workflowId,
          step: 3,
          error: error.message
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
