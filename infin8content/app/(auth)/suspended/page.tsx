import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'
import SuspensionMessage from '@/app/components/suspension-message'
import { getPaymentAccessStatus } from '@/lib/utils/payment-status'
import { validateRedirect } from '@/lib/utils/validate-redirect'

export default async function SuspendedPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const currentUser = await getCurrentUser()
  
  // Await searchParams before accessing properties (Next.js 15+ requirement)
  const params = await searchParams
  
  // Redirect if user is not authenticated
  if (!currentUser) {
    redirect('/login')
  }
  
  // Redirect if user has no organization (must create organization first)
  if (!currentUser?.org_id) {
    redirect('/create-organization')
  }
  
  // Check payment status - if not suspended, redirect appropriately
  // Only show suspension page if account is actually suspended
  if (currentUser?.organizations) {
    const accessStatus = getPaymentAccessStatus(currentUser.organizations)
    
    if (accessStatus === 'active') {
      // Payment active - redirect to dashboard (account was reactivated)
      const redirectTo = validateRedirect(params?.redirect, '/dashboard')
      redirect(redirectTo)
    } else if (accessStatus === 'grace_period') {
      // Grace period active - redirect to dashboard (will show banner)
      // User shouldn't be on suspension page during grace period
      redirect('/dashboard')
    } else if (accessStatus === 'pending_payment') {
      // Payment pending - redirect to payment page
      redirect('/payment')
    }
    // If suspended, continue to show suspension page
  }
  
  // Get redirect destination from query params (for post-reactivation redirect)
  const redirectTo = validateRedirect(params?.redirect, '/dashboard')
  
  // Get suspension date and grace period info from organization
  // Note: Using updated_at as fallback since suspended_at and grace_period_started_at are not in current schema
  const suspendedAt = currentUser?.organizations?.updated_at || null
  const gracePeriodStartedAt = null // Not available in current schema
  
  return (
    <SuspensionMessage 
      redirectTo={redirectTo}
      suspendedAt={suspendedAt}
      gracePeriodStartedAt={gracePeriodStartedAt}
    />
  )
}

