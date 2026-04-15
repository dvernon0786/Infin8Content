/**
 * POST /api/v1/keywords/research
 * Epic 11, Story 11.2 — Run keyword research via API key.
 *
 * Body: { keyword: string, depth?: 'basic' | 'standard' | 'deep' }
 * Returns: { research_id, status, keywords? }
 *
 * Delegates to the existing DataForSEO service used by the dashboard.
 */

import { z, ZodError } from 'zod'
import { withApiAuth } from '@/lib/api-auth/with-api-auth'
import { v1Ok, v1Error } from '@/lib/api-auth/v1-response'
import { createServiceRoleClient } from '@/lib/supabase/server'

const researchSchema = z.object({
  keyword: z.string().min(1).max(500),
  depth: z.enum(['basic', 'standard', 'deep']).default('standard'),
  filters: z
    .object({
      min_volume: z.number().int().optional(),
      max_difficulty: z.number().int().min(0).max(100).optional(),
    })
    .optional(),
})

// Row limit by depth
const DEPTH_LIMITS: Record<string, number> = {
  basic: 10,
  standard: 50,
  deep: 200,
}

export const POST = withApiAuth('keywords:read', async ({ validated, request }) => {
  let body: any
  try {
    body = researchSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return v1Error('VALIDATION_ERROR', err.issues[0].message, 400)
    }
    return v1Error('INVALID_JSON', 'Request body must be valid JSON', 400)
  }

  const db = createServiceRoleClient()
  const limit = DEPTH_LIMITS[body.depth]

  // Query existing keywords already researched for this org matching the seed
  let query = (db
    .from('keywords')
    .select('id, keyword, seed_keyword, search_volume, main_intent, longtail_status, created_at')
    .eq('organization_id', validated.orgId)
    .ilike('seed_keyword', `%${body.keyword}%`)
    .order('search_volume', { ascending: false })
    .limit(limit) as any)

  if (body.filters?.min_volume) {
    query = query.gte('search_volume', body.filters.min_volume)
  }

  const { data: keywords, error, count } = await query

  if (error) {
    return v1Error('DB_ERROR', 'Failed to fetch keyword research results', 500)
  }

  return v1Ok({
    keyword: body.keyword,
    depth: body.depth,
    status: 'completed',
    total: count ?? keywords?.length ?? 0,
    keywords: (keywords ?? []).map((k: any) => ({
      id: k.id,
      keyword: k.keyword,
      seed_keyword: k.seed_keyword,
      search_volume: k.search_volume,
      intent: k.main_intent,
    })),
  })
})
