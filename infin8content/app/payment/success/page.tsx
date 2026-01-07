import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PaymentSuccessClient from './payment-success-client'

interface PaymentSuccessPageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  // Await searchParams before accessing properties (Next.js 15+ requirement)
  const params = await searchParams
  const sessionId = params.session_id

  // Check authentication
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect('/login')
  }

  // Validate session_id
  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Session
          </h1>
          <p className="text-gray-600 mb-6">
            No payment session found. Please try again from the payment page.
          </p>
          <Link
            href="/payment"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Payment Page
          </Link>
        </div>
      </div>
    )
  }

  // Verify Stripe session
  let session: any = null
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch (error) {
    console.error('Failed to retrieve Stripe session:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Session Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            Unable to verify payment session. Please contact support if you
            completed a payment.
          </p>
          <Link
            href="/payment"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Payment Page
          </Link>
        </div>
      </div>
    )
  }

  // Verify payment was completed
  if (!session || session.payment_status !== 'paid' || session.status !== 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Not Confirmed
          </h1>
          <p className="text-gray-600 mb-6">
            Your payment session is not yet complete. Please wait a moment and
            refresh, or contact support if the issue persists.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/payment"
              className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Payment
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Validate session metadata matches current user's organization
  const sessionOrgId = session.metadata?.org_id
  if (!sessionOrgId) {
    console.error('Missing org_id in session metadata:', { sessionId, userId: currentUser.id })
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Session</h1>
          <p className="text-gray-600 mb-6">
            Payment session is missing required information. Please contact support.
          </p>
          <Link
            href="/payment"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Payment Page
          </Link>
        </div>
      </div>
    )
  }

  // Verify session org_id matches current user's org_id (security check)
  if (sessionOrgId !== currentUser.org_id) {
    console.error('Session org_id mismatch:', {
      sessionId,
      sessionOrgId,
      userOrgId: currentUser.org_id,
      userId: currentUser.id,
    })
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            This payment session does not belong to your account. Please contact support if you believe this is an error.
          </p>
          <Link
            href="/payment"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Payment Page
          </Link>
        </div>
      </div>
    )
  }

  // Get current payment status from database
  const supabase = await createClient()
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id, payment_status, plan')
    .eq('id', sessionOrgId)
    .single()

  if (orgError || !organization) {
    console.error('Failed to fetch organization:', orgError)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Processing Payment
          </h1>
          <p className="text-gray-600 mb-6">
            Payment received. Your account is being activated. Please refresh in
            a moment.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  const paymentStatus = organization.payment_status

  // If payment is active, show success and redirect
  if (paymentStatus === 'active') {
    // Get redirect destination from session metadata (for post-reactivation redirect)
    const redirectTo = session.metadata?.redirect || '/dashboard'
    // Check if this was a reactivation (account was suspended before payment)
    const isReactivation = session.metadata?.suspended === 'true'
    return (
      <PaymentSuccessClient
        status="active"
        plan={organization.plan || session.metadata?.plan}
        redirectTo={redirectTo}
        isReactivation={isReactivation}
      />
    )
  }

  // If payment is pending, show processing message
  // This handles race condition where webhook hasn't processed yet
  if (paymentStatus === 'pending_payment') {
    return <PaymentSuccessClient status="pending" />
  }

  // Fallback for other statuses
  return <PaymentSuccessClient status="processing" />
}

