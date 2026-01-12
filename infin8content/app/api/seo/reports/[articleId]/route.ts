// SEO Report Generation API Endpoint
// Story 14.6: SEO Testing and Validation
// API Route: /api/seo/reports/[articleId]

import { NextRequest, NextResponse } from 'next/server'
import { generateSEOReport, exportReport } from '@/lib/seo/reporting'

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

    // Prepare report input
    const reportInput = {
      articleId,
      content: body.content,
      primaryKeyword: body.primaryKeyword,
      secondaryKeywords: body.secondaryKeywords || [],
      targetWordCount: body.targetWordCount || 300,
      contentType: body.contentType || 'general',
      competitorContent: body.competitorContent,
      historicalData: body.historicalData,
      reportType: body.reportType || 'comprehensive',
      exportFormats: body.exportFormats || ['json']
    }

    // Generate report
    const startTime = performance.now()
    const report = generateSEOReport(reportInput)
    const endTime = performance.now()
    
    const processingTime = Math.round((endTime - startTime) * 100) / 100

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        articleId,
        report,
        exportFormats: report.exportFormats
      },
      meta: {
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    })

  } catch (error) {
    console.error('[SEO Report API] Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

// Handle GET request to retrieve existing reports
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  try {
    const { articleId } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') as 'pdf' | 'csv' | 'json' || 'json'
    
    // In a real implementation, this would fetch stored reports
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      data: {
        articleId,
        message: 'Report not found. Use POST to generate a new report.',
        availableFormats: ['pdf', 'csv', 'json'],
        requestedFormat: format
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    })

  } catch (error) {
    console.error('[SEO Report API] GET Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}
