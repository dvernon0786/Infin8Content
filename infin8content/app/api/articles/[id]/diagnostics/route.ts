import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Diagnostic endpoint to check article status and Inngest event details
 * GET /api/articles/[id]/diagnostics
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceRoleClient()

    // Get article details including Inngest event ID
    const { data: article, error } = await supabase
      .from('articles' as any)
      .select('id, keyword, status, inngest_event_id, generation_started_at, created_at, error_details')
      .eq('id', id)
      .single()

    if (error || !article) {
      return NextResponse.json(
        { error: 'Article not found', details: error?.message },
        { status: 404 }
      )
    }

    // Type assertion after error check - cast through unknown to avoid type overlap issues
    type ArticleDiagnostics = {
      id: string
      keyword: string
      status: string
      inngest_event_id: string | null
      generation_started_at: string | null
      created_at: string
      error_details: Record<string, unknown> | null
    }
    
    const articleData = article as unknown as ArticleDiagnostics

    // Check if article is stuck (generating for more than 5 minutes)
    const isStuck = articleData.status === 'generating' && articleData.generation_started_at
    let stuckDuration: number | null = null
    
    if (isStuck && articleData.generation_started_at) {
      const startTime = new Date(articleData.generation_started_at).getTime()
      const now = Date.now()
      stuckDuration = Math.round((now - startTime) / 1000) // seconds
    }

    return NextResponse.json({
      article: {
        id: articleData.id,
        keyword: articleData.keyword,
        status: articleData.status,
        inngest_event_id: articleData.inngest_event_id,
        generation_started_at: articleData.generation_started_at,
        created_at: articleData.created_at,
        error_details: articleData.error_details,
      },
      diagnostics: {
        has_inngest_event_id: !!articleData.inngest_event_id,
        is_stuck: isStuck && stuckDuration ? stuckDuration > 300 : false, // 5 minutes
        stuck_duration_seconds: stuckDuration,
        status_age_seconds: articleData.created_at 
          ? Math.round((Date.now() - new Date(articleData.created_at).getTime()) / 1000)
          : null,
      },
      recommendations: [
        !articleData.inngest_event_id && articleData.status === 'queued' 
          ? 'Article is queued but has no Inngest event ID. The event may not have been sent successfully.'
          : null,
        articleData.status === 'generating' && !articleData.generation_started_at
          ? 'Article is generating but generation_started_at is not set. The Inngest function may not have started.'
          : null,
        isStuck && stuckDuration && stuckDuration > 300
          ? `Article has been generating for ${Math.round(stuckDuration / 60)} minutes. Consider using /api/articles/fix-stuck to mark it as failed.`
          : null,
      ].filter(Boolean),
    })
  } catch (error) {
    console.error('Diagnostics error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

