/**
 * Internal Test Endpoint: Delete Workflow
 * Cleans up test workflow and associated data
 * 
 * DELETE /api/internal/test-delete-workflow?id={workflow_id}
 * Deletes workflow and all related keywords
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('id')

    if (!workflowId) {
      return NextResponse.json(
        { error: 'workflow_id parameter required' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Delete keywords first (foreign key constraint)
    const { error: keywordDeleteError } = await supabase
      .from('keywords')
      .delete()
      .eq('workflow_id', workflowId)

    if (keywordDeleteError) {
      console.warn('[TestDeleteWorkflow] Failed to delete keywords:', keywordDeleteError)
      // Continue anyway - workflow deletion might cascade
    }

    // Delete workflow
    const { error: workflowDeleteError } = await supabase
      .from('intent_workflows')
      .delete()
      .eq('id', workflowId)

    if (workflowDeleteError) {
      return NextResponse.json(
        { error: 'Failed to delete workflow' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Workflow and associated data deleted successfully'
    })

  } catch (error: any) {
    console.error('[TestDeleteWorkflow] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
