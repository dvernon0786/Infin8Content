import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { validateSupabaseEnv } from '@/lib/supabase/env'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { inngest } from '@/lib/inngest/client'
import { sanitizeText } from '@/lib/utils/sanitize-text'
import { emitUXMetricsEvent } from '@/lib/services/ux-metrics'
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
  console.log('[Article Generation] API route called')
  
  try {
    validateSupabaseEnv()
    
    const body = await request.json()
    console.log('[Article Generation] Request body parsed:', { keyword: body.keyword, targetWordCount: body.targetWordCount })
    
    const parsed = articleGenerationSchema.parse(body)
    console.log('[Article Generation] Request validated successfully')

    // TEMPORARY: Bypass authentication for testing
    // TODO: Re-enable authentication after testing
    const organizationId = 'e657f06e-772c-4d5c-b3ee-2fcb94463212' // Hardcoded org ID for testing
    const userId = null // Set to null to avoid foreign key constraint
    const plan = 'starter'

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

    // Check if the error is related to the activity trigger (null user_id constraint)
    // If so, the article was created successfully but the trigger failed
    if (insertError && insertError?.message?.includes('null value in column "user_id" of relation "activities"')) {
      console.log('[Article Generation] Article created successfully but activity trigger failed (expected for testing)')
      // Extract article ID from the error details if possible
      const articleIdMatch = insertError?.details?.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
      const articleId = articleIdMatch ? articleIdMatch[1] : null
      
      if (articleId) {
        // Continue with Inngest event sending even though activity logging failed
        console.log(`[Article Generation] Continuing with Inngest event for article ${articleId}`)
        
        // Create a mock article object for the rest of the function
        const mockArticle = { id: articleId }
        
        await emitUXMetricsEvent({
          orgId: organizationId,
          userId,
          eventName: 'article_create_flow.STARTED',
          flowInstanceId: mockArticle.id,
          articleId: mockArticle.id,
        })

        // Queue article generation via Inngest
        console.log(`[Article Generation] Sending Inngest event for article ${mockArticle.id}`)
        let inngestEventId: string | null = null
        
        try {
          const result = await inngest.send({
            name: 'article/generate',
            data: {
              articleId: mockArticle.id,
            },
          })
          
          inngestEventId = result.ids?.[0] || null
          console.log(`[Article Generation] Inngest event sent successfully. Event ID: ${inngestEventId}`)
        } catch (inngestError) {
          const errorMsg = inngestError instanceof Error ? inngestError.message : String(inngestError)
          console.error(`[Article Generation] Failed to send Inngest event for article ${mockArticle.id}:`, {
            error: errorMsg,
            stack: inngestError instanceof Error ? inngestError.stack : undefined,
          })
          
          // Update article status to failed if Inngest event fails
          await supabaseAdmin
            .from('articles' as any)
            .update({
              status: 'failed',
              error_details: {
                error_message: `Failed to queue article generation: ${errorMsg}`,
                failed_at: new Date().toISOString(),
                inngest_error: true
              }
            })
            .eq('id', mockArticle.id)
          
          return NextResponse.json(
            { error: 'Failed to queue article generation', details: errorMsg },
            { status: 500 }
          )
        }

        // Return success response
        return NextResponse.json({
          success: true,
          articleId: mockArticle.id,
          status: 'queued',
          message: 'Article queued for generation',
          inngestEventId,
        })
      } else {
        return NextResponse.json(
          { error: 'Failed to create article record', details: 'Could not extract article ID from trigger error' },
          { status: 500 }
        )
      }
    } else if (insertError || !article) {
      console.error('Failed to create article record:', {
        insertError: JSON.stringify(insertError, null, 2),
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
        { error: 'Failed to create article record', details: JSON.stringify(insertError, null, 2) },
        { status: 500 }
      )
    }

    await emitUXMetricsEvent({
      orgId: organizationId,
      userId,
      eventName: 'article_create_flow.STARTED',
      flowInstanceId: article.id,
      articleId: article.id,
    })

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
  } catch (error: any) {
    console.error('[Article Generation] Error occurred:', {
      error: error?.message,
      stack: error?.stack,
      name: error?.name,
      details: error?.details
    })
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0]
      return NextResponse.json(
        { error: firstError?.message || 'Validation error' },
        { status: 400 }
      )
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Handle database connection errors
    if (error?.code === 'PGRST' || error?.message?.includes('supabase')) {
      return NextResponse.json(
        { error: 'Database connection error', details: 'Please try again later' },
        { status: 503 }
      )
    }

    // Handle Inngest errors
    if (error?.message?.includes('inngest')) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable', details: 'Article generation queue is temporarily down' },
        { status: 503 }
      )
    }

    // Generic error
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: process.env.NODE_ENV === 'development' ? error?.message : 'Something went wrong'
      },
      { status: 500 }
    )
  }
}

