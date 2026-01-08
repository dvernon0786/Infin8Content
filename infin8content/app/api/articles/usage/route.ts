import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { NextResponse } from 'next/server'

// Plan limits for article generation per month
const PLAN_LIMITS: Record<string, number | null> = {
  starter: 10,    // 10 articles/month
  pro: 50,        // 50 articles/month
  agency: null,   // unlimited
}

/**
 * GET /api/articles/usage
 * 
 * Returns current usage and plan limits for article generation.
 * Fetches usage tracking data for the authenticated user's organization.
 * 
 * @returns JSON response with usage information
 * 
 * Response (Success - 200):
 * - currentUsage: number - Current number of articles generated this month
 * - limit: number | null - Plan limit (null for unlimited plans)
 * - plan: string - Current plan name (starter, pro, agency)
 * - remaining: number | null - Remaining articles available (null for unlimited)
 * 
 * Response (Error - 401):
 * - error: "Authentication required"
 * 
 * Response (Error - 500):
 * - error: string - Server error message
 * 
 * Authentication: Requires authenticated user session
 * Authorization: User must belong to an organization
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const organizationId = currentUser.org_id
    const plan = currentUser.organizations?.plan || 'starter'

    // Get service role client for admin operations (usage tracking)
    const supabaseAdmin = createServiceRoleClient()
    
    // Check usage limits
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
        { error: 'Failed to fetch usage information' },
        { status: 500 }
      )
    }

    const currentUsage = usageData?.usage_count || 0
    const limit = PLAN_LIMITS[plan]

    return NextResponse.json({
      currentUsage,
      limit,
      plan,
      remaining: limit !== null ? Math.max(0, limit - currentUsage) : null,
    })
  } catch (error) {
    console.error('Usage fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage information' },
      { status: 500 }
    )
  }
}

