// API route for generating subtopics for a keyword
// Story 37.1: Generate Subtopic Ideas via DataForSEO

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { KeywordSubtopicGenerator } from '@/lib/services/keyword-engine/subtopic-generator'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user and validate authentication
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate keyword ID
    const keywordId = params.id
    if (!keywordId) {
      return NextResponse.json(
        { error: 'Keyword ID is required' },
        { status: 400 }
      )
    }

    // Initialize subtopic generator
    const generator = new KeywordSubtopicGenerator()

    // Generate subtopics
    const subtopics = await generator.generate(keywordId)

    // Store subtopics and update status
    await generator.store(keywordId, subtopics)

    return NextResponse.json({
      success: true,
      data: {
        keyword_id: keywordId,
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
