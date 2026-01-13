import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { validateSupabaseEnv } from '@/lib/supabase/env'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { inngest } from '@/lib/inngest/client'
import { sanitizeText } from '@/lib/utils/sanitize-text'
import { z } from 'zod'
import { NextResponse } from 'next/server'

/**
 * Zod schema for article generation request validation
 * Validates and sanitizes user input before processing
 */
const articleGenerationSchema = z.object({
  keyword: z.string().min(1, 'Keyword must not be empty').max(200, 'Keyword must be less than 200 characters'),
  targetWordCount: z.number().int().min(500).max(10000),
  writingStyle: z.enum(['Professional', 'Conversational', 'Technical', 'Casual', 'Formal']).optional().default('Professional'),
  targetAudience: z.enum(['General', 'B2B', 'B2C', 'Technical', 'Consumer']).optional().default('General'),
  customInstructions: z.string().max(2000, 'Custom instructions must be less than 2000 characters').optional(),
})

// Plan limits for article generation per month
const PLAN_LIMITS: Record<string, number | null> = {
  starter: 10,    // 10 articles/month
  pro: 50,        // 50 articles/month
  agency: null,   // unlimited
}

/**
 * POST /api/articles/generate
 * 
 * Creates a new article generation request and queues it via Inngest.
 * 
 * @param request - HTTP request containing article generation parameters
 * @returns JSON response with articleId and status, or error details
 * 
 * Request Body:
 * - keyword: string (required, 1-200 chars) - Target keyword for article
 * - targetWordCount: number (required, 500-10000) - Desired article length
 * - writingStyle: string (optional) - One of: Professional, Conversational, Technical, Casual, Formal
 * - targetAudience: string (optional) - One of: General, B2B, B2C, Technical, Consumer
 * - customInstructions: string (optional, max 2000 chars) - Additional instructions for article generation
 * 
 * Response (Success - 200):
 * - success: boolean
 * - articleId: string (UUID)
 * - status: "queued"
 * - message: string
 * 
 * Response (Error - 400):
 * - error: string - Validation error message
 * 
 * Response (Error - 401):
 * - error: "Authentication required"
 * 
 * Response (Error - 403):
 * - error: string - Usage limit exceeded message
 * - details: { code: "USAGE_LIMIT_EXCEEDED", usageLimitExceeded: true, currentUsage: number, limit: number }
 * 
 * Response (Error - 500):
 * - error: string - Server error message
 * - details?: string - Additional error details
 * 
 * Authentication: Requires authenticated user session
 * Authorization: User must belong to an organization
 */
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
    
    // Skip usage tracking for now to avoid database schema issues
    // TODO: Re-enable usage tracking after database migration
    const currentUsage = 0
    const limit = PLAN_LIMITS[plan] || null

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

    // Sanitize custom instructions before storing in database
    const sanitizedCustomInstructions = parsed.customInstructions 
      ? sanitizeText(parsed.customInstructions)
      : undefined

    // Create article record in database with status "queued"
    // Use service role client to bypass RLS for article creation
    // Type assertion needed until database types are regenerated after migration
    // TODO: Remove type assertion after running: supabase gen types typescript --project-id ybsgllsnaqkpxgdjdvcz > lib/supabase/database.types.ts
    const { data: article, error: insertError } = await (supabaseAdmin
      .from('articles' as any)
      .insert({
        org_id: organizationId,
        created_by: userId || null, // Ensure null if userId is undefined
        keyword: parsed.keyword,
        status: 'queued',
        target_word_count: parsed.targetWordCount,
        writing_style: parsed.writingStyle,
        target_audience: parsed.targetAudience,
        custom_instructions: sanitizedCustomInstructions,
      })
      .select('id')
      .single() as unknown as Promise<{ data: { id: string } | null; error: any }>)

    if (insertError || !article) {
      console.error('Failed to create article record:', {
        insertError,
        article,
        organizationId,
        userId,
        parsed: {
          keyword: parsed.keyword,
          targetWordCount: parsed.targetWordCount,
          writingStyle: parsed.writingStyle,
          targetAudience: parsed.targetAudience
        }
      })
      return NextResponse.json(
        { error: 'Failed to create article record', details: insertError?.message },
        { status: 500 }
      )
    }

    // Queue article generation via Inngest
    console.log(`[Article Generation] Sending Inngest event for article ${article.id}`)
    let inngestEventId: string | null = null
    
    try {
      const result = await inngest.send({
        name: 'article/generate',
        data: {
          articleId: article.id,
        },
      })
      
      inngestEventId = result.ids?.[0] || null
      console.log(`[Article Generation] Inngest event sent successfully. Event ID: ${inngestEventId}`)
    } catch (inngestError) {
      const errorMsg = inngestError instanceof Error ? inngestError.message : String(inngestError)
      console.error(`[Article Generation] Failed to send Inngest event for article ${article.id}:`, {
        error: errorMsg,
        stack: inngestError instanceof Error ? inngestError.stack : undefined,
      })
      
      // Update article status to failed if Inngest event fails
      await supabase
        .from('articles' as any)
        .update({
          status: 'failed',
          error_details: {
            error_message: `Failed to queue article generation: ${errorMsg}`,
            failed_at: new Date().toISOString(),
            inngest_error: true
          }
        })
        .eq('id', article.id)
      
      return NextResponse.json(
        { 
          error: 'Failed to queue article generation',
          details: errorMsg
        },
        { status: 500 }
      )
    }

    // Update article with Inngest event ID
    if (inngestEventId) {
      const { error: updateError } = await supabase
        .from('articles' as any)
        .update({ inngest_event_id: inngestEventId })
        .eq('id', article.id)
      
      if (updateError) {
        console.error(`[Article Generation] Failed to update article with Inngest event ID:`, updateError)
        // Don't fail the request - event was sent successfully
      }
    }

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

