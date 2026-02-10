import { createServiceRoleClient } from '@/lib/supabase/server'

export interface OnboardingValidationResult {
  valid: boolean
  missing: string[]
}

interface OrganizationData {
  website_url: string | null
  business_description: string | null
  target_audiences: string[] | null
  keyword_settings: Record<string, any> | null
  content_defaults: Record<string, any> | null
  integration: Record<string, any> | null
}

/**
 * Truthfully determine whether onboarding is complete based on data, not flags
 * This is the single source of truth for onboarding validation
 */
export async function validateOnboarding(orgId: string): Promise<OnboardingValidationResult> {
  const supabase = createServiceRoleClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select(`
      website_url,
      business_description,
      target_audiences,
      keyword_settings,
      content_defaults,
      integration
    `)
    .eq('id', orgId)
    .single() as { data: OrganizationData | null, error: any }

  if (error || !org) {
    return {
      valid: false,
      missing: ['organization_not_found']
    }
  }

  // Check competitor count
  const { count: competitorCount } = await supabase
    .from('organization_competitors')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('is_active', true)

  const missing: string[] = []

  // Strict validation of each field
  if (!org.website_url || org.website_url.trim() === '') {
    missing.push('website_url')
  }
  
  if (!org.business_description || org.business_description.trim().length < 20) {
    missing.push('business_description')
  }
  
  if (!Array.isArray(org.target_audiences) || org.target_audiences.length === 0) {
    missing.push('target_audiences')
  } else {
    // Validate each audience item
    const invalidAudiences = org.target_audiences.filter(audience => 
      !audience || typeof audience !== 'string' || audience.trim().length < 2
    )
    if (invalidAudiences.length > 0) {
      missing.push('target_audiences')
    }
  }
  
  if (!org.keyword_settings || typeof org.keyword_settings !== 'object' || Object.keys(org.keyword_settings).length === 0) {
    missing.push('keyword_settings')
  }
  
  if (!org.content_defaults || typeof org.content_defaults !== 'object' || Object.keys(org.content_defaults).length === 0) {
    missing.push('content_defaults')
  }
  
  if (!org.integration || typeof org.integration !== 'object' || Object.keys(org.integration).length === 0) {
    missing.push('integration')
  }
  
  if (!competitorCount || competitorCount < 1) {
    missing.push('competitors')
  }

  return {
    valid: missing.length === 0,
    missing
  }
}

/**
 * Derive and update onboarding completion status based on canonical data
 * This is the single source of truth for onboarding completion
 * 
 * IMPORTANT: Once onboarding_completed is true, it can never be set back to false
 * This ensures forward-only progression and prevents workflow corruption
 */
export async function deriveOnboardingState(orgId: string): Promise<void> {
  const supabase = createServiceRoleClient()
  
  // Check current completion state first
  const { data: currentOrg } = await supabase
    .from('organizations')
    .select('onboarding_completed')
    .eq('id', orgId)
    .single() as { data: { onboarding_completed: boolean } | null, error: any }
  
  // If already completed, never allow reversal (System Law: irreversible)
  if (currentOrg?.onboarding_completed) {
    return
  }
  
  // Validate current state
  const validation = await validateOnboarding(orgId)
  
  // Update completion status based on validation (only if not already completed)
  if (validation.valid) {
    await supabase
      .from('organizations')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orgId)
  }
}
