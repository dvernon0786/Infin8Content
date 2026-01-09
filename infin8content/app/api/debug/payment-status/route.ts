import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getPaymentAccessStatus } from '@/lib/utils/payment-status'
import { NextResponse } from 'next/server'

export async function GET() {
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

    return NextResponse.json({
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
        grace_period_started_at: org.grace_period_started_at,
        suspended_at: org.suspended_at,
        created_at: org.created_at
      } : null,
      paymentAccessStatus: accessStatus,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug payment status error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
