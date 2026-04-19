/**
 * app/api/v1/articles/[id]/publish-social/route.ts
 *
 * POST /api/v1/articles/:id/publish-social
 *
 * Validates auth + ownership, then sends the Inngest event that kicks off
 * the manual social-publish workflow (manualPublishToSocial).
 *
 * The existing CMS (WordPress/Ghost/Webflow) publish route at
 * /api/v1/articles/:id/publish is unchanged — social publishing is additive.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'
import { z } from 'zod'

const BodySchema = z.object({
  status: z.enum(['draft', 'publish']).default('publish'),
})

export async function POST(
  req: NextRequest,
  context: any,
) {
  const supabase = await createClient()

  // ── Auth ─────────────────────────────────────────────────────────────────
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Validate body ────────────────────────────────────────────────────────
  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await req.json())
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Invalid request body', details: e.errors },
      { status: 400 },
    )
  }

  const params = await context.params
  const articleId = params?.id

  // ── Load article (verifies ownership via RLS) ────────────────────────────
  const { data: article, error: artErr } = await (supabase as any)
    .from('articles')
    .select('id, organization_id, status, cms_status, title')
    .eq('id', articleId)
    .single()

  if (artErr || !article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 })
  }

  // ── Guard: only completed articles can be published ──────────────────────
  if (article.status !== 'completed') {
    return NextResponse.json(
      { error: 'Article must be in completed state to publish' },
      { status: 422 },
    )
  }

  // ── Guard: already published ─────────────────────────────────────────────
  if (article.cms_status === 'published' && body.status === 'publish') {
    return NextResponse.json(
      { error: 'Article is already published' },
      { status: 409 },
    )
  }

  // ── If status=draft, update cms_status and return (no social post) ───────
  if (body.status === 'draft') {
    await (supabase as any)
      .from('articles')
      .update({ cms_status: 'draft' })
      .eq('id', articleId)
    return NextResponse.json({ success: true, cms_status: 'draft' })
  }

  // ── Send Inngest event → triggers manualPublishToSocial function ─────────
  await inngest.send({
    name: 'article/publish.requested',
    data: {
      articleId: article.id,
      organizationId: article.organization_id,
      requestedBy: user.id,
    },
  })

  return NextResponse.json(
    {
      success: true,
      message: 'Social publish workflow started',
      articleId: article.id,
    },
    { status: 202 },
  )
}
