import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { validateSupabaseEnv } from '@/lib/supabase/env'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { inngest } from '@/lib/inngest/client'
import { sanitizeText } from '@/lib/utils/sanitize-text'
import { emitUXMetricsEvent } from '@/lib/services/ux-metrics'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { logIntentActionAsync } from '@/lib/services/intent-engine/intent-audit-logger'
import { AuditAction } from '@/types/audit'
import { isFeatureFlagEnabled } from '@/lib/utils/feature-flags'
import { FEATURE_FLAG_KEYS } from '@/lib/types/feature-flag'
import { z } from 'zod'
import { NextResponse } from 'next/server'

/**
 * Zod schema for article generation request validation
 * Validates and sanitizes user input before processing
 */
const articleGenerationSchema = z.object({
  keyword: z.string().max(200, 'Keyword must be less than 200 characters').optional(),
  articleId: z.string().uuid('Invalid article ID').optional(),
  targetWordCount: z.number().int().min(500).max(10000).optional().default(1000),
  writingStyle: z.enum(['Professional', 'Conversational', 'Technical', 'Casual', 'Formal']).optional().default('Professional'),
  targetAudience: z.enum(['General', 'B2B', 'B2C', 'Technical', 'Consumer']).optional().default('General'),
  customInstructions: z.string().max(2000, 'Custom instructions must be less than 2000 characters').optional(),
}).refine(data => data.keyword || data.articleId, {
  message: "Either keyword or articleId must be provided",
  path: ["keyword"]
})

// Plan limits for article generation per month
const PLAN_LIMITS: Record<string, number | null> = {
  starter: 10,    // 10 articles/month
  pro: 50,        // 50 articles/month
  agency: null,   // unlimited
}

/**
 * Execute legacy article generation workflow
 * This is the original article generation logic that remains unchanged
 */
async function executeLegacyArticleGeneration({
  request,
  parsed,
  organizationId,
  userId,
  plan,
  currentUser
}: {
  request: Request
  parsed: z.infer<typeof articleGenerationSchema>
  organizationId: string
  userId: string
  plan: string
  currentUser: any
}) {
  // Get service role client for admin operations (usage tracking)
  const supabaseAdmin = createServiceRoleClient()

  // Get regular client for RLS-protected operations (article creation)
  const supabase = await createClient()

  // Check usage limits before creating article record
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

  // Query current usage for this month
  const { data: usageData, error: usageError } = await (supabaseAdmin
    .from('usage_tracking' as any)
    .select('usage_count')
    .eq('organization_id', organizationId)
    .eq('metric_type', 'article_generation')
    .eq('billing_period', currentMonth)
    .single() as unknown as Promise<{ data: { usage_count: number } | null; error: any }>)

  // Handle error: PGRST116 means no row found (first article of month)
  if (usageError && usageError.code !== 'PGRST116') {
    console.error('[Article Generation] Failed to check usage limits:', usageError)
  }

  const currentUsage = usageData?.usage_count || 0
  const limit = PLAN_LIMITS[plan]

  // Check if limit exceeded (skip check if unlimited)
  if (limit !== null && currentUsage >= limit) {
    return NextResponse.json(
      {
        error: "You've reached your article limit for this month",
        details: {
          code: 'USAGE_LIMIT_EXCEEDED',
          usageLimitExceeded: true,
          currentUsage,
          limit,
        },
      },
      { status: 403 }
    )
  }

  // Sanitize custom instructions
  const sanitizedCustomInstructions = parsed.customInstructions
    ? sanitizeText(parsed.customInstructions)
    : undefined

  // Create article record
  const { data: article, error: insertError } = await (supabaseAdmin
    .from('articles' as any)
    .insert({
      org_id: organizationId,
      created_by: userId || null,
      keyword: parsed.keyword,
      title: `Article: ${parsed.keyword}`,
      status: 'queued',
      target_word_count: parsed.targetWordCount,
      writing_style: parsed.writingStyle,
      target_audience: parsed.targetAudience,
      custom_instructions: sanitizedCustomInstructions,
    })
    .select('id')
    .single() as unknown as Promise<{ data: { id: string } | null; error: any }>)

  if (insertError || !article) {
    return NextResponse.json(
      { error: 'Failed to create article record', details: JSON.stringify(insertError, null, 2) },
      { status: 500 }
    )
  }

  // Log audit events
  logActionAsync({
    orgId: organizationId,
    userId: userId,
    action: 'article.generation.started',
    details: { articleId: article.id, keyword: parsed.keyword },
    ipAddress: extractIpAddress(request.headers),
    userAgent: extractUserAgent(request.headers),
  })

  logIntentActionAsync({
    organizationId,
    entityType: 'article',
    entityId: article.id,
    actorId: userId,
    action: AuditAction.ARTICLE_QUEUED,
    details: { keyword: parsed.keyword },
    ipAddress: extractIpAddress(request.headers),
    userAgent: extractUserAgent(request.headers),
  })

  await emitUXMetricsEvent({
    orgId: organizationId,
    userId,
    eventName: 'article_create_flow.STARTED',
    flowInstanceId: article.id,
    articleId: article.id,
  })

  // Queue via Inngest
  try {
    const result = await inngest.send({
      name: 'article/generate',
      data: { articleId: article.id },
    })

    const inngestEventId = result.ids?.[0] || null
    if (inngestEventId) {
      await supabaseAdmin
        .from('articles' as any)
        .update({ inngest_event_id: inngestEventId })
        .eq('id', article.id)
    }
  } catch (inngestError) {
    const errorMsg = inngestError instanceof Error ? inngestError.message : String(inngestError)
    await supabaseAdmin
      .from('articles' as any)
      .update({
        status: 'failed',
        error_details: { error_message: errorMsg, failed_at: new Date().toISOString() }
      })
      .eq('id', article.id)

    return NextResponse.json({ error: 'Failed to queue article generation' }, { status: 500 })
  }

  // Increment usage tracking
  await (supabaseAdmin
    .from('usage_tracking' as any)
    .upsert({
      organization_id: organizationId,
      metric_type: 'article_generation',
      billing_period: currentMonth,
      usage_count: currentUsage + 1,
      last_updated: new Date().toISOString(),
    }, {
      onConflict: 'organization_id,metric_type,billing_period',
    }))

  return NextResponse.json({
    success: true,
    articleId: article.id,
    status: 'queued',
    message: 'Article generation started',
  })
}

