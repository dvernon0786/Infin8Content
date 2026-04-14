import { createClient } from './server'
import { PLAN_LIMITS } from '@/lib/config/plan-limits'
import { cache } from 'react'

export type PlanType = 'trial' | 'starter' | 'pro' | 'agency';

export interface OrganizationRecord {
  id: string
  name: string
  plan?: PlanType | string
  plan_type?: PlanType | string
  payment_status?: string
  created_at?: string
  updated_at?: string
  role?: string
  white_label_settings?: any
}

export interface UserRecord {
  id: string
  email: string
  auth_user_id: string
  role: string
  org_id: string | null
  first_name?: string
  last_name?: string
}

export interface CurrentUser {
  user: {
    id: string
    email: string
  }
  id: string
  email: string
  first_name: string | null
  role: string
  org_id: string | null
  organizations: (OrganizationRecord & {
    article_usage?: number;
    article_limit?: number | null;
    total_completed_usage?: number;
  }) | null
}

/**
 * getCurrentUser - Standard utility to fetch the authenticated user 
 * and their organization context with reinforced plan-metering truth.
 */
export const getCurrentUser = cache(async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()

  // Get Auth Service User
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  // Get DB User Profile
  const { data: userRecord, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (profileError || !userRecord) return null

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
      const planType = (organizationData.plan || organizationData.plan_type || 'starter').toLowerCase() as PlanType
      const planKey = (['trial', 'starter', 'pro', 'agency'].includes(planType) ? planType : 'starter') as PlanType;

      // Calculate usage
      let articleUsage = organizationData.article_usage || 0

      // BUG E FIX: Trial users need strict sync with generate API's 'completed' gate
      if (planType === 'trial') {
        const { count } = await supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', (userRecord as any).org_id)
          .eq('status', 'completed')

        articleUsage = count || 0
      }

      const totalCompletedUsage = articleUsage

      // Resolve plan limit from centralized config
      const articleLimit = PLAN_LIMITS.article_generation[planKey];

      organization = {
        ...organizationData,
        plan: planKey,
        article_usage: articleUsage,
        article_limit: articleLimit,
        total_completed_usage: totalCompletedUsage,
        // Fallback role if missing on org itself - often owners are admins
        role: organizationData.role || (userRecord as any).role
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
    first_name: (userRecord as any).first_name || null,
    role: (userRecord as any).role,
    org_id: (userRecord as any).org_id,
    organizations: organization,
  }
})
