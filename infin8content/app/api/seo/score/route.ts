// SEO Scoring API Endpoint
// Story 14.6: SEO Testing and Validation
// API Route: /api/seo/score

import { NextRequest, NextResponse } from 'next/server'
import { calculateSEOScore } from '@/lib/seo/seo-scoring'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
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

    // Prepare scoring input
    const scoreInput = {
      content: body.content,
      primaryKeyword: body.primaryKeyword,
      secondaryKeywords: body.secondaryKeywords || [],
      targetWordCount: body.targetWordCount || 300,
      contentType: body.contentType || 'general'
    }

    // Calculate SEO score
    const startTime = performance.now()
    const scoreResult = calculateSEOScore(scoreInput)
    const endTime = performance.now()
    
    const processingTime = Math.round((endTime - startTime) * 100) / 100

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        overallScore: scoreResult.overallScore,
        breakdown: scoreResult.breakdown,
        metrics: scoreResult.metrics,
        recommendations: scoreResult.recommendations,
        issues: scoreResult.issues
      },
      meta: {
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    })

  } catch (error) {
    console.error('[SEO Scoring API] Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Method not allowed. Use POST to calculate SEO score.' 
    },
    { status: 405 }
  )
}
