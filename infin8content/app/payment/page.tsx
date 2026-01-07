import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'
import PaymentForm from './payment-form'
import type { Database } from '@/lib/supabase/database.types'
import { getPaymentAccessStatus } from '@/lib/utils/payment-status'

type Organization = Database['public']['Tables']['organizations']['Row']

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ suspended?: string; redirect?: string }>
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
  
  // Check if organization already has active payment (redirect to dashboard if payment confirmed)
  if (currentUser?.organizations) {
    const accessStatus = getPaymentAccessStatus(currentUser.organizations)
    if (accessStatus === 'active') {
      // Check for redirect parameter for post-reactivation redirect
      const redirectTo = params?.redirect || '/dashboard'
      redirect(redirectTo)
    }
  }
  
  // Pass suspended flag and suspension date to form component
  const isSuspended = params?.suspended === 'true'
  const suspendedAt = currentUser?.organizations?.suspended_at || null
  const redirectTo = params?.redirect || '/dashboard'
  
  return <PaymentForm isSuspended={isSuspended} suspendedAt={suspendedAt} redirectTo={redirectTo} />
}
