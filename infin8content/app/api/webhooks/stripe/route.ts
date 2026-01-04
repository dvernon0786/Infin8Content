import { createClient } from '@/lib/supabase/server'
import { validateStripeEnv } from '@/lib/stripe/env'
import { stripe } from '@/lib/stripe/server'
import { retryWithBackoff } from '@/lib/stripe/retry'
import { NextResponse } from 'next/server'

// Required for webhooks - must use Node.js runtime for raw body access
export const runtime = 'nodejs'

/**
 * Log webhook event for debugging and monitoring
 */
function logWebhookEvent(event: any, action: string, details?: any) {
  const logData = {
    eventId: event.id,
    eventType: event.type,
    action,
    timestamp: new Date().toISOString(),
    ...details,
  }
  console.log(`[Webhook] ${action}:`, JSON.stringify(logData, null, 2))
}

/**
 * Log webhook error with context
 */
function logWebhookError(event: any, action: string, error: any, context?: any) {
  const errorData = {
    eventId: event.id,
    eventType: event.type,
    action,
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      type: error.type,
    },
    context,
    timestamp: new Date().toISOString(),
  }
  console.error(`[Webhook Error] ${action}:`, JSON.stringify(errorData, null, 2))
}

export async function POST(request: Request) {
  try {
    // Validate environment variables
    const { STRIPE_WEBHOOK_SECRET } = validateStripeEnv()
    
    // Get raw body as string (required for signature verification)
    const body = await request.text()
    
    // Get signature from headers
    const signature = request.headers.get('stripe-signature')
    if (!signature) {
      return new Response('No signature', { status: 400 })
    }

    // Verify webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
      logWebhookEvent(event, 'Signature verified')
    } catch (error: any) {
      logWebhookError({ id: 'unknown', type: 'unknown' }, 'Signature verification failed', error)
      return new Response(`Invalid signature: ${error.message}`, { status: 400 })
    }

    const supabase = await createClient()

    // Check idempotency: Query stripe_webhook_events table for stripe_event_id
    const { data: existingEvent, error: idempotencyError } = await supabase
      .from('stripe_webhook_events')
      .select('id, stripe_event_id, processed_at')
      .eq('stripe_event_id', event.id)
      .single()

    // If event already processed, return 200 immediately (prevent duplicate processing)
    if (existingEvent) {
      logWebhookEvent(event, 'Event already processed (idempotency check)', {
        processedAt: existingEvent.processed_at,
      })
      return new Response('Event already processed', { status: 200 })
    }

    // Handle idempotency check errors (non-fatal, continue processing)
    if (idempotencyError && idempotencyError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected for new events
      logWebhookError(event, 'Idempotency check error', idempotencyError)
      // Continue processing - idempotency is best effort
    }

    // Process event with retry logic
    try {
      await retryWithBackoff(async () => {
        // Handle different event types
        switch (event.type) {
          case 'checkout.session.completed':
            await handleCheckoutSessionCompleted(event, supabase)
            break

          case 'customer.subscription.updated':
            await handleSubscriptionUpdated(event, supabase)
            break

          case 'customer.subscription.deleted':
            await handleSubscriptionDeleted(event, supabase)
            break

          case 'invoice.payment_failed':
            await handleInvoicePaymentFailed(event, supabase)
            break

          case 'invoice.payment_succeeded':
            await handleInvoicePaymentSucceeded(event, supabase)
            break

          default:
            logWebhookEvent(event, 'Unhandled event type')
            // Still store the event for monitoring
            await storeWebhookEvent(event, supabase, null)
        }
      })

      logWebhookEvent(event, 'Event processed successfully')
      // Always return 200 to Stripe (Stripe requires 2xx response)
      return new Response('Webhook processed', { status: 200 })
    } catch (error: any) {
      // Retry logic failed - log error but return 200 to prevent Stripe retries
      // Stripe will retry on 5xx errors, but we want to handle retries ourselves
      logWebhookError(event, 'Event processing failed after retries', error, {
        retriesExhausted: true,
        requiresManualIntervention: true,
        action: 'MANUAL_INTERVENTION_REQUIRED',
      })
      
      // Store event even on failure for monitoring (with error flag)
      try {
        await storeWebhookEvent(event, supabase, null)
        // Log additional alert for monitoring systems
        console.error('[Webhook Alert] CRITICAL: Webhook processing failed after all retries', {
          eventId: event.id,
          eventType: event.type,
          error: error.message,
          timestamp: new Date().toISOString(),
          alertLevel: 'CRITICAL',
        })
      } catch (storeError) {
        logWebhookError(event, 'Failed to store event after processing failure', storeError, {
          originalError: error.message,
        })
      }

      // Return 200 to prevent Stripe from retrying (we handle retries internally)
      // Log errors for manual investigation
      return new Response('Webhook processing error', { status: 200 })
    }
  } catch (error) {
    // Top-level error handler for unexpected errors
    logWebhookError({ id: 'unknown', type: 'unknown' }, 'Unexpected webhook error', error)
    return new Response('Webhook processing error', { status: 200 })
  }
}

