import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { validateSupabaseEnv } from '@/lib/supabase/env'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { searchKeywords } from '@/lib/services/dataforseo'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const keywordResearchSchema = z.object({
  keyword: z.string().min(1, 'Keyword must not be empty').max(200, 'Keyword must be less than 200 characters'),
})

// Plan limits for keyword research per month
const PLAN_LIMITS: Record<string, number | null> = {
  starter: 50,
  pro: 200,
  agency: null, // unlimited
}

export async function POST(request: Request) {
  let keyword: string | undefined
  
  try {
    validateSupabaseEnv()
    
    const body = await request.json()
    const parsed = keywordResearchSchema.parse(body)
    keyword = parsed.keyword

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

    // Get service role client for admin operations (usage tracking, API costs)
    const supabaseAdmin = createServiceRoleClient()
    
    // Get regular client for RLS-protected operations (cache lookup, insert research)
    const supabase = await createClient()

    // Check usage limits before API call
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    
    // Type assertion needed until database types are regenerated after migration
    // TODO: Remove type assertion after running: supabase gen types typescript --project-id ybsgllsnaqkpxgdjdvcz > lib/supabase/database.types.ts
    const { data: usageData, error: usageError } = await (supabaseAdmin
      .from('usage_tracking' as any)
      .select('usage_count')
      .eq('organization_id', organizationId)
      .eq('metric_type', 'keyword_research')
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
          error: "You've reached your keyword research limit for this month",
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

    // Check cache for existing research (7-day TTL)
    // Normalize keyword for cache lookup (case-insensitive)
    const cacheKey = keyword!.toLowerCase().trim()
    // Type assertion needed until database types are regenerated after migration
    const { data: cachedResearch, error: cacheError } = await (supabase
      .from('keyword_researches' as any)
      .select('id, results, api_cost, cached_until')
      .eq('organization_id', organizationId)
      .eq('keyword', cacheKey) // Use direct equality since keyword is normalized
      .gt('cached_until', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single() as unknown as Promise<{ data: any; error: any }>)

    if (cachedResearch && !cacheError) {
      // Cache hit - update updated_at timestamp
      // Type assertion needed until database types are regenerated after migration
      // TODO: Remove type assertion after regenerating types from Supabase Dashboard
      const { error: updateError } = await (supabase as any)
        .from('keyword_researches')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', cachedResearch.id)

      if (updateError) {
        console.warn('Failed to update cache timestamp:', updateError)
        // Continue anyway - not critical for response
      }

      // Parse cached results
      const results = cachedResearch.results as any
      const keywordResult = results.tasks?.[0]?.result?.[0]
      
      if (keywordResult) {
        // Map competition level
        const competitionLevel = mapCompetitionLevel(
          keywordResult.keyword_info?.competition || 
          competitionIndexToLevel(keywordResult.competition_index)
        )

        // Extract trend data
        const trend = extractTrendData(
          keywordResult.monthly_searches || 
          keywordResult.keyword_info?.monthly_searches || 
          []
        )

        return NextResponse.json({
          success: true,
          data: {
            keyword: keywordResult.keyword,
            results: [{
              keyword: keywordResult.keyword,
              searchVolume: keywordResult.search_volume,
              keywordDifficulty: keywordResult.competition_index,
              trend,
              cpc: keywordResult.cpc ?? keywordResult.keyword_info?.cpc,
              competition: competitionLevel,
            }],
            apiCost: Number(cachedResearch.api_cost),
            cached: true,
            usage: {
              current: currentUsage,
              limit,
            },
          },
        })
      }
    }

    // Cache miss - call DataForSEO API
    const apiResponse = await searchKeywords({
      keywords: [keyword!], // keyword is guaranteed to be set at this point
      locationCode: 2840, // United States
      languageCode: 'en',
    })

    if (!apiResponse.success) {
      console.error('DataForSEO API returned unsuccessful response:', apiResponse)
      return NextResponse.json(
        { error: 'Keyword research failed. Please try again.' },
        { status: 500 }
      )
    }

    // Store results in database with 7-day cache TTL
    const cachedUntil = new Date()
    cachedUntil.setDate(cachedUntil.getDate() + 7)

    // Store keyword normalized (lowercase, trimmed) for consistent cache lookups
    const normalizedKeyword = keyword!.toLowerCase().trim()

    // Type assertion needed until database types are regenerated after migration
    const { error: insertError } = await (supabase
      .from('keyword_researches' as any)
      .insert({
        organization_id: organizationId,
        user_id: userId,
        keyword: normalizedKeyword,
        results: {
          version: '0.1.20240115',
          status_code: 20000,
          tasks: [{
            status_code: 20000,
            result: [{
              keyword: apiResponse.data.keyword,
              search_volume: apiResponse.data.searchVolume,
              competition_index: apiResponse.data.keywordDifficulty,
              cpc: apiResponse.data.cpc,
              monthly_searches: apiResponse.data.trend.map((volume, index) => ({
                year: new Date().getFullYear(),
                month: (new Date().getMonth() + index) % 12 + 1,
                search_volume: volume,
              })),
              keyword_info: {
                competition: apiResponse.data.competition.toUpperCase(),
                cpc: apiResponse.data.cpc,
                search_volume: apiResponse.data.searchVolume,
              },
            }],
          }],
        },
        api_cost: apiResponse.cost,
        cached_until: cachedUntil.toISOString(),
      }) as unknown as Promise<{ error: any }>)

    if (insertError) {
      console.error('Failed to store keyword research:', insertError)
      // Don't fail the request - results are still valid
    }

    // Track API cost (Epic 10.7)
    // Type assertion needed until database types are regenerated after migration
    const { error: costError } = await (supabaseAdmin
      .from('api_costs' as any)
      .insert({
        organization_id: organizationId,
        service: 'dataforseo',
        operation: 'keyword_research',
        cost: apiResponse.cost,
      }) as unknown as Promise<{ error: any }>)

    if (costError) {
      console.error('Failed to track API cost:', costError)
      // Don't fail the request - cost tracking is not critical
    }

    // Increment usage tracking (Epic 10.1)
    // Type assertion needed until database types are regenerated after migration
    const { error: usageUpdateError } = await (supabaseAdmin
      .from('usage_tracking' as any)
      .upsert({
        organization_id: organizationId,
        metric_type: 'keyword_research',
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
      data: {
        keyword: apiResponse.data.keyword,
        results: [apiResponse.data],
        apiCost: apiResponse.cost,
        cached: false,
        usage: {
          current: currentUsage + 1,
          limit,
        },
      },
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
    console.error('Keyword research error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      keyword: keyword || 'unknown',
    })
    
    return NextResponse.json(
      { error: 'Keyword research failed. Please try again.' },
      { status: 500 }
    )
  }
}

// Helper functions to map API response

/**
 * Maps competition level string to standardized format
 * @param competition - Competition level from API (e.g., 'LOW', 'MEDIUM', 'HIGH')
 * @returns Standardized competition level ('Low' | 'Medium' | 'High')
 */
function mapCompetitionLevel(competition: string): 'Low' | 'Medium' | 'High' {
  const upper = competition.toUpperCase()
  if (upper === 'LOW') return 'Low'
  if (upper === 'MEDIUM' || upper === 'MED') return 'Medium'
  if (upper === 'HIGH') return 'High'
  return 'Medium'
}

/**
 * Converts competition index (0-100) to competition level string
 * @param index - Competition index from API (0-100)
 * @returns Competition level string ('LOW' | 'MEDIUM' | 'HIGH')
 */
function competitionIndexToLevel(index: number): string {
  if (index < 33) return 'LOW'
  if (index < 67) return 'MEDIUM'
  return 'HIGH'
}

/**
 * Extracts trend data from monthly search volume array
 * Sorts by year and month, then returns array of search volumes
 * @param monthlySearches - Array of monthly search data with year, month, and search_volume
 * @returns Sorted array of search volumes
 */
function extractTrendData(monthlySearches: Array<{ year: number; month: number; search_volume: number }>): number[] {
  const sorted = [...monthlySearches].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.month - b.month
  })
  return sorted.map(item => item.search_volume)
}

