// SEO Performance Testing API Endpoint
// Story 14.6: SEO Testing and Validation
// API Route: /api/seo/performance-test

import { NextRequest, NextResponse } from 'next/server'
import { runPerformanceTest } from '@/lib/seo/performance-tester'

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

    if (!body.targetKeywords || !Array.isArray(body.targetKeywords)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Target keywords array is required' 
        },
        { status: 400 }
      )
    }

    // Prepare performance test input
    const performanceInput = {
      content: body.content,
      primaryKeyword: body.primaryKeyword,
      secondaryKeywords: body.secondaryKeywords || [],
      competitorContent: body.competitorContent,
      targetKeywords: body.targetKeywords,
      contentType: body.contentType || 'general'
    }

    // Run performance test
    const startTime = performance.now()
    const performanceResult = runPerformanceTest(performanceInput)
    const endTime = performance.now()
    
    const processingTime = Math.round((endTime - startTime) * 100) / 100

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        performanceMetrics: performanceResult.performanceMetrics,
        competitorAnalysis: performanceResult.competitorAnalysis,
        featuredSnippetAnalysis: performanceResult.featuredSnippetAnalysis,
        uniquenessResult: performanceResult.uniquenessResult,
        mobileFriendlinessResult: performanceResult.mobileFriendlinessResult,
        pageLoadImpactResult: performanceResult.pageLoadImpactResult,
        recommendations: performanceResult.recommendations,
        overallScore: performanceResult.overallScore
      },
      meta: {
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    })

  } catch (error) {
    console.error('[SEO Performance Test API] Error:', error)
    
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
      error: 'Method not allowed. Use POST to run performance test.' 
    },
    { status: 405 }
  )
}
