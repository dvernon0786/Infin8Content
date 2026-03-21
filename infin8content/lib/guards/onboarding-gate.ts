import { createServiceRoleClient } from '../supabase/server'

/**
 * 🔒 ONBOARDING COMPLETION GATE
 * 
 * This is the single source of truth for workflow activation.
 * No workflow, job, or background process can start unless
 * onboarding is canonically complete.
 * 
 * Usage:
 *   await requireOnboardingComplete(orgId)
 */

export async function requireOnboardingComplete(orgId: string) {
  const supabase = createServiceRoleClient()
  
  const { data: org, error } = await supabase
    .from('organizations')
    .select('onboarding_completed')
    .eq('id', orgId)
    .single() as { data: { onboarding_completed: boolean } | null, error: any }
  
  if (error || !org) {
    throw new Error(`Organization not found: ${orgId}`)
  }
  
  if (!org.onboarding_completed) {
    throw new Error(`Onboarding not complete for organization: ${orgId}`)
  }
  
  return org
}

/**
 * Check if onboarding is complete (non-blocking version)
 */
export async function isOnboardingComplete(orgId: string): Promise<boolean> {
  const supabase = createServiceRoleClient()
  
  const { data: org, error } = await supabase
    .from('organizations')
    .select('onboarding_completed')
    .eq('id', orgId)
    .single() as { data: { onboarding_completed: boolean } | null, error: any }
  
  if (error || !org) {
    return false
  }
  
  return org.onboarding_completed
}
