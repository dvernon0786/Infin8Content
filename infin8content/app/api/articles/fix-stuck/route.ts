import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * API endpoint to manually fix articles stuck in "generating" status
 * This is a temporary fix for articles that timed out during generation
 * 
 * Usage:
 * POST /api/articles/fix-stuck
 * Body: { "articleIds": ["id1", "id2", ...] }
 */
export async function POST(request: Request) {
  try {
    const { articleIds } = await request.json()
    
    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json(
        { error: 'articleIds array is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Update stuck articles to failed status
    const { data, error } = await supabase
      .from('articles' as any)
      .update({
        status: 'failed',
        error_details: {
          error_message: 'Function invocation timeout - article generation timed out',
          failed_at: new Date().toISOString(),
          timeout: true,
          manually_fixed: true
        }
      })
      .in('id', articleIds)
      .eq('status', 'generating')
      .select('id, keyword, status')

    if (error) {
      console.error('Failed to update stuck articles:', error)
      return NextResponse.json(
        { error: 'Failed to update articles', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      updated: data?.length || 0,
      articles: data || []
    })
  } catch (error) {
    console.error('Fix stuck articles error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

