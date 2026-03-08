import { createClient } from './server'
import { cache } from 'react'
import type { Database } from './database.types'
import { PLAN_LIMITS } from '../config/plan-limits'

type UserRecord = Database['public']['Tables']['users']['Row']
type OrganizationRecord = Database['public']['Tables']['organizations']['Row']

export interface CurrentUser {
  user: {
    id: string
    email?: string
  }
  id: string
  email: string
  first_name: string | null
  role: string
  org_id: string | null
  organizations?: (OrganizationRecord & {
    article_usage?: number;
    article_limit?: number | null;
  }) | null
}

/**
 * Get the current authenticated user with their organization data
 * @returns Current user with organization data, or null if not authenticated
 */
export const getCurrentUser = cache(async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()

  // Get authenticated user from Supabase Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  // Query users table to get user record
  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .select('id, email, first_name, role, org_id')
    .eq('auth_user_id', user.id)
    .single()

  if (userError || !userRecord) {
    console.error('Failed to load user record in getCurrentUser:', userError)
    return null
  }

  // Query organization if org_id exists
  let organization: (OrganizationRecord & {
    article_usage?: number;
    article_limit?: number | null;
    total_completed_usage?: number;
  }) | null = null
  if ((userRecord as any).org_id) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', (userRecord as any).org_id)
      .single()

    if (orgData) {
      const organizationData = orgData as any
      // Determine effective plan - use plan_type if available, fallback to plan
      const planType = (organizationData.plan_type || organizationData.plan || 'starter').toLowerCase()
      const planKey = planType as keyof typeof PLAN_LIMITS.article_generation;

      // Calculate usage
      let articleUsage = 0
      let totalCompletedUsage = 0

      if (planType === 'trial') {
        // Trial users: count TOTAL completed articles
        const { count } = await supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', (userRecord as any).org_id)
          .in('status', ['queued', 'processing', 'completed', 'reviewing']);

        articleUsage = count || 0
        totalCompletedUsage = count || 0
      } else {
        // Paid users: count current month's article usage
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count } = await supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', (userRecord as any).org_id)
          .gte('created_at', startOfMonth.toISOString())
          .in('status', ['queued', 'processing', 'completed', 'reviewing']);

        articleUsage = count || 0
      }

      // Get plan limit from centralized config
      const articleLimit = PLAN_LIMITS.article_generation[planKey] ?? (() => {
        console.error(`[Quota] Unknown plan key: ${planKey}, defaulting to trial limit`)
        return PLAN_LIMITS.article_generation.trial
      })();

      organization = {
        ...organizationData,
        article_usage: articleUsage,
        article_limit: articleLimit,
        total_completed_usage: totalCompletedUsage
      }
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email || '',
    },
    id: (userRecord as any).id,
    email: (userRecord as any).email,
    first_name: (userRecord as any).first_name,
    role: (userRecord as any).role,
    org_id: (userRecord as any).org_id,
    organizations: organization,
  }
})
