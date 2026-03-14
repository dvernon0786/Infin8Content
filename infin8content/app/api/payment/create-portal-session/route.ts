import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { validateAppUrl } from '@/lib/supabase/env'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const appUrl = validateAppUrl()
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const { data: userRecord } = await (supabase as any)
            .from('users')
            .select('org_id')
            .eq('auth_user_id', user.id)
            .single()

        if (!userRecord?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 })
        }

        const { data: org } = await (supabase as any)
            .from('organizations')
            .select('stripe_customer_id, payment_status')
            .eq('id', userRecord.org_id)
            .single()

        if (!org?.stripe_customer_id) {
            return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
        }

        // Trial orgs have a stripe_customer_id but no subscription — portal won't be useful
        if (org.payment_status === 'trialing' || org.payment_status === 'pending_payment') {
            return NextResponse.json({ error: 'No active subscription to manage' }, { status: 400 })
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: org.stripe_customer_id,
            return_url: `${appUrl}/dashboard/settings/billing`,
        })

        return NextResponse.json({ url: portalSession.url })
    } catch (error: any) {
        console.error('[Portal] Failed to create portal session:', error)
        return NextResponse.json({ error: 'Failed to create billing portal session' }, { status: 500 })
    }
}
