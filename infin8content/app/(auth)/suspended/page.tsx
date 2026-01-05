import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'
import SuspensionMessage from '@/app/components/suspension-message'
import { getPaymentAccessStatus } from '@/lib/utils/payment-status'

export default async function SuspendedPage({
  searchParams,
}: {
  searchParams: { redirect?: string }
}) {
  const currentUser = await getCurrentUser()
  
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
      const redirectTo = searchParams?.redirect || '/dashboard'
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
  const redirectTo = searchParams?.redirect || '/dashboard'
  
  // Get suspension date and grace period info from organization
  const suspendedAt = currentUser?.organizations?.suspended_at || null
  const gracePeriodStartedAt = currentUser?.organizations?.grace_period_started_at || null
  
  return (
    <SuspensionMessage 
      redirectTo={redirectTo}
      suspendedAt={suspendedAt}
      gracePeriodStartedAt={gracePeriodStartedAt}
    />
  )
}

