/**
 * GET /api/v1/articles/:id/caption
 *
 * Generates (or regenerates) a social-media caption for an article.
 * Used by the SocialPublishModal on open and on "↺ regenerate" click.
 * Does NOT trigger any publishing — preview only.
 *
 * Returns: { caption: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSocialCaption } from '@/lib/services/outstand/caption-generator'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const articleId = params.id

  // RLS enforces org ownership
  const { data: article, error: artErr } = await (supabase as any)
    .from('articles')
    .select('id, title, writing_style, sections, slug, status, organization_id')
    .eq('id', articleId)
    .single()

  if (artErr || !article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 })
  }

  if (article.status !== 'completed') {
    return NextResponse.json(
      { error: 'Article must be completed before generating a caption' },
      { status: 422 },
    )
  }

  // Extract plain-text excerpt from sections JSONB
  let excerpt = ''
  if (article.sections && Array.isArray(article.sections)) {
    excerpt = article.sections
      .slice(0, 2)
      .map((s: any) => s.content_markdown ?? s.content ?? '')
      .join(' ')
      .replace(/[#*`>\-]/g, '')
      .trim()
      .slice(0, 500)
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.infin8content.com'
  const articleUrl = article.slug
    ? `${base}/articles/${article.slug}`
    : `${base}/articles/${articleId}`

  const caption = await generateSocialCaption({
    title: article.title,
    excerpt,
    articleUrl,
    writingStyle: article.writing_style,
  })

  return NextResponse.json({ caption })
}
