/**
 * GET /api/v1/articles
 * Epic 11, Story 11.2 — Paginated article list via API key auth.
 *
 * Query params:
 *  status   — filter by article status
 *  limit    — results per page (default 25, max 100)
 *  offset   — pagination offset (default 0)
 *  sort     — 'created_at' | 'updated_at' | 'title' (default 'created_at')
 */

import { withApiAuth } from '@/lib/api-auth/with-api-auth'
import { v1Ok, v1Error } from '@/lib/api-auth/v1-response'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const GET = withApiAuth('articles:read', async ({ validated, request }) => {
  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '25', 10), 100)
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10), 0)
  const sort = (['created_at', 'updated_at', 'title'] as const).includes(
    url.searchParams.get('sort') as any
  )
    ? (url.searchParams.get('sort') as 'created_at' | 'updated_at' | 'title')
    : 'created_at'

  const db = createServiceRoleClient()

  let query = (db
    .from('articles')
    .select('id, title, status, keyword, created_at, updated_at', { count: 'exact' })
    .eq('org_id', validated.orgId)
    .order(sort, { ascending: false })
    .range(offset, offset + limit - 1) as any)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error) {
    return v1Error('DB_ERROR', 'Failed to fetch articles', 500)
  }

  return v1Ok({
    articles: data ?? [],
    total: count ?? 0,
    limit,
    offset,
    has_more: offset + limit < (count ?? 0),
  })
})
