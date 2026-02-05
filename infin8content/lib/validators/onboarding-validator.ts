import { createClient } from '@/lib/supabase/server'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'

export type OnboardingValidationError =
  | 'ONBOARDING_NOT_COMPLETED'
  | 'WEBSITE_URL_MISSING'
  | 'WEBSITE_URL_INVALID'
  | 'BUSINESS_DESCRIPTION_MISSING'
  | 'TARGET_AUDIENCES_EMPTY'
  | 'COMPETITORS_INVALID_COUNT'
  | 'CONTENT_DEFAULTS_MISSING'
  | 'KEYWORD_SETTINGS_MISSING'

export interface OnboardingValidationResult {
  isValid: boolean
  missingSteps: string[]        // ALWAYS an array, never undefined
  errors: OnboardingValidationError[]
}

/**
 * Validates that all required onboarding steps are complete for an organization.
 * Performs comprehensive validation with audit logging and performance tracking.
 * 
 * @param organizationId - The organization ID to validate
 * @returns Promise<OnboardingValidationResult> - Validation result with errors and missing steps
 * @throws Error - Only for unexpected system failures (not validation failures)
 */
export async function validateOnboardingComplete(
  organizationId: string
): Promise<OnboardingValidationResult> {
  const startTime = Date.now()
  const supabase = await createClient()

  const errors: OnboardingValidationError[] = []
  const missingSteps: string[] = []

  // --- Fetch organization onboarding fields
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select(`
      onboarding_completed,
      website_url,
      business_description,
      target_audiences,
      content_defaults,
      keyword_settings
    `)
    .eq('id', organizationId)
    .single()

  if (orgError || !org) {
    return {
      isValid: false,
      errors: ['ONBOARDING_NOT_COMPLETED'],
      missingSteps: ['Complete onboarding process'],
    }
  }

  if (!org.onboarding_completed) {
    errors.push('ONBOARDING_NOT_COMPLETED')
    missingSteps.push('Complete onboarding process')
  }

  if (!org.website_url) {
    errors.push('WEBSITE_URL_MISSING')
    missingSteps.push('Add website URL')
  } else {
    // Validate URL format
    try {
      new URL(org.website_url)
    } catch {
      errors.push('WEBSITE_URL_INVALID')
      missingSteps.push('Fix website URL format')
    }
  }

  if (!org.business_description || org.business_description.length < 10) {
    errors.push('BUSINESS_DESCRIPTION_MISSING')
    missingSteps.push('Add business description (min 10 characters)')
  }

  if (!org.target_audiences || org.target_audiences.length === 0) {
    errors.push('TARGET_AUDIENCES_EMPTY')
    missingSteps.push('Select target audiences')
  }

  if (
    !org.content_defaults ||
    Object.keys(org.content_defaults).length === 0
  ) {
    errors.push('CONTENT_DEFAULTS_MISSING')
    missingSteps.push('Configure content defaults')
  }

  if (
    !org.keyword_settings ||
    Object.keys(org.keyword_settings).length === 0
  ) {
    errors.push('KEYWORD_SETTINGS_MISSING')
    missingSteps.push('Configure keyword settings')
  }

  // --- Competitors validation (3–7)
  const { count: competitorCount, error: competitorError } =
    await supabase
      .from('competitors')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

  if (
    competitorError ||
    competitorCount === null ||
    competitorCount < 3 ||
    competitorCount > 7
  ) {
    errors.push('COMPETITORS_INVALID_COUNT')
    missingSteps.push(`Add competitors (have ${competitorCount || 0}, need 3-7)`)
  }

  const validationResult = {
    isValid: errors.length === 0,
    errors,
    missingSteps, // Always return the array (empty if no errors)
  }

  // Performance check - warn if validation takes too long
  const validationTime = Date.now() - startTime
  if (validationTime > 500) {
    console.warn(`Onboarding validation took ${validationTime}ms for organization ${organizationId}`)
  }

  // Log validation result for audit trail
  try {
    await logActionAsync({
      orgId: organizationId,
      userId: 'system', // This is a system validation, not user-initiated
      action: validationResult.isValid ? 'onboarding.validation.succeeded' : 'onboarding.validation.failed',
      details: {
        validationTime,
        errors: validationResult.errors,
        missingSteps: validationResult.missingSteps,
        competitorCount,
      },
      ipAddress: '0.0.0.0', // System validation
      userAgent: 'Onboarding Validator',
    })
  } catch (logError) {
    // Don't fail validation if logging fails
    console.error('Failed to log onboarding validation:', logError)
  }

  return validationResult
}
