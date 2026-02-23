import { createServiceRoleClient } from '@/lib/supabase/server'
import { validateSupabaseEnv } from '@/lib/supabase/env'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { inngest } from '@/lib/inngest/client'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { z } from 'zod'
import { NextResponse } from 'next/server'

/**
 * Request schema — generation trigger only
 */
const articleGenerateSchema = z.object({
  articleId: z.string().uuid('Invalid article ID'),
})

/**
 * Plan limits for article generation per month
 */
const PLAN_LIMITS: Record<string, number | null> = {
  starter: 10,
  pro: 50,
  agency: null, // unlimited
}

export async function POST(request: Request) {
  try {
    validateSupabaseEnv()

    const body = await request.json()
    const parsed = articleGenerateSchema.parse(body)

    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const organizationId = currentUser.org_id
    const userId = currentUser.id
    const plan = currentUser.organizations?.plan || 'starter'
    const supabaseAdmin = createServiceRoleClient()

    // --------------------------------------------
    // 1️⃣ Fetch Article + Validate Ownership
    // --------------------------------------------
    const { data: article, error: fetchError } = await supabaseAdmin
      .from('articles')
      .select('id, status, org_id')
      .eq('id', parsed.articleId)
      .single()

    if (fetchError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    if (article.org_id !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (article.status !== 'queued') {
      return NextResponse.json(
        { error: `Article is already ${article.status}` },
        { status: 409 }
      )
    }

    // --------------------------------------------
    // 2️⃣ Quota Enforcement
    // --------------------------------------------
    const currentMonth = new Date().toISOString().slice(0, 7)

    const { data: usageData, error: usageError } = await supabaseAdmin
      .from('usage_tracking')
      .select('usage_count')
      .eq('organization_id', organizationId)
      .eq('metric_type', 'article_generation')
      .eq('billing_period', currentMonth)
      .single()

    if (usageError && usageError.code !== 'PGRST116') {
      console.error('[Article Generation] Usage check failed:', usageError)
    }

    const currentUsage = usageData?.usage_count || 0
    const limit = PLAN_LIMITS[plan]

    if (limit !== null && currentUsage >= limit) {
      return NextResponse.json(
        {
          error: "You've reached your article limit for this month",
          usageLimitExceeded: true,
          currentUsage,
          limit,
        },
        { status: 403 }
      )
    }

    // --------------------------------------------
    // 3️⃣ Atomic Status Transition (CRITICAL)
    // --------------------------------------------
    const { data: updatedArticle } = await supabaseAdmin
      .from('articles')
      .update({
        status: 'generating',
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.articleId)
      .eq('status', 'queued') // ensures atomicity
      .select('id')
      .single()

    if (!updatedArticle) {
      return NextResponse.json(
        { error: 'Article already processing or invalid state' },
        { status: 409 }
      )
    }

    // --------------------------------------------
    // 4️⃣ Emit Inngest Event
    // --------------------------------------------
    let inngestEventId: string | null = null

    try {
      const result = await inngest.send({
        name: 'article/generate',
        data: { articleId: parsed.articleId },
      })

      inngestEventId = result.ids?.[0] || null
    } catch (inngestError) {
      console.error('[Article Generation] Failed to send Inngest event:', inngestError)

      // rollback status
      await supabaseAdmin
        .from('articles')
        .update({ status: 'queued' })
        .eq('id', parsed.articleId)

      return NextResponse.json(
        { error: 'Failed to queue article generation' },
        { status: 500 }
      )
    }

    // Store Inngest event ID if available
    if (inngestEventId) {
      await supabaseAdmin
        .from('articles')
        .update({ inngest_event_id: inngestEventId })
        .eq('id', parsed.articleId)
    }

    // --------------------------------------------
    // 5️⃣ Increment Usage
    // --------------------------------------------
    await supabaseAdmin
      .from('usage_tracking')
      .upsert(
        {
          organization_id: organizationId,
          metric_type: 'article_generation',
          billing_period: currentMonth,
          usage_count: currentUsage + 1,
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: 'organization_id,metric_type,billing_period',
        }
      )

    // --------------------------------------------
    // 6️⃣ Audit Log
    // --------------------------------------------
    logActionAsync({
      orgId: organizationId,
      userId,
      action: 'article.generation.started',
      details: { articleId: parsed.articleId },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    return NextResponse.json({
      success: true,
      articleId: parsed.articleId,
      status: 'generating',
    })

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues?.[0]?.message || 'Validation error' },
        { status: 400 }
      )
    }

    console.error('[Article Generation] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
