/**
 * GET /api/v1/articles/[id]
 * Epic 11, Story 11.2 — Get a single article with content + metadata.
 */

import { withApiAuth } from '@/lib/api-auth/with-api-auth'
import { v1Ok, v1Error } from '@/lib/api-auth/v1-response'
import { createServiceRoleClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export function GET(_req: Request, { params }: RouteParams) {
  return withApiAuth('articles:read', async ({ validated }) => {
    const { id } = await params
    const db = createServiceRoleClient()

    const { data, error } = await (db
      .from('articles')
      .select('id, title, status, keyword, sections, metadata, created_at, updated_at')
      .eq('id', id)
      .eq('org_id', validated.orgId)
      .single() as any)

    if (error || !data) {
      return v1Error('NOT_FOUND', 'Article not found', 404)
    }

    // Build a clean content field from sections HTML
    const content = Array.isArray(data.sections)
      ? (data.sections as any[]).map((s: any) => s.content ?? '').join('\n\n')
      : null

    return v1Ok({ ...data, content })
  })(_req, { params })
}
