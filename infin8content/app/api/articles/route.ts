import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { NextResponse } from 'next/server'

/**
 * POST /api/articles
 *
 * Creates a standalone article record (status: draft) and returns { articleId }.
 * Callers then pass articleId to POST /api/articles/generate to trigger Inngest.
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const {
      keyword,
      targetWordCount,
      writingStyle,
      targetAudience,
      customInstructions,
      articleType,
      language,
      articleTypeConfig,
    } = body

    if (articleType !== 'video_conversion' && (!keyword || !String(keyword).trim())) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const insertPayload: Record<string, any> = {
      org_id: currentUser.org_id,
      keyword: keyword?.trim() ?? '',
      status: 'draft',
      target_word_count: targetWordCount ?? 2000,
      created_by: currentUser.id,
      generation_config: {
        tone: writingStyle ?? 'Professional',
        language: language ?? 'en',
        style: writingStyle ?? 'Professional',
        target_word_count: targetWordCount ?? 2000,
        auto_publish: false,
        target_audience: targetAudience ?? 'General',
        custom_instructions: customInstructions ?? null,
      },
    }

    if (articleType && articleType !== 'standard') {
      insertPayload.article_type = articleType
    }
    if (articleTypeConfig) {
      insertPayload.article_type_config = articleTypeConfig
    }
    if (articleType === 'video_conversion' && articleTypeConfig?.video_url) {
      insertPayload.video_url = articleTypeConfig.video_url
    }

    const { data: article, error: insertError } = await supabase
      .from('articles')
      .insert(insertPayload)
      .select('id')
      .single()

    if (insertError || !article) {
      console.error('[POST /api/articles] insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
    }

    return NextResponse.json({ articleId: (article as any).id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/articles] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
