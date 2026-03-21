import { createServiceRoleClient } from '@/lib/supabase/server'
import { validateOnboarding, type OnboardingValidationResult } from '@/lib/onboarding/onboarding-validator'

/**
 * AUTHORITATIVE onboarding guard
 * 
 * This is the single source of truth for onboarding validation
 * Uses data-derived validation, not flag-based checks
 * 
 * @param orgId - The organization ID to check
 * @returns Promise<OnboardingValidationResult> - validation result with missing fields
 */
export async function checkOnboardingStatus(orgId: string): Promise<OnboardingValidationResult> {
  try {
    // Use the validator as the single source of truth
    const validation = await validateOnboarding(orgId)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Onboarding Guard] Validation for org ${orgId}:`, validation)
    }
    
    return validation
  } catch (error) {
    console.error('[Onboarding Guard] Error checking onboarding status:', error)
    
    // Fail-safe: if validator fails, assume onboarding is incomplete
    return {
      valid: false,
      missing: ['validation_error']
    }
  }
}

/**
 * Legacy boolean interface for backward compatibility
 * @deprecated Use checkOnboardingStatus() for detailed validation
 */
export async function isOnboardingComplete(orgId: string): Promise<boolean> {
  const validation = await checkOnboardingStatus(orgId)
  return validation.valid
}
