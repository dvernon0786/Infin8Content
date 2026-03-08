import { createClient } from './server'
import { PLAN_LIMITS } from '@/lib/config/plan-limits'

export interface OrganizationRecord {
  id: string
  name: string
  plan?: string
  plan_type?: string
  payment_status?: string
  created_at?: string
  updated_at?: string
}

export interface UserRecord {
  id: string
  email: string
  auth_user_id: string
  role: string
  org_id: string
  first_name?: string
  last_name?: string
}

/**
 * getCurrentUser - Standard utility to fetch the authenticatd user 
 * and their organization context with reinforced plan-metering truth.
 */
export const getCurrentUser = (async () => {
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
    created_at?: string;
    updated_at?: string;
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
      // BUG NB5 FIX: Fallback back to 'starter' for existing orgs
      const planType = (organizationData.plan_type || organizationData.plan || 'starter').toLowerCase()
      const planKey = planType as keyof typeof PLAN_LIMITS.article_generation;

      // Calculate usage
      let articleUsage = organizationData.article_usage || 0

      // BUG E FIX: Trial users need strict sync with generate API's 'completed' gate
      if (planType === 'trial') {
        const { count } = await supabase
          .from('articles')
          .select('id', { count: 'exact', head: true }) // BUG NB6 FIX: select 'id'
          .eq('org_id', (userRecord as any).org_id)
          .eq('status', 'completed') // BUG E FIX: count only completed

        articleUsage = count || 0
      }

      const totalCompletedUsage = articleUsage

      // Resolve plan limit from centralized config
      const articleLimit = PLAN_LIMITS.article_generation[planKey];

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