export async function POST(request: Request) {
  console.log('[Article Generation] API route called')

  try {
    validateSupabaseEnv()

    const body = await request.json()
    const parsed = articleGenerationSchema.parse(body)

    // Authenticate user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const organizationId = currentUser.org_id
    const userId = currentUser.id
    const supabaseAdmin = createServiceRoleClient()

    // CASE 1: Triggering an existing article (Manual Trigger from UI)
    if (parsed.articleId) {
      console.log(`[Article Generation] Triggering existing article: ${parsed.articleId}`)

      const { data: article, error: fetchError } = await (supabaseAdmin
        .from('articles' as any)
        .select('id, status, org_id')
        .eq('id', parsed.articleId)
        .eq('org_id', organizationId)
        .single() as unknown as Promise<{ data: any; error: any }>)

      if (fetchError || !article) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }

      if (article.status !== 'queued') {
        return NextResponse.json({ error: `Article is already ${article.status}` }, { status: 400 })
      }

      // Atomic transition
      await supabaseAdmin
        .from('articles' as any)
        .update({ status: 'generating', updated_at: new Date().toISOString() })
        .eq('id', article.id)

      // Emit Inngest event
      await inngest.send({
        name: 'article/generate',
        data: { articleId: article.id },
      })

      // Audit Log
      logIntentActionAsync({
        organizationId,
        entityType: 'article',
        entityId: article.id,
        actorId: userId,
        action: AuditAction.ARTICLE_GENERATION_STARTED,
        details: { trigger: 'manual_button' },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })

      return NextResponse.json({
        success: true,
        articleId: article.id,
        status: 'generating',
        message: 'Generation started'
      })
    }

    // CASE 2: Legacy Keyword Flow (Standard Creation)
    const plan = currentUser.organizations?.plan || 'starter'
    return await executeLegacyArticleGeneration({
      request,
      parsed: {
        ...parsed,
        keyword: parsed.keyword!
      } as any,
      organizationId,
      userId,
      plan,
      currentUser
    })

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues?.[0]?.message || 'Validation error' }, { status: 400 })
    }
    console.error('[Article Generation] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
