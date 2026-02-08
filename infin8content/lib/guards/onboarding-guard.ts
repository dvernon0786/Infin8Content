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
  console.log('[Onboarding Guard] Checking status for org:', orgId)
  
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('organizations')
      .select('onboarding_completed')
      .eq('id', orgId)
      .single()
    
    console.log('[Onboarding Guard] DB query result:', {
      orgId,
      onboarding_completed: (data as any)?.onboarding_completed,
      error: error?.message,
      hasData: !!data
    })
    
    // If there's an error or no data found, default to false (fail-safe)
    if (error || !data) {
      console.warn('[Onboarding Guard] Redirecting to Step 1 - DB ERROR', {
        orgId,
        error: error?.message,
        hasData: !!data
      })
      return false
    }
    
    const isCompleted = Boolean((data as any).onboarding_completed)
    
    if (!isCompleted) {
      console.warn('[Onboarding Guard] Redirecting to Step 1 - ONBOARDING INCOMPLETE', {
        orgId,
        onboarding_completed: (data as any).onboarding_completed
      })
    } else {
      console.log('[Onboarding Guard] Onboarding completed - allowing access', {
        orgId
      })
    }
    
    return isCompleted
  } catch (exception) {
    console.error('[Onboarding Guard] Redirecting to Step 1 - EXCEPTION', {
      orgId,
      error: exception instanceof Error ? exception.message : String(exception)
    })
    return false
  }
}
