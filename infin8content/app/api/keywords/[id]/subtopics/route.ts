// API route for generating subtopics for a keyword
// Story 37.1: Generate Subtopic Ideas via DataForSEO
// Story 39.4: Enforce hard gate - longtails required for subtopics

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { KeywordSubtopicGenerator } from '@/lib/services/keyword-engine/subtopic-generator'
import { WorkflowGateValidator } from '@/lib/services/intent-engine/workflow-gate-validator'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to get the id
    const { id } = await params
    // Get current user and validate authentication
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate keyword ID
    if (!id) {
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
      .eq('id', id)
      .eq('organization_id', currentUser.org_id)
      .single() as { data: { workflow_id: string } | null, error: any }

    if (keywordError || !keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      )
    }

    // Validate workflow gate - longtails and clustering must be complete
    // Pass organization ID for cross-org isolation validation
    const gateValidator = new WorkflowGateValidator()
    const gateResult = await gateValidator.validateLongtailsRequiredForSubtopics(keyword.workflow_id, currentUser.org_id)

    // Log gate enforcement for audit trail
    await gateValidator.logGateEnforcement(keyword.workflow_id, 'subtopic-generation', gateResult)

    // If gate validation fails, return 423 Locked response
    if (!gateResult.allowed) {
      return NextResponse.json(
        gateResult.errorResponse || {
          error: gateResult.error || 'Longtail expansion and clustering required before subtopics',
          workflowStatus: gateResult.workflowStatus,
          longtailStatus: gateResult.longtailStatus,
          clusteringStatus: gateResult.clusteringStatus,
          requiredAction: 'Complete longtail expansion (step 4) and topic clustering (step 6) before subtopic generation',
          currentStep: 'subtopic-generation',
          blockedAt: new Date().toISOString()
        },
        { status: 423 }
      )
    }

    // Initialize subtopic generator
    const generator = new KeywordSubtopicGenerator()

    // Generate subtopics
    const subtopics = await generator.generate(id)

    // Store subtopics and update status
    await generator.store(id, subtopics)

    return NextResponse.json({
      success: true,
      data: {
        keyword_id: id,
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
