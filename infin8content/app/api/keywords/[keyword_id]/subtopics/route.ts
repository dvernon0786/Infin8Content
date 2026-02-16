// API route for generating subtopics for a keyword
// Story 37.1: Generate Subtopic Ideas via DataForSEO
// Story 39.4: Enforce hard gate - longtails required for subtopics

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { KeywordSubtopicGenerator } from '@/lib/services/keyword-engine/subtopic-generator'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ keyword_id: string }> }
) {
  try {
    // Await params to get the keyword_id
    const { keyword_id } = await params
    // Get current user and validate authentication
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate keyword ID
    if (!keyword_id) {
      return NextResponse.json(
        { error: 'Keyword ID is required' },
        { status: 400 }
      )
    }

    // Get the keyword to find its workflow
    const supabase = createServiceRoleClient()
    const { data: keyword, error: keywordError } = await supabase
      .from('keywords')
      .select('workflow_id')
      .eq('id', keyword_id)
      .eq('organization_id', currentUser.org_id)
      .single() as { data: { workflow_id: string } | null, error: any }

    if (keywordError || !keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      )
    }

    // Check if workflow is at appropriate state for subtopic generation
    const supabaseWorkflow = createServiceRoleClient()
    const { data: workflow, error: workflowError } = await supabaseWorkflow
      .from('intent_workflows')
      .select('id, state, organization_id')
      .eq('id', keyword.workflow_id)
      .eq('organization_id', currentUser.org_id)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // FSM GUARD: Only allow subtopic generation after clustering is complete
    const typedWorkflow = workflow as unknown as { id: string; state: string; organization_id: string }
    if (typedWorkflow.state !== 'step_6_clustering' && typedWorkflow.state !== 'step_7_validation' && typedWorkflow.state !== 'step_8_subtopics' && typedWorkflow.state !== 'step_9_articles' && typedWorkflow.state !== 'completed') {
      return NextResponse.json(
        { 
          error: 'Invalid workflow state for subtopic generation',
          message: `Workflow must be at step_6_clustering or later, currently in ${typedWorkflow.state}`
        },
        { status: 423 }
      )
    }

    // Generate subtopics using DataForSEO
    const subtopicGenerator = new KeywordSubtopicGenerator()
    const subtopics = await subtopicGenerator.generate(keyword_id)

    // Store subtopics and update status
    await subtopicGenerator.store(keyword_id, subtopics)

    return NextResponse.json({
      success: true,
      data: {
        keyword_id: keyword_id,
        subtopics: subtopics,
        subtopics_count: subtopics.length
      }
    })

  } catch (error) {
    console.error('Error generating subtopics:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Keyword not found') {
        return NextResponse.json(
          { error: 'Keyword not found' },
          { status: 404 }
        )
      }

      if (error.message === 'Subtopics already generated') {
        return NextResponse.json(
          { error: 'Subtopics already generated for this keyword' },
          { status: 409 }
        )
      }

      if (error.message === 'Keyword must have longtail_status = complete') {
        return NextResponse.json(
          { error: 'Keyword must have longtail_status = complete before generating subtopics' },
          { status: 400 }
        )
      }

      if (error.message.includes('DataForSEO')) {
        return NextResponse.json(
          { error: 'Failed to generate subtopics. Please try again later.' },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
