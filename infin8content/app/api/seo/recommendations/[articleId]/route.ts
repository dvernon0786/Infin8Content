// SEO Recommendations API Endpoint
// Story 14.6: SEO Testing and Validation
// API Route: /api/seo/recommendations/[articleId]

import { NextRequest, NextResponse } from 'next/server'
import { generateRealTimeRecommendations } from '@/lib/seo/recommendation-system'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  try {
    const body = await request.json()
    const { articleId } = await params
    
    // Validate request body
    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Content is required and must be a string' 
        },
        { status: 400 }
      )
    }
    
    if (!body.primaryKeyword || typeof body.primaryKeyword !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Primary keyword is required and must be a string' 
        },
        { status: 400 }
      )
    }

    // Prepare recommendation input
    const recommendationInput = {
      content: body.content,
      primaryKeyword: body.primaryKeyword,
      secondaryKeywords: body.secondaryKeywords || [],
      targetWordCount: body.targetWordCount || 300,
      contentType: body.contentType || 'general',
      targetAudience: body.targetAudience,
      searchIntent: body.searchIntent
    }

    // Generate recommendations
    const startTime = performance.now()
    const recommendationResult = generateRealTimeRecommendations(recommendationInput)
    const endTime = performance.now()
    
    const processingTime = Math.round((endTime - startTime) * 100) / 100

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        articleId,
        recommendations: recommendationResult.recommendations,
        keywordPlacements: recommendationResult.keywordPlacements,
        semanticEnhancements: recommendationResult.semanticEnhancements,
        contentLengthRecommendations: recommendationResult.contentLengthRecommendations,
        internalLinkingOpportunities: recommendationResult.internalLinkingOpportunities,
        callToActionOptimizations: recommendationResult.callToActionOptimizations,
        overallScore: recommendationResult.overallScore,
        priorityActions: recommendationResult.priorityActions,
        quickWins: recommendationResult.quickWins
      },
      meta: {
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    })

  } catch (error) {
    console.error('[SEO Recommendations API] Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

// Handle GET request to retrieve existing recommendations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  try {
    const { articleId } = await params
    
    // In a real implementation, this would fetch stored recommendations
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      data: {
        articleId,
        message: 'Recommendations not found. Use POST to generate new recommendations.',
        storedRecommendations: []
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    })

  } catch (error) {
    console.error('[SEO Recommendations API] GET Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}
