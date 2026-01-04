import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'
import PaymentForm from './payment-form'
import type { Database } from '@/lib/supabase/database.types'
import { getPaymentAccessStatus } from '@/lib/utils/payment-status'

type Organization = Database['public']['Tables']['organizations']['Row']

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: { suspended?: string; redirect?: string }
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
  
  // Check if organization already has active payment (redirect to dashboard if payment confirmed)
  if (currentUser?.organizations) {
    const accessStatus = getPaymentAccessStatus(currentUser.organizations)
    if (accessStatus === 'active') {
      // Check for redirect parameter for post-reactivation redirect
      const redirectTo = searchParams?.redirect || '/dashboard'
      redirect(redirectTo)
    }
  }
  
  // Pass suspended flag and suspension date to form component
  const isSuspended = searchParams?.suspended === 'true'
  const suspendedAt = currentUser?.organizations?.suspended_at || null
  const redirectTo = searchParams?.redirect || '/dashboard'
  
  return <PaymentForm isSuspended={isSuspended} suspendedAt={suspendedAt} redirectTo={redirectTo} />
}
