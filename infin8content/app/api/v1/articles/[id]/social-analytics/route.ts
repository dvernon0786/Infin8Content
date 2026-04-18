/**
 * GET /api/v1/articles/:id/social-analytics
 *
 * Returns the publish reference + per-account analytics rows for one article.
 * Consumed by <SocialAnalytics> on the article detail page.
 *
 * Returns: {
 *   publishRef: PublishRef | null,
 *   analytics:  SocialAnalyticsRow[]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  // Verify the user's org owns this article (RLS enforces this)
  const { data: article, error: artErr } = await (supabase as any)
    .from('articles')
    .select('id, status')
    .eq('id', articleId)
    .single()

  if (artErr || !article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 })
  }

  // Fetch first publish reference that has social columns set
  const { data: publishRef } = await (supabase as any)
    .from('publish_references')
    .select(
      'outstand_post_id, social_status, social_error, analytics_synced_at, analytics_data',
    )
    .eq('article_id', articleId)
    .not('outstand_post_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!publishRef) {
    return NextResponse.json({ publishRef: null, analytics: [] })
  }

  // Fetch per-account rows if analytics were synced
  const { data: analytics } = await (supabase as any)
    .from('article_social_analytics')
    .select(
      'network, username, likes, comments, shares, views, impressions, reach, engagement_rate, fetched_at',
    )
    .eq('article_id', articleId)
    .order('network')

  return NextResponse.json({
    publishRef,
    analytics: analytics ?? [],
  })
}
