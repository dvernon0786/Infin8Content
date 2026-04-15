/**
 * GET /api/v1/analytics/articles/[id]
 * Epic 11, Story 11.2 — Get analytics data for a specific article via API key.
 *
 * Returns available metrics: publish references, generation metadata.
 */

import { withApiAuth } from '@/lib/api-auth/with-api-auth'
import { v1Ok, v1Error } from '@/lib/api-auth/v1-response'
import { createServiceRoleClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export function GET(_req: Request, { params }: RouteParams) {
  return withApiAuth('analytics:read', async ({ validated }) => {
    const { id: articleId } = await params
    const db = createServiceRoleClient()

    // Verify article belongs to the org
    const { data: article, error: artErr } = await (db
      .from('articles')
      .select('id, title, status, keyword, created_at, updated_at, metadata')
      .eq('id', articleId)
      .eq('org_id', validated.orgId)
      .single() as any)

    if (artErr || !article) {
      return v1Error('NOT_FOUND', 'Article not found', 404)
    }

    // Fetch publish references
    const { data: publishes } = await (db
      .from('publish_references')
      .select('id, platform, platform_url, platform_post_id, published_at, connection_id')
      .eq('article_id', articleId)
      .order('published_at', { ascending: false }) as any)

    return v1Ok({
      article_id: articleId,
      title: article.title,
      keyword: article.keyword,
      status: article.status,
      created_at: article.created_at,
      updated_at: article.updated_at,
      generations: {
        metadata: article.metadata ?? {},
      },
      publish_history: publishes ?? [],
    })
  })(_req, { params })
}
