import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getPaymentAccessStatus } from '@/lib/utils/payment-status'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = createServiceRoleClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user record
    const { data: userRecord, error: userError } = await (supabase as any)
      .from('users')
      .select('id, org_id, otp_verified')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 })
    }

    // Get organization if exists
    let org = null
    if (userRecord.org_id) {
      const { data: organization } = await (adminSupabase as any)
        .from('organizations')
        .select('*')
        .eq('id', userRecord.org_id)
        .single()
      org = organization
    }

    // Get payment access status
    let accessStatus = 'no_org'
    if (org) {
      accessStatus = getPaymentAccessStatus(org)
    }

    const payload = {
      user: {
        id: user.id,
        email: user.email,
        authUser: true
      },
      userRecord: {
        id: userRecord.id,
        org_id: userRecord.org_id,
        otp_verified: userRecord.otp_verified
      },
      organization: org ? {
        id: org.id,
        name: org.name,
        payment_status: org.payment_status,
        plan: org.plan,
        plan_type: org.plan_type,
        trial_ends_at: org.trial_ends_at,
        has_used_trial: org.has_used_trial,
        stripe_customer_id: org.stripe_customer_id,
        grace_period_started_at: org.grace_period_started_at,
        suspended_at: org.suspended_at,
        created_at: org.created_at
      } : null,
      paymentAccessStatus: accessStatus,
      timestamp: new Date().toISOString()
    }

    // ✅ Fix 2: When accessed directly from a browser (Accept: text/html), redirect back
    // to the referrer so the user isn't left on a JSON page.
    const accept = request.headers.get('accept') || ''
    if (accept.includes('text/html')) {
      const referer = request.headers.get('referer') || '/dashboard/articles'
      const redirectUrl = new URL(referer, request.url)
      // Pass status as a query param so the calling page can show a toast if needed
      redirectUrl.searchParams.set('payment_status', accessStatus)
      return NextResponse.redirect(redirectUrl, { status: 302 })
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Debug payment status error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
