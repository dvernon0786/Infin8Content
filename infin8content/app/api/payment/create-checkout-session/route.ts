import { createClient } from '@/lib/supabase/server'
import { validateStripeEnv } from '@/lib/stripe/env'
import { stripe } from '@/lib/stripe/server'
import { getPriceId } from '@/lib/stripe/prices'
import { validateAppUrl } from '@/lib/supabase/env'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/database.types'

type Organization = Database['public']['Tables']['organizations']['Row']

const checkoutSchema = z.object({
  plan: z.enum(['starter', 'pro', 'agency']),
  billingFrequency: z.enum(['monthly', 'annual']),
})

export async function POST(request: Request) {
  try {
    // Validate environment variables
    validateStripeEnv()
    const appUrl = validateAppUrl()
    
    // Parse and validate request body
    const body = await request.json()
    const { plan, billingFrequency } = checkoutSchema.parse(body)

    const supabase = await createClient()
    
    // Get current user from session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user record
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, org_id, email')
      .eq('auth_user_id', authUser.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json(
        { error: 'User record not found' },
        { status: 404 }
      )
    }

    // Verify user has organization
    if (!userRecord.org_id) {
      return NextResponse.json(
        { error: 'You must create an organization before subscribing. Please create an organization first.' },
        { status: 400 }
      )
    }

    // Get organization from database
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, plan, stripe_customer_id, payment_status')
      .eq('id', userRecord.org_id)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check if organization already has active subscription
    const paymentStatus: Organization['payment_status'] = organization.payment_status || 'pending_payment'
    if (paymentStatus === 'active') {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      )
    }

    // Create or retrieve Stripe customer
    let customerId: string
    
    if (organization.stripe_customer_id) {
      // Use existing customer ID
      customerId = organization.stripe_customer_id
      console.log(`[Checkout] Using existing Stripe customer: ${customerId}`, {
        organizationId: organization.id,
        plan,
        billingFrequency,
      })
    } else {
      // Create new Stripe customer
      try {
        const customer = await stripe.customers.create({
          email: userRecord.email || authUser.email || undefined,
          metadata: {
            org_id: organization.id,
            user_id: userRecord.id,
          },
        })
        
        customerId = customer.id
        console.log(`[Checkout] Created new Stripe customer: ${customerId}`, {
          organizationId: organization.id,
          email: userRecord.email,
        })
        
        // Store stripe_customer_id in organization record
        // Retry up to 3 times if update fails (customer was created, we must store the ID)
        let updateSuccess = false
        for (let attempt = 0; attempt < 3; attempt++) {
          const { error: updateError } = await supabase
            .from('organizations')
            .update({ stripe_customer_id: customerId })
            .eq('id', organization.id)
          
          if (!updateError) {
            updateSuccess = true
            break
          }
          
          if (attempt < 2) {
            // Wait before retry (exponential backoff: 100ms, 200ms)
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)))
            console.warn(`[Checkout] Retry ${attempt + 1}/3 storing Stripe customer ID:`, {
              organizationId: organization.id,
              customerId,
              error: updateError.message,
            })
          }
        }
        
        if (!updateSuccess) {
          // Log critical error - customer created but ID not stored
          // This requires manual intervention to fix data consistency
          console.error('[Checkout] CRITICAL: Failed to store Stripe customer ID after 3 retries:', {
            organizationId: organization.id,
            customerId,
            action: 'MANUAL_INTERVENTION_REQUIRED',
          })
          // Continue anyway - customer was created, webhook will update it later
        }
      } catch (error: any) {
        console.error('[Checkout] Failed to create Stripe customer:', {
          organizationId: organization.id,
          email: userRecord.email,
          error: error.message,
          type: error.type,
        })
        return NextResponse.json(
          { error: 'Failed to create payment customer. Please try again.' },
          { status: 500 }
        )
      }
    }

    // Get price ID for the selected plan and billing frequency
    const priceId = getPriceId(plan, billingFrequency)

    // Validate price ID format (Stripe price IDs start with 'price_' and are 27+ characters)
    // Also check for placeholder values
    if (!priceId.startsWith('price_') || priceId.length < 27 || 
        priceId.startsWith('price_xxx') || priceId.startsWith('price_yyy') || 
        priceId.startsWith('price_zzz') || priceId.startsWith('price_aaa') ||
        priceId.startsWith('price_bbb') || priceId.startsWith('price_ccc')) {
      console.error('[Checkout] Invalid price ID (placeholder or invalid format detected):', {
        plan,
        billingFrequency,
        priceId,
        priceIdLength: priceId.length,
        organizationId: organization.id,
      })
      return NextResponse.json(
        { error: 'Payment configuration error. Please contact support.' },
        { status: 500 }
      )
    }

    // Create Stripe Checkout session
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/payment?canceled=true`,
        metadata: {
          org_id: organization.id,
          user_id: userRecord.id,
          plan: plan,
          billing_frequency: billingFrequency,
        },
      })

      if (!session.url) {
        console.error('[Checkout] Checkout session created but no URL returned:', {
          sessionId: session.id,
          organizationId: organization.id,
        })
        return NextResponse.json(
          { error: 'Failed to create checkout session' },
          { status: 500 }
        )
      }

      console.log(`[Checkout] Checkout session created successfully: ${session.id}`, {
        organizationId: organization.id,
        plan,
        billingFrequency,
        customerId,
        priceId,
      })

      return NextResponse.json({
        url: session.url,
      })
    } catch (error: any) {
      console.error('[Checkout] Failed to create Stripe checkout session:', {
        organizationId: organization.id,
        plan,
        billingFrequency,
        priceId,
        customerId,
        error: error.message,
        type: error.type,
        code: error.code,
      })

      // Handle specific Stripe errors
      if (error.type === 'StripeInvalidRequestError') {
        if (error.message?.includes('price')) {
          return NextResponse.json(
            { error: 'Invalid subscription plan. Please select a different plan.' },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'Invalid payment request. Please try again.' },
          { status: 400 }
        )
      }

      if (error.type === 'StripeRateLimitError') {
        return NextResponse.json(
          { error: 'Payment service is temporarily unavailable. Please try again in a moment.' },
          { status: 503 }
        )
      }

      // Generic error for other Stripe errors
      return NextResponse.json(
        { error: 'Failed to create checkout session. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0]
      console.error('[Checkout] Validation error:', {
        errors: error.issues,
        firstError: firstError?.message,
      })
      return NextResponse.json(
        { error: firstError?.message || 'Validation error' },
        { status: 400 }
      )
    }
    
    console.error('[Checkout] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

