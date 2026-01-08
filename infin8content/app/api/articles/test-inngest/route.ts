import { inngest } from '@/lib/inngest/client'
import { NextResponse } from 'next/server'

/**
 * Test endpoint to verify Inngest connection
 * GET /api/articles/test-inngest
 */
export async function GET(request: Request) {
  try {
    console.log('[Test Inngest] Attempting to send test event')
    
    // Try to send a test event
    const result = await inngest.send({
      name: 'article/generate',
      data: {
        articleId: 'test-article-id',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Test event sent successfully',
      eventIds: result.ids,
      inngestConfig: {
        id: 'infin8content',
        hasEventKey: !!process.env.INNGEST_EVENT_KEY,
        nodeEnv: process.env.NODE_ENV,
      },
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[Test Inngest] Failed to send test event:', {
      error: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send test event',
        details: errorMsg,
        inngestConfig: {
          id: 'infin8content',
          hasEventKey: !!process.env.INNGEST_EVENT_KEY,
          nodeEnv: process.env.NODE_ENV,
        },
      },
      { status: 500 }
    )
  }
}