async function handleCheckoutSessionCompleted(event: any, supabase: any) {
  const session = event.data.object
  const orgId = session.metadata?.org_id
  const plan = session.metadata?.plan
  const billingFrequency = session.metadata?.billing_frequency

  logWebhookEvent(event, 'Processing checkout.session.completed', {
    orgId,
    plan,
    billingFrequency,
    customerId: session.customer,
    subscriptionId: session.subscription,
  })

  // Validate required metadata
  if (!orgId || !plan) {
    const error = new Error('Missing required metadata in checkout session')
    logWebhookError(event, 'Checkout session validation failed', error, { orgId, plan })
    // Mark as non-retryable (permanent error)
    ;(error as any).retryable = false
    throw error
  }

  // Check if organization exists before processing
  const { data: organization, error: orgCheckError } = await supabase
    .from('organizations')
    .select('id, name, payment_status')
    .eq('id', orgId)
    .single()

  if (orgCheckError || !organization) {
    const error = new Error(`Organization not found: ${orgId}`)
    logWebhookError(event, 'Organization not found', error, { 
      orgId, 
      error: orgCheckError,
      warning: 'Organization may not exist yet - webhook received before organization creation',
      action: 'MONITOR_AND_RETRY',
    })
    // Log alert for monitoring - this should be rare but needs attention
    console.warn('[Webhook Alert] Organization not found for payment webhook', {
      eventId: event.id,
      eventType: event.type,
      orgId,
      sessionId: session.id,
      customerId: session.customer,
      timestamp: new Date().toISOString(),
      alertLevel: 'WARNING',
      recommendation: 'Check if organization creation is delayed or if org_id in metadata is incorrect',
    })
    // Mark as retryable - organization may be created later
    ;(error as any).retryable = true
    throw error
  }

  // Update organizations table with retry logic
  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      plan: plan,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      payment_status: 'active',
      payment_confirmed_at: new Date().toISOString(),
    })
    .eq('id', orgId)

  if (updateError) {
    logWebhookError(event, 'Failed to update organization after payment', updateError, {
      orgId,
      plan,
    })
    // Database errors are retryable
    ;(updateError as any).retryable = true
    throw updateError
  }

  // Store processed event in stripe_webhook_events table
  await storeWebhookEvent(event, supabase, orgId)

  logWebhookEvent(event, 'Payment confirmed', {
    orgId,
    plan,
    billingFrequency,
    previousStatus: organization.payment_status,
  })
}

async function handleSubscriptionUpdated(event: any, supabase: any) {
  const subscription = event.data.object

  logWebhookEvent(event, 'Processing customer.subscription.updated', {
    subscriptionId: subscription.id,
    status: subscription.status,
    customerId: subscription.customer,
  })

  // Find organization by stripe_subscription_id
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (organization) {
    // Update subscription status if needed
    // For now, just log and store the event
    logWebhookEvent(event, 'Subscription updated', {
      organizationId: organization.id,
      subscriptionId: subscription.id,
      status: subscription.status,
    })
    await storeWebhookEvent(event, supabase, organization.id)
  } else {
    // Organization not found - log warning but don't fail (subscription may be orphaned)
    logWebhookError(event, 'Organization not found for subscription', orgError, {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
    })
    await storeWebhookEvent(event, supabase, null)
  }
}

