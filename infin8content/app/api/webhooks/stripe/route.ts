import { createServiceRoleClient } from '@/lib/supabase/server'
import { validateStripeEnv } from '@/lib/stripe/env'
import { stripe } from '@/lib/stripe/server'
import { retryWithBackoff } from '@/lib/stripe/retry'
import { NextResponse } from 'next/server'
import { sendPaymentFailureEmail, sendPaymentReactivationEmail } from '@/lib/services/payment-notifications'
import { logActionAsync } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { getPlanFromPriceId } from '@/lib/stripe/prices'

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
  // PII Protection: Only log sanitized IDs and types, never the full event payload
  console.log(`[Webhook] ${action}:`, JSON.stringify(logData, null, 2))
}

/**
 * Log webhook error with context
 */
function logWebhookError(event: any, action: string, error: any, context?: any) {
  const errorData = {
    eventId: event?.id,
    eventType: event?.type,
    action,
    error: error ? {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      type: error.type,
    } : null,
    context,
    timestamp: new Date().toISOString(),
  }
  console.error(`[Webhook Error] ${action}:`, JSON.stringify(errorData, null, 2))
}

export async function POST(request: Request) {
  try {
    // Validate environment variables
    const { STRIPE_WEBHOOK_SECRET } = validateStripeEnv()
    if (!STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required')
    }

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
      return new Response(`Invalid signature: ${error?.message || 'Unknown error'}`, { status: 400 })
    }

    // Use service role client for webhooks (bypasses RLS)
    // Webhooks don't have user sessions, so we need admin access
    const supabase = createServiceRoleClient()

    // Check idempotency: Query stripe_webhook_events table for stripe_event_id
    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { data: existingEvent, error: idempotencyError } = await (supabase as any)
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

          case 'invoice.finalized':
            // Logic for finalized invoices could be added here later if needed
            // For now, we just store it to mark it as processed
            await storeWebhookEvent(event, supabase, null)
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
      // Retry logic failed - log error
      logWebhookError(event, 'Event processing failed after retries', error, {
        retriesExhausted: true,
        requiresManualIntervention: true,
        action: 'MANUAL_INTERVENTION_REQUIRED',
      })

      // Store event even on failure for monitoring (with error flag)
      try {
        await storeWebhookEvent(event, supabase, null)
      } catch (storeError) {
        logWebhookError(event, 'Failed to store event after processing failure', storeError)
      }

      // ARCHITECTURE FIX: Return 500 for critical events so Stripe retries
      const criticalEvents = ['checkout.session.completed', 'invoice.payment_succeeded', 'invoice.finalized', 'customer.subscription.updated', 'customer.subscription.deleted']
      if (criticalEvents.includes(event.type)) {
        return new Response('Webhook processing error', { status: 500 })
      }

      // Return 200 for non-critical failures to stop retries if they aren't essential
      return new Response('Webhook processed with errors', { status: 200 })
    }
  } catch (error) {
    logWebhookError({ id: 'unknown', type: 'unknown' }, 'Unexpected webhook error', error)
    return new Response('Webhook processing error', { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(event: any, supabase: any) {
  const session = event.data.object
  const orgId = session.metadata?.org_id
  let plan = session.metadata?.plan
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
      ; (error as any).retryable = false
    throw error
  }

  // Check if organization exists before processing
  // TODO: Remove type assertion after regenerating types from Supabase Dashboard
  const { data: organization, error: orgCheckError } = await (supabase as any)
    .from('organizations')
    .select('id, name, payment_status, grace_period_started_at, suspended_at')
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
      ; (error as any).retryable = true
    throw error
  }

  // FIX 3: Store the subscription ID early to ensure later events find the org (subscription_id stored in atomic update below)
  // Resolve the subscription to check status
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription)

    // BUG 1 FIX: If status is trialing, force plan to 'trial' regardless of price ID
    // until the trial period ends and it becomes 'active'.
    if (subscription.status === 'trialing') {
      plan = 'trial'
    } else {
      const planItem = subscription.items.data.find(
        (item: any) => getPlanFromPriceId(item.price?.id)
      )
      const priceId = planItem?.price?.id
      const resolvedPlan = priceId ? getPlanFromPriceId(priceId) : null

      if (resolvedPlan) {
        plan = resolvedPlan
      }
    }
  }

  // Safety guard to prevent silent plan corruption
  if (!plan) {
    throw new Error(`Unable to determine plan for checkout session ${session.id}`)
  }

  // Check if this is a reactivation (payment_status is 'suspended' or 'past_due')
  const isReactivation = organization.payment_status === 'suspended' || organization.payment_status === 'past_due'

  // Update organizations table with retry logic
  const updateData: any = {
    plan: plan || 'trial',
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
    payment_status: 'active',
    payment_confirmed_at: new Date().toISOString(),
    article_usage: 0, // Reset usage on new subscription
  }

  // Set usage_reset_at from subscription current_period_end
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription) as any
    updateData.usage_reset_at = new Date(subscription.current_period_end * 1000).toISOString()
  }

  // If reactivating, clear grace period and suspension fields
  if (isReactivation) {
    updateData.grace_period_started_at = null
    updateData.suspended_at = null
  }

  // TODO: Remove type assertion after regenerating types from Supabase Dashboard
  const { error: updateError } = await (supabase as any)
    .from('organizations')
    .update(updateData)
    .eq('id', orgId)

  if (updateError) {
    logWebhookError(event, 'Failed to update organization after payment', updateError, {
      orgId,
      plan,
    })
      // Database errors are retryable
      ; (updateError as any).retryable = true
    throw updateError
  }

  // Send reactivation email if this was a reactivation (non-blocking)
  if (isReactivation) {
    try {
      // Get user email from users table for this organization
      const { data: ownerUser } = await supabase
        .from('users')
        .select('email')
        .eq('org_id', orgId)
        .eq('role', 'owner')
        .single()

      if (ownerUser?.email) {
        await sendPaymentReactivationEmail({
          to: ownerUser.email,
        })
        logWebhookEvent(event, 'Payment reactivation email sent', {
          organizationId: orgId,
          email: ownerUser.email,
        })
      } else {
        logWebhookError(event, 'Owner user not found for reactivation email', null, {
          organizationId: orgId,
        })
      }
    } catch (emailError) {
      // Email failures are non-blocking - log but don't fail webhook processing
      logWebhookError(event, 'Failed to send reactivation email (non-blocking)', emailError, {
        organizationId: orgId,
      })
    }
  }

  // Store processed event in stripe_webhook_events table
  await storeWebhookEvent(event, supabase, orgId)

  // Log audit event for compliance
  logActionAsync({
    orgId,
    userId: null, // Webhook events have no user context
    action: AuditAction.BILLING_SUBSCRIPTION_CREATED,
    details: {
      plan,
      billingFrequency,
      subscriptionId: session.subscription,
      customerId: session.customer,
      isReactivation,
    },
  })

  logWebhookEvent(event, isReactivation ? 'Payment confirmed - account reactivated' : 'Payment confirmed', {
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
  // TODO: Remove type assertion after regenerating types from Supabase Dashboard
  const { data: organization, error: orgError } = await (supabase as any)
    .from('organizations')
    .select('id, name')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (organization) {
    // BUG 6 FIX: Respect remaining time for canceled subscriptions
    if (subscription.cancel_at_period_end) {
      logWebhookEvent(event, 'Subscription marked for cancellation (cancel_at_period_end) - keeping plan active until period ends', {
        organizationId: organization.id,
        cancelAt: new Date(subscription.cancel_at * 1000).toISOString()
      })
      await storeWebhookEvent(event, supabase, organization.id)
      return
    }

    let resolvedPlan: string | undefined;

    // BUG 1 FIX: If status is trialing, force plan to 'trial'
    if (subscription.status === 'trialing') {
      resolvedPlan = 'trial'
    } else {
      const planItem = subscription.items.data.find(
        (item: any) => getPlanFromPriceId(item.price?.id)
      )
      const priceId = planItem?.price?.id
      const newPlan = priceId ? getPlanFromPriceId(priceId) : (subscription.metadata?.plan as string)

      if (!newPlan) {
        // If it's a non-plan update (e.g. quantity change on a non-mapped price), just skip
        logWebhookEvent(event, 'Subscription update without plan change - skipping')
        return
      }

      resolvedPlan = newPlan
    }

    const updateData: any = {
      plan: resolvedPlan || 'trial',
      payment_status: 'active',
      usage_reset_at: new Date(subscription.current_period_end * 1000).toISOString(),
    }

    const { error: updateError } = await (supabase as any)
      .from('organizations')
      .update(updateData)
      .eq('id', organization.id)

    if (updateError) {
      logWebhookError(event, 'Failed to update plan upon subscription update', updateError, {
        organizationId: organization.id,
        subscriptionId: subscription.id,
      })
        ; (updateError as any).retryable = true
      throw updateError
    }
    // Update subscription status if needed
    // For now, just log and store the event
    logWebhookEvent(event, 'Subscription updated', {
      organizationId: organization.id,
      subscriptionId: subscription.id,
      status: subscription.status,
    })

    // Log audit event for compliance
    logActionAsync({
      orgId: organization.id,
      userId: null, // Webhook events have no user context
      action: AuditAction.BILLING_SUBSCRIPTION_UPDATED,
      details: {
        subscriptionId: subscription.id,
        status: subscription.status,
        plan: resolvedPlan,
      },
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
  // TODO: Remove type assertion after regenerating types from Supabase Dashboard
  const { data: organization, error: orgError } = await (supabase as any)
    .from('organizations')
    .select('id, name, payment_status')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (organization) {
    // Update organization payment status to 'canceled'
    // If subscription was canceled and payment_status was 'active', start grace period
    const updateData: any = {
      payment_status: 'canceled',
      stripe_subscription_id: null, // Clear subscription ID
      plan: 'trial',
      // Note: Trial limits are enforced dynamically via count(status='completed') in generate route.
    }

    // If payment_status was 'active', start grace period
    if (organization.payment_status === 'active') {
      updateData.grace_period_started_at = new Date().toISOString()
    }

    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { error: updateError } = await (supabase as any)
      .from('organizations')
      .update(updateData)
      .eq('id', organization.id)

    if (updateError) {
      logWebhookError(event, 'Failed to update organization after cancellation', updateError, {
        organizationId: organization.id,
        subscriptionId: subscription.id,
      })
        // Database errors are retryable
        ; (updateError as any).retryable = true
      throw updateError
    }

    // Send payment failure email if payment_status was 'active' (non-blocking)
    if (organization.payment_status === 'active') {
      try {
        // Get user email from users table for this organization
        const { data: ownerUser } = await supabase
          .from('users')
          .select('email')
          .eq('org_id', organization.id)
          .eq('role', 'owner')
          .single()

        if (ownerUser?.email) {
          await sendPaymentFailureEmail({
            to: ownerUser.email,
            gracePeriodDays: 7,
          })
          logWebhookEvent(event, 'Payment failure email sent (subscription canceled)', {
            organizationId: organization.id,
            email: ownerUser.email,
          })
        } else {
          logWebhookError(event, 'Owner user not found for payment failure email', null, {
            organizationId: organization.id,
          })
        }
      } catch (emailError) {
        // Email failures are non-blocking - log but don't fail webhook processing
        logWebhookError(event, 'Failed to send payment failure email (non-blocking)', emailError, {
          organizationId: organization.id,
        })
      }
    }

    // Log audit event for compliance
    logActionAsync({
      orgId: organization.id,
      userId: null, // Webhook events have no user context
      action: AuditAction.BILLING_SUBSCRIPTION_CANCELED,
      details: {
        subscriptionId: subscription.id,
        previousStatus: organization.payment_status,
      },
    })

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
  // TODO: Remove type assertion after regenerating types from Supabase Dashboard
  const { data: organization, error: orgError } = await (supabase as any)
    .from('organizations')
    .select('id, name, payment_status, grace_period_started_at')
    .eq('stripe_customer_id', invoice.customer)
    .single()

  if (organization) {
    // Process payment failure: reset grace period if already past_due, or start grace period if active
    const shouldProcessFailure = organization.payment_status === 'active' || organization.payment_status === 'past_due'

    if (shouldProcessFailure) {
      // Update payment status to 'past_due' and reset/start grace period
      // This ensures repeated payment failures reset the grace period clock
      const updateData: any = {
        payment_status: 'past_due',
        grace_period_started_at: new Date().toISOString(),
      }

      // If account was suspended, clear suspension when new payment failure occurs
      // This allows users to retry payment even after suspension
      if (organization.payment_status === 'suspended') {
        updateData.suspended_at = null
      }

      const { error: updateError } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', organization.id)

      if (updateError) {
        logWebhookError(event, 'Failed to update organization after payment failure', updateError, {
          organizationId: organization.id,
          invoiceId: invoice.id,
        })
          // Database errors are retryable
          ; (updateError as any).retryable = true
        throw updateError
      }

      // Send payment failure email (non-blocking - log errors but don't fail webhook)
      // Only send if transitioning from 'active' to avoid spam for repeated failures
      const isNewFailure = organization.payment_status === 'active'
      if (isNewFailure) {
        try {
          // Get user email from users table for this organization
          const { data: ownerUser } = await supabase
            .from('users')
            .select('email')
            .eq('org_id', organization.id)
            .eq('role', 'owner')
            .single()

          if (ownerUser?.email) {
            await sendPaymentFailureEmail({
              to: ownerUser.email,
              gracePeriodDays: 7,
            })
            logWebhookEvent(event, 'Payment failure email sent', {
              organizationId: organization.id,
              email: ownerUser.email,
            })
          } else {
            logWebhookError(event, 'Owner user not found for payment failure email', null, {
              organizationId: organization.id,
            })
          }
        } catch (emailError) {
          // Email failures are non-blocking - log but don't fail webhook processing
          logWebhookError(event, 'Failed to send payment failure email (non-blocking)', emailError, {
            organizationId: organization.id,
          })
        }
      } else {
        // Repeated failure - grace period reset but no email (already notified)
        logWebhookEvent(event, 'Payment failed - grace period reset (repeated failure)', {
          organizationId: organization.id,
          invoiceId: invoice.id,
          previousStatus: organization.payment_status,
        })
      }

      // Log audit event for compliance
      logActionAsync({
        orgId: organization.id,
        userId: null, // Webhook events have no user context
        action: AuditAction.BILLING_PAYMENT_FAILED,
        details: {
          invoiceId: invoice.id,
          amount: invoice.amount_due,
          currency: invoice.currency,
          previousStatus: organization.payment_status,
          gracePeriodReset: organization.payment_status === 'past_due',
        },
      })

      await storeWebhookEvent(event, supabase, organization.id)
      logWebhookEvent(event, 'Payment failed - grace period started/reset', {
        organizationId: organization.id,
        invoiceId: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        previousStatus: organization.payment_status,
      })
    } else {
      // Payment status is 'canceled' or 'suspended' (non-recoverable states) - just log and store
      logWebhookEvent(event, 'Payment failed (non-recoverable status)', {
        organizationId: organization.id,
        invoiceId: invoice.id,
        currentStatus: organization.payment_status,
      })
      await storeWebhookEvent(event, supabase, organization.id)
    }
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
  // TODO: Remove type assertion after regenerating types from Supabase Dashboard
  const { data: organization, error: orgError } = await (supabase as any)
    .from('organizations')
    .select('id, name, payment_status, grace_period_started_at, suspended_at')
    .eq('stripe_customer_id', invoice.customer)
    .single()

  if (organization) {
    // Check if this is a reactivation (payment_status is 'suspended' or 'past_due')
    const isReactivation = organization.payment_status === 'suspended' || organization.payment_status === 'past_due'

    // FIX: Also resolve plan from invoice lines to handle upgrades correctly
    let currentInvoicedPlan: string | undefined

    // Bug 3 Fix: Handle possible truncation in invoice line items
    // If lines are missing or possibly more exist, fetch full list
    const lines = await stripe.invoices.listLineItems(invoice.id, { limit: 100 })

    if (lines.data?.length > 0) {
      // CRITICAL FIX: Find the 'subscription' line item, not just the first line (which might be proration)
      const subscriptionLine = lines.data.find((line: any) => line.type === 'subscription')
      const priceId = (subscriptionLine as any)?.price?.id || (lines.data[0] as any)?.price?.id
      currentInvoicedPlan = priceId ? getPlanFromPriceId(priceId) : undefined
    }

    // Update payment status to active for successful recurring payments
    const updateData: any = {
      payment_status: 'active',
      payment_confirmed_at: new Date().toISOString(),
      article_usage: 0, // Reset usage on new billing cycle
    }

    // Sync usage_reset_at from subscription
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription) as any
      updateData.usage_reset_at = new Date(subscription.current_period_end * 1000).toISOString()

      // BUG 1 FIX: If subscription is currently trialing, force plan to trial
      if (subscription.status === 'trialing') {
        updateData.plan = 'trial'
      } else if (currentInvoicedPlan) {
        updateData.plan = currentInvoicedPlan
      }
    } else if (currentInvoicedPlan) {
      updateData.plan = currentInvoicedPlan
    }

    // If reactivating, clear grace period and suspension fields
    if (isReactivation) {
      updateData.grace_period_started_at = null
      updateData.suspended_at = null
    }

    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { error: updateError } = await (supabase as any)
      .from('organizations')
      .update(updateData)
      .eq('id', organization.id)

    if (updateError) {
      logWebhookError(event, 'Failed to update organization after successful payment', updateError, {
        organizationId: organization.id,
        invoiceId: invoice.id,
      })
        // Database errors are retryable
        ; (updateError as any).retryable = true
      throw updateError
    }

    // Send reactivation email if this was a reactivation (non-blocking)
    if (isReactivation) {
      try {
        // Get user email from users table for this organization
        const { data: ownerUser } = await supabase
          .from('users')
          .select('email')
          .eq('org_id', organization.id)
          .eq('role', 'owner')
          .single()

        if (ownerUser?.email) {
          await sendPaymentReactivationEmail({
            to: ownerUser.email,
          })
          logWebhookEvent(event, 'Payment reactivation email sent', {
            organizationId: organization.id,
            email: ownerUser.email,
          })
        } else {
          logWebhookError(event, 'Owner user not found for reactivation email', null, {
            organizationId: organization.id,
          })
        }
      } catch (emailError) {
        // Email failures are non-blocking - log but don't fail webhook processing
        logWebhookError(event, 'Failed to send reactivation email (non-blocking)', emailError, {
          organizationId: organization.id,
        })
      }
    }

    // Log audit event for compliance
    logActionAsync({
      orgId: organization.id,
      userId: null, // Webhook events have no user context
      action: AuditAction.BILLING_PAYMENT_SUCCEEDED,
      details: {
        invoiceId: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        previousStatus: organization.payment_status,
        isReactivation,
      },
    })

    await storeWebhookEvent(event, supabase, organization.id)
    logWebhookEvent(event, isReactivation ? 'Recurring payment succeeded - account reactivated' : 'Recurring payment succeeded', {
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
    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { error: insertError } = await (supabase as any)
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

