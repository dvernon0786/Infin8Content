import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { validateSupabaseEnv } from '@/lib/supabase/env'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { inngest } from '@/lib/inngest/client'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const articleGenerationSchema = z.object({
  keyword: z.string().min(1, 'Keyword must not be empty').max(200, 'Keyword must be less than 200 characters'),
  targetWordCount: z.number().int().min(500).max(10000),
  writingStyle: z.string().optional().default('Professional'),
  targetAudience: z.string().optional().default('General'),
  customInstructions: z.string().max(2000, 'Custom instructions must be less than 2000 characters').optional(),
})

// Plan limits for article generation per month
const PLAN_LIMITS: Record<string, number | null> = {
  starter: 10,    // 10 articles/month
  pro: 50,        // 50 articles/month
  agency: null,   // unlimited
}

export async function POST(request: Request) {
  try {
    validateSupabaseEnv()
    
    const body = await request.json()
    const parsed = articleGenerationSchema.parse(body)

    // Get current user and organization
    const currentUser = await getCurrentUser()
    
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const organizationId = currentUser.org_id
    const userId = currentUser.id
    const plan = currentUser.organizations?.plan || 'starter'

    // Get service role client for admin operations (usage tracking)
    const supabaseAdmin = createServiceRoleClient()
    
    // Get regular client for RLS-protected operations (article creation)
    const supabase = await createClient()

    // Check usage limits before creating article record
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    
    // Type assertion needed until database types are regenerated after migration
    // TODO: Remove type assertion after running: supabase gen types typescript --project-id ybsgllsnaqkpxgdjdvcz > lib/supabase/database.types.ts
    const { data: usageData, error: usageError } = await (supabaseAdmin
      .from('usage_tracking' as any)
      .select('usage_count')
      .eq('organization_id', organizationId)
      .eq('metric_type', 'article_generation')
      .eq('billing_period', currentMonth)
      .single() as unknown as Promise<{ data: { usage_count: number } | null; error: any }>)

    if (usageError && usageError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Failed to check usage limits:', usageError)
      return NextResponse.json(
        { error: 'Failed to check usage limits' },
        { status: 500 }
      )
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

    // Create article record in database with status "queued"
    // Type assertion needed until database types are regenerated after migration
    const { data: article, error: insertError } = await (supabase
      .from('articles' as any)
      .insert({
        org_id: organizationId,
        created_by: userId,
        keyword: parsed.keyword,
        status: 'queued',
        target_word_count: parsed.targetWordCount,
        writing_style: parsed.writingStyle,
        target_audience: parsed.targetAudience,
        custom_instructions: parsed.customInstructions,
      })
      .select('id')
      .single() as unknown as Promise<{ data: { id: string } | null; error: any }>)

    if (insertError || !article) {
      console.error('Failed to create article record:', insertError)
      return NextResponse.json(
        { error: 'Failed to create article record' },
        { status: 500 }
      )
    }

    // Queue article generation via Inngest
    const { ids } = await inngest.send({
      name: 'article/generate',
      data: {
        articleId: article.id,
      },
    })

    // Update article with Inngest event ID
    await supabase
      .from('articles' as any)
      .update({ inngest_event_id: ids[0] })
      .eq('id', article.id)

    // Increment usage tracking atomically (after successful queue)
    // Type assertion needed until database types are regenerated after migration
    const { error: usageUpdateError } = await (supabaseAdmin
      .from('usage_tracking' as any)
      .upsert({
        organization_id: organizationId,
        metric_type: 'article_generation',
        billing_period: currentMonth,
        usage_count: currentUsage + 1,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'organization_id,metric_type,billing_period',
      }) as unknown as Promise<{ error: any }>)

    if (usageUpdateError) {
      console.error('Failed to update usage tracking:', usageUpdateError)
      // Don't fail the request - usage tracking is not critical for the response
    }

    return NextResponse.json({
      success: true,
      articleId: article.id,
      status: 'queued',
      message: 'Article generation started',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0]
      return NextResponse.json(
        { error: firstError?.message || 'Validation error' },
        { status: 400 }
      )
    }
    
    // Log error with context for debugging
    console.error('Article generation error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    return NextResponse.json(
      { error: 'Article generation failed. Please try again.' },
      { status: 500 }
    )
  }
}

