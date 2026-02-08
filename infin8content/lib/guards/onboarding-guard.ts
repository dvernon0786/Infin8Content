import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Checks if an organization has completed onboarding
 * 
 * @param orgId - The organization ID to check
 * @returns Promise<boolean> - true if onboarding is completed, false otherwise
 * 
 * This function performs a server-side check of the organizations.onboarding_completed field.
 * It uses the service role client to bypass RLS and ensure accurate status checking.
 * 
 * Error handling: Any database errors or missing organizations return false (fail-safe approach)
 * to prevent unauthorized access if the guard cannot verify onboarding status.
 */
export async function checkOnboardingStatus(orgId: string): Promise<boolean> {
  console.log('[Onboarding Guard] Checking onboarding status', {
    orgId,
  })
  
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('organizations')
      .select('onboarding_completed, onboarding_completed_at')
      .eq('id', orgId)
      .single()
    
    console.log('[Onboarding Guard] DB RESULT', {
      orgId,
      onboarding_completed: (data as any)?.onboarding_completed,
      onboarding_completed_at: (data as any)?.onboarding_completed_at,
      error: error?.message,
      hasData: !!data
    })
    
    // If there's an error or no data found, default to false (fail-safe)
    if (error || !data) {
      console.error('Onboarding guard check failed:', {
        orgId,
        error: error?.message,
        hasData: !!data
      })
      return false
    }
    
    // Return the onboarding_completed status (boolean, null, or undefined)
    // Treat null/undefined as false (not completed)
    const result = Boolean((data as any).onboarding_completed)
    
    console.log('[Onboarding Guard] FINAL RESULT', {
      orgId,
      result,
      onboarding_completed: (data as any)?.onboarding_completed,
    })
    
    return result
  } catch (exception) {
    // Handle any unexpected errors (database connection, etc.)
    console.error('Onboarding guard exception:', {
      orgId,
      error: exception instanceof Error ? exception.message : String(exception)
    })
    return false
  }
}
