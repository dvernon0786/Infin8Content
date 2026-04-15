/**
 * POST /api/v1/articles/generate
 * Epic 11, Story 11.2 — Queue an article for generation via API key.
 *
 * Body: { keyword: string, length?: number, style?: string, custom_instructions?: string }
 * Returns: { article_id, status: 'queued', estimated_time }
 *
 * Delegates to the same Inngest event that the dashboard uses.
 */

import { z, ZodError } from 'zod'
import { withApiAuth } from '@/lib/api-auth/with-api-auth'
import { v1Ok, v1Error } from '@/lib/api-auth/v1-response'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'

const generateSchema = z.object({
  keyword: z.string().min(1).max(500),
  length: z.number().int().min(500).max(10000).optional(),
  style: z.string().max(200).optional(),
  custom_instructions: z.string().max(2000).optional(),
})

export const POST = withApiAuth('articles:write', async ({ validated, request }) => {
  let body: any
  try {
    body = generateSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return v1Error('VALIDATION_ERROR', err.issues[0].message, 400)
    }
    return v1Error('INVALID_JSON', 'Request body must be valid JSON', 400)
  }

  const db = createServiceRoleClient()

  // Create the article record (status: queued)
  const { data: article, error: insertErr } = await (db
    .from('articles')
    .insert({
      org_id: validated.orgId,
      keyword: body.keyword,
      status: 'queued',
      metadata: {
        target_length: body.length ?? null,
        style: body.style ?? null,
        custom_instructions: body.custom_instructions ?? null,
        source: 'api',
      },
    })
    .select('id, keyword, status, created_at')
    .single() as any)

  if (insertErr || !article) {
    console.error('[v1/articles/generate] insert error:', insertErr)
    return v1Error('DB_ERROR', 'Failed to queue article generation', 500)
  }

  // Fire Inngest event (same as dashboard path)
  await inngest.send({
    name: 'article/generate',
    data: {
      articleId: article.id,
      orgId: validated.orgId,
      keyword: body.keyword,
      targetLength: body.length ?? null,
      style: body.style ?? null,
      customInstructions: body.custom_instructions ?? null,
    },
  })

  return v1Ok(
    {
      article_id: article.id,
      status: 'queued',
      estimated_time: '10-20 minutes',
    },
    202
  )
})