async function handleSubscriptionDeleted(event: any, supabase: any) {
  const subscription = event.data.object

  logWebhookEvent(event, 'Processing customer.subscription.deleted', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
  })

  // Find organization by stripe_subscription_id
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, payment_status')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (organization) {
    // Update organization payment status to 'canceled'
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        payment_status: 'canceled',
        stripe_subscription_id: null, // Clear subscription ID
      })
      .eq('id', organization.id)

    if (updateError) {
      logWebhookError(event, 'Failed to update organization after cancellation', updateError, {
        organizationId: organization.id,
        subscriptionId: subscription.id,
      })
      // Database errors are retryable
      ;(updateError as any).retryable = true
      throw updateError
    }

    await storeWebhookEvent(event, supabase, organization.id)
    logWebhookEvent(event, 'Subscription canceled', {
      organizationId: organization.id,
      subscriptionId: subscription.id,
      previousStatus: organization.payment_status,
    })
  } else {
    // Organization not found - log warning but don't fail
    logWebhookError(event, 'Organization not found for subscription deletion', orgError, {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
    })
    await storeWebhookEvent(event, supabase, null)
  }
}

async function handleInvoicePaymentFailed(event: any, supabase: any) {
  const invoice = event.data.object

  logWebhookEvent(event, 'Processing invoice.payment_failed', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    amount: invoice.amount_due,
    currency: invoice.currency,
  })

  // Find organization by customer ID
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, payment_status')
    .eq('stripe_customer_id', invoice.customer)
    .single()

  if (organization) {
    // For Story 1.9 - payment failure handling
    // For now, just log and store the event
    logWebhookEvent(event, 'Payment failed', {
      organizationId: organization.id,
      invoiceId: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      currentStatus: organization.payment_status,
    })
    await storeWebhookEvent(event, supabase, organization.id)
  } else {
    // Organization not found - log warning but don't fail
    logWebhookError(event, 'Organization not found for payment failure', orgError, {
      invoiceId: invoice.id,
      customerId: invoice.customer,
    })
    await storeWebhookEvent(event, supabase, null)
  }
}

async function handleInvoicePaymentSucceeded(event: any, supabase: any) {
  const invoice = event.data.object

  logWebhookEvent(event, 'Processing invoice.payment_succeeded', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    amount: invoice.amount_paid,
    currency: invoice.currency,
  })

  // Find organization by customer ID
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, payment_status')
    .eq('stripe_customer_id', invoice.customer)
    .single()

  if (organization) {
    // Ensure payment status is active for successful recurring payments
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        payment_status: 'active',
        payment_confirmed_at: new Date().toISOString(),
      })
      .eq('id', organization.id)

    if (updateError) {
      logWebhookError(event, 'Failed to update organization after successful payment', updateError, {
        organizationId: organization.id,
        invoiceId: invoice.id,
      })
      // Database errors are retryable
      ;(updateError as any).retryable = true
      throw updateError
    }

    await storeWebhookEvent(event, supabase, organization.id)
    logWebhookEvent(event, 'Recurring payment succeeded', {
      organizationId: organization.id,
      invoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      previousStatus: organization.payment_status,
    })
  } else {
    // Organization not found - log warning but don't fail
    logWebhookError(event, 'Organization not found for payment success', orgError, {
      invoiceId: invoice.id,
      customerId: invoice.customer,
    })
    await storeWebhookEvent(event, supabase, null)
  }
}

async function storeWebhookEvent(event: any, supabase: any, organizationId: string | null) {
  // Store processed event in stripe_webhook_events table for idempotency
  try {
    const { error: insertError } = await supabase
      .from('stripe_webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        organization_id: organizationId,
        processed_at: new Date().toISOString(),
      })

    if (insertError) {
      // Log error but don't throw - idempotency is best effort
      // This is a non-critical operation
      logWebhookError(event, 'Failed to store webhook event (non-critical)', insertError, {
        organizationId,
      })
    } else {
      logWebhookEvent(event, 'Event stored for idempotency', { organizationId })
    }
  } catch (error: any) {
    // Log error but don't throw - idempotency is best effort
    logWebhookError(event, 'Exception storing webhook event (non-critical)', error, {
      organizationId,
    })
  }
}

