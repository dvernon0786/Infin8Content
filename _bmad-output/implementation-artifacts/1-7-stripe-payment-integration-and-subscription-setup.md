# Story 1.7: Stripe Payment Integration and Subscription Setup

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a new user,
I want to select a subscription plan and complete payment,
So that I can access the platform features according to my plan tier.

## Acceptance Criteria

**Given** I have created an account and organization (Stories 1.3-1.6)
**When** I am redirected to the payment page after registration
**Then** I see three plan options:
- Starter: $59/month (annual) or $89/month (monthly)
- Pro: $175/month (annual) or $220/month (monthly)
- Agency: $299/month (annual) or $399/month (monthly)
**And** I can see feature comparisons for each plan
**And** I can select annual or monthly billing
**And** I can click "Subscribe" to proceed to Stripe checkout

**Given** I have selected a plan and billing frequency
**When** I click "Subscribe"
**Then** I am redirected to Stripe Checkout
**And** I can enter my payment information securely
**And** after successful payment, Stripe webhook creates a subscription record
**And** my organization's `plan` field is updated in the database
**And** a Stripe customer ID and subscription ID are stored
**And** I am redirected back to the platform with payment confirmed
**And** my account status is set to "active"

**Given** payment fails (declined card, insufficient funds)
**When** Stripe returns a payment error
**Then** I see a clear error message with actionable next steps
**And** I can retry payment or select a different payment method
**And** my account remains in "pending_payment" status

## Tasks / Subtasks

- [ ] Task 1: Install and configure Stripe dependencies (AC: 2)
  - [ ] Install `stripe` package: `npm install stripe`
  - [ ] Install `@stripe/stripe-js` for client-side: `npm install @stripe/stripe-js`
  - [ ] Add Stripe environment variables to `.env.local`:
    - `STRIPE_SECRET_KEY` (server-side only)
    - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client-side)
    - `STRIPE_WEBHOOK_SECRET` (for webhook verification)
  - [ ] Create `lib/stripe/env.ts` for environment validation following exact pattern from `lib/supabase/env.ts`:
    ```typescript
    export function validateStripeEnv() {
      const requiredEnvVars = {
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      }
      const missing: string[] = []
      for (const [key, value] of Object.entries(requiredEnvVars)) {
        if (!value) missing.push(key)
      }
      if (missing.length > 0) {
        throw new Error(`Missing required Stripe environment variables: ${missing.join(', ')}`)
      }
      return requiredEnvVars
    }
    ```
  - [ ] Create `lib/stripe/server.ts` for server-side Stripe client initialization with API version pinning:
    ```typescript
    import Stripe from 'stripe'
    import { validateStripeEnv } from './env'
    
    const { STRIPE_SECRET_KEY } = validateStripeEnv()
    export const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia', // Pin API version for stability
    })
    ```
  - [ ] Create `lib/stripe/client.ts` for client-side Stripe.js initialization:
    ```typescript
    import { loadStripe } from '@stripe/stripe-js'
    
    export const getStripe = () => {
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      if (!publishableKey) throw new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
      return loadStripe(publishableKey)
    }
    ```

- [ ] Task 2: Create payment page UI (AC: 1)
  - [ ] Create `app/payment/page.tsx` as Server Component wrapper
  - [ ] Use `getCurrentUser()` helper to verify user has organization (redirect to `/create-organization` if no org)
  - [ ] Check if organization already has active payment (redirect to `/dashboard` if payment confirmed)
  - [ ] Create `app/payment/payment-form.tsx` as Client Component for plan selection
  - [ ] Display three plan cards (Starter, Pro, Agency) with pricing:
    - Starter: $59/month (annual) or $89/month (monthly)
    - Pro: $175/month (annual) or $220/month (monthly)
    - Agency: $299/month (annual) or $399/month (monthly)
  - [ ] Add feature comparison table showing plan differences:
    - **Source:** PRD "Pricing Tiers" section (lines 1047-1110 in `_bmad-output/prd.md`)
    - **Features to display:** articles/month, keyword researches/month, CMS connections, projects, stores (e-commerce), products tracked, team members, image storage, API calls/month, revenue attribution, white-label & custom domain, client portal, support SLA, uptime SLA
    - **Format:** Three-column comparison table (Starter | Pro | Agency) with checkmarks/limits for each feature
  - [ ] Add billing frequency toggle (Monthly/Annual) with price updates
  - [ ] Add "Subscribe" button for each plan card
  - [ ] Style according to UX design specification (Form Patterns, Button Hierarchy sections)
  - [ ] Ensure accessibility (WCAG 2.1 Level AA, keyboard navigation, screen reader support)
  - [ ] Match styling patterns from registration/login pages (consistent Tailwind classes)

- [ ] Task 3: Create Stripe Checkout session API route (AC: 2)
  - [ ] Create `app/api/payment/create-checkout-session/route.ts` API route
  - [ ] Use Supabase server client from `lib/supabase/server.ts`
  - [ ] Use Stripe server client from `lib/stripe/server.ts`
  - [ ] Validate environment variables using `validateStripeEnv()` from `lib/stripe/env.ts`
  - [ ] Validate request body using Zod schema:
    ```typescript
    const checkoutSchema = z.object({
      plan: z.enum(['starter', 'pro', 'agency']),
      billingFrequency: z.enum(['monthly', 'annual']),
    })
    ```
  - [ ] Verify user has organization (query `users` table for `org_id`)
  - [ ] Get organization from database to check if already has active subscription
  - [ ] Create or retrieve Stripe customer:
    - Check if organization already has `stripe_customer_id` in database
    - If exists, use existing customer ID
    - If not exists, create new Stripe customer:
      ```typescript
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { org_id: organization.id, user_id: user.id },
      })
      ```
    - Store `stripe_customer_id` in organization record (update database)
  - [ ] Create Stripe Checkout session with:
    - Price ID from `lib/stripe/prices.ts` based on plan and billing frequency
    - Customer ID (from step above)
    - Success URL: `${NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`
    - Cancel URL: `${NEXT_PUBLIC_APP_URL}/payment?canceled=true`
    - Metadata: `{ org_id: organization.id, user_id: user.id, plan: plan, billing_frequency: billingFrequency }`
  - [ ] Return checkout session URL for redirect
  - [ ] Handle errors (validation errors, Stripe API errors, database errors)

- [ ] Task 4: Create Stripe webhook handler (AC: 2)
  - [ ] Create `app/api/webhooks/stripe/route.ts` API route
  - [ ] Configure route for raw body access (required for webhook signature verification):
    ```typescript
    export const runtime = 'nodejs' // Required for webhooks
    export async function POST(request: Request) {
      const body = await request.text() // Get raw body as string
      const signature = request.headers.get('stripe-signature')
      if (!signature) return new Response('No signature', { status: 400 })
      // ... rest of handler
    }
    ```
  - [ ] Verify webhook signature using `STRIPE_WEBHOOK_SECRET`:
    ```typescript
    const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
    ```
  - [ ] Check idempotency: Query `stripe_webhook_events` table for `stripe_event_id` (from Task 7 migration)
    - If event already processed, return 200 immediately (prevent duplicate processing)
    - If not processed, continue with event handling
  - [ ] Handle `checkout.session.completed` event:
    - Check idempotency: Query `stripe_webhook_events` for `event.id` (Stripe event ID)
    - If already processed, return 200 immediately
    - Extract `org_id`, `plan`, `billing_frequency` from session metadata
    - Extract Stripe customer ID and subscription ID from session
    - Update `organizations` table:
      - Set `plan` field to selected plan
      - Store `stripe_customer_id` (from session.customer)
      - Store `stripe_subscription_id` (from session.subscription)
      - Set `payment_status` to 'active'
      - Set `payment_confirmed_at` to current timestamp
    - Store processed event in `stripe_webhook_events` table:
      - `stripe_event_id`: `event.id`
      - `event_type`: `event.type`
      - `organization_id`: from metadata
      - `processed_at`: current timestamp
    - Log webhook event for debugging
  - [ ] Handle `customer.subscription.updated` event (for plan changes, cancellations)
  - [ ] Handle `customer.subscription.deleted` event (for cancellations)
  - [ ] Handle `invoice.payment_failed` event (for payment failures - Story 1.9)
  - [ ] Handle `invoice.payment_succeeded` event (for successful payments)
  - [ ] Return 200 status for all handled events (Stripe requires 2xx response)
  - [ ] Log unhandled event types for monitoring

- [ ] Task 5: Create payment success page (AC: 2)
  - [ ] Create `app/payment/success/page.tsx` as Server Component
  - [ ] Extract `session_id` from query parameters
  - [ ] Verify Stripe Checkout session was completed (query Stripe API via `stripe.checkout.sessions.retrieve(session_id)`)
  - [ ] Handle race condition (webhook may not have processed yet):
    - Query organization `payment_status` from database
    - If `payment_status = 'active'`: Show success message and redirect
    - If `payment_status = 'pending_payment'`: 
      - Option A: Poll database for status update (max 30 seconds, check every 2 seconds)
      - Option B: Show "Processing payment... Please wait" message with auto-refresh every 3 seconds
      - Option C: Verify session status via Stripe API - if session.payment_status = 'paid', show "Payment received, activating account..." with manual refresh button
    - Fallback: If webhook delayed > 30 seconds, show "Payment received. Your account is being activated. Please refresh in a moment." with refresh button
  - [ ] Display success message: "Payment confirmed! Your account is now active."
  - [ ] Add "Go to Dashboard" button linking to `/dashboard`
  - [ ] Auto-redirect to dashboard after 3 seconds (only if payment_status = 'active')
  - [ ] Style according to UX design specification (Success States section)
  - [ ] Handle errors (invalid session_id, payment not confirmed, session not found)

- [ ] Task 6: Create payment failure handling (AC: 3)
  - [ ] Update payment page to show error message when `canceled=true` query param present
  - [ ] Display clear error message: "Payment was canceled. Please try again or select a different plan."
  - [ ] Add "Retry Payment" button to restart checkout flow
  - [ ] Ensure organization remains in "pending_payment" status (default state)
  - [ ] Handle Stripe Checkout errors (card declined, insufficient funds) via error URL parameter
  - [ ] Display actionable error messages based on error type

- [ ] Task 7: Update database schema for payment tracking (AC: 2)
  - [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_stripe_payment_fields.sql`
  - [ ] Add columns to `organizations` table using idempotent pattern:
    ```sql
    -- Idempotent column additions
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'organizations' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE organizations ADD COLUMN stripe_customer_id TEXT;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'organizations' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE organizations ADD COLUMN stripe_subscription_id TEXT;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'organizations' AND column_name = 'payment_status') THEN
        ALTER TABLE organizations ADD COLUMN payment_status TEXT DEFAULT 'pending_payment' 
          CHECK (payment_status IN ('pending_payment', 'active', 'suspended', 'canceled'));
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'organizations' AND column_name = 'payment_confirmed_at') THEN
        ALTER TABLE organizations ADD COLUMN payment_confirmed_at TIMESTAMP;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'organizations' AND column_name = 'plan') THEN
        ALTER TABLE organizations ADD COLUMN plan TEXT DEFAULT 'starter' 
          CHECK (plan IN ('starter', 'pro', 'agency'));
      END IF;
    END $$;
    ```
  - [ ] Add unique constraints (idempotent):
    ```sql
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_stripe_customer_id_key') THEN
        ALTER TABLE organizations ADD CONSTRAINT organizations_stripe_customer_id_key UNIQUE (stripe_customer_id);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_stripe_subscription_id_key') THEN
        ALTER TABLE organizations ADD CONSTRAINT organizations_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
      END IF;
    END $$;
    ```
  - [ ] Add indexes (idempotent):
    ```sql
    CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id ON organizations(stripe_customer_id);
    CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription_id ON organizations(stripe_subscription_id);
    CREATE INDEX IF NOT EXISTS idx_organizations_payment_status ON organizations(payment_status);
    ```
  - [ ] Create `stripe_webhook_events` table for idempotency tracking:
    ```sql
    CREATE TABLE IF NOT EXISTS stripe_webhook_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stripe_event_id TEXT NOT NULL UNIQUE,
      event_type TEXT NOT NULL,
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      processed_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_event_id ON stripe_webhook_events(stripe_event_id);
    CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_organization_id ON stripe_webhook_events(organization_id);
    ```
  - [ ] Apply migration to database
  - [ ] Regenerate TypeScript types: `npx supabase gen types typescript --project-id <project-id> > lib/supabase/database.types.ts`

- [ ] Task 8: Update login redirect logic to check payment status (AC: 2)
  - [ ] Update `app/api/auth/login/route.ts` to check payment status after organization check
  - [ ] Query `organizations` table for `payment_status` field
  - [ ] If `payment_status = 'active'` → redirect to `/dashboard`
  - [ ] If `payment_status = 'pending_payment'` → redirect to `/payment`
  - [ ] If `payment_status = 'suspended'` → redirect to `/payment?suspended=true` (Story 1.9)
  - [ ] Update redirect logic in login API response

- [ ] Task 9: Configure Stripe products and prices (AC: 1, 2)
  - [ ] Create Stripe products in Stripe Dashboard:
    - Product: "Starter Plan"
    - Product: "Pro Plan"
    - Product: "Agency Plan"
  - [ ] Create Stripe prices for each product:
    - Starter Monthly: $89/month
    - Starter Annual: $708/year ($59/month × 12)
    - Pro Monthly: $220/month
    - Pro Annual: $2,100/year ($175/month × 12)
    - Agency Monthly: $399/month
    - Agency Annual: $3,588/year ($299/month × 12)
  - [ ] Create `lib/stripe/prices.ts` with type-safe price ID mapping:
    ```typescript
    // Stripe Price IDs - Update when prices change in Stripe Dashboard
    // Format: { plan: { billingFrequency: 'price_xxx' } }
    export const STRIPE_PRICE_IDS = {
      starter: {
        monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_xxx',
        annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || 'price_yyy',
      },
      pro: {
        monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_zzz',
        annual: process.env.STRIPE_PRICE_PRO_ANNUAL || 'price_aaa',
      },
      agency: {
        monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY || 'price_bbb',
        annual: process.env.STRIPE_PRICE_AGENCY_ANNUAL || 'price_ccc',
      },
    } as const
    
    export type PlanType = keyof typeof STRIPE_PRICE_IDS
    export type BillingFrequency = 'monthly' | 'annual'
    
    export function getPriceId(plan: PlanType, billingFrequency: BillingFrequency): string {
      return STRIPE_PRICE_IDS[plan][billingFrequency]
    }
    ```
  - [ ] Add price ID environment variables to `.env.local` (optional, for flexibility):
    - `STRIPE_PRICE_STARTER_MONTHLY`, `STRIPE_PRICE_STARTER_ANNUAL`
    - `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL`
    - `STRIPE_PRICE_AGENCY_MONTHLY`, `STRIPE_PRICE_AGENCY_ANNUAL`
  - [ ] Document: Update `lib/stripe/prices.ts` when prices change in Stripe Dashboard

- [ ] Task 10: Add payment status check to middleware (AC: 2)
  - [ ] Update `app/middleware.ts` to check payment status for protected routes
  - [ ] After authentication check, query organization payment status
  - [ ] If `payment_status != 'active'` and route requires payment:
    - Redirect to `/payment` with appropriate message
    - Allow access to `/payment` and `/payment/success` routes
  - [ ] Skip payment check for public routes (login, register, verify-email)
  - [ ] Skip payment check for payment-related routes (`/payment`, `/payment/success`)

- [ ] Task 11: Update organization creation to set default payment status (AC: 2)
  - [ ] Update `app/api/organizations/create/route.ts` to set `payment_status = 'pending_payment'` on organization creation
  - [ ] Ensure `plan = 'starter'` is set (already implemented in Story 1.6)
  - [ ] Verify default values are applied correctly in database

- [ ] Task 12: Add error handling and logging (AC: 2, 3)
  - [ ] Add comprehensive error handling in all Stripe API calls
  - [ ] Log Stripe webhook events for debugging (console.log or Sentry)
  - [ ] Log payment failures with error details (without exposing sensitive data)
  - [ ] Add error recovery for webhook processing failures with retry strategy:
    - **Exponential backoff:** Retry with delays: 1s, 2s, 4s, 8s, 16s (max 5 retries)
    - **Max retries:** 5 attempts before giving up
    - **Retry conditions:** Network failures, temporary database errors, Stripe API rate limits
    - **No retry:** Permanent errors (invalid event, organization not found, validation errors)
    - **Logging:** Log all retry attempts with error details for monitoring
  - [ ] Handle edge cases:
    - Webhook received before organization exists: 
      - Check if organization exists before processing
      - If not found, log error and return 200 (Stripe will retry, organization may be created later)
      - Consider queueing for retry if organization creation is in progress
    - Duplicate webhook events (idempotency): 
      - Check `stripe_webhook_events` table for `stripe_event_id` before processing
      - If already processed, return 200 immediately (prevent duplicate processing)
      - Store event ID in `stripe_webhook_events` table after successful processing
    - Network failures during webhook processing:
      - Use try-catch with retry logic (exponential backoff)
      - Log failures for manual investigation if all retries fail
      - Return 500 only if permanent failure (Stripe will retry on 5xx errors)

## Dev Notes

### Architecture Patterns

**Stripe Integration Pattern:**
- Use Stripe Checkout (hosted payment page) for PCI DSS compliance (NFR-S5)
- Server-side Stripe client for API calls (never expose secret key to client)
- Client-side Stripe.js only for loading publishable key (no sensitive operations)
- Webhook handler for async payment confirmation (Stripe → our system)
- Metadata in Checkout session to link Stripe events to our database records

**Payment Flow Architecture:**
1. User selects plan → Client calls `/api/payment/create-checkout-session`
2. API creates Stripe Checkout session → Returns session URL
3. Client redirects to Stripe Checkout → User enters payment info
4. Stripe processes payment → Redirects to success/cancel URL
5. Stripe sends webhook → Our handler updates database
6. User sees success page → Redirects to dashboard

**Database Schema Updates:**
- Add payment tracking fields to `organizations` table (not separate `subscriptions` table for MVP)
- Store Stripe customer ID and subscription ID for future subscription management
- Payment status enum: `pending_payment`, `active`, `suspended`, `canceled`
- Timestamp for payment confirmation for audit trail

**Error Handling:**
- Stripe API errors: Return user-friendly messages (don't expose internal errors)
- Webhook processing: Log errors, implement retry logic, handle idempotency
- Payment failures: Show actionable error messages, allow retry
- Network failures: Retry webhook processing, queue failed events

### Technical Requirements

**Stripe SDK:**
- Server-side: `stripe` package (Node.js) - check npm for latest: `npm view stripe version`
- Client-side: `@stripe/stripe-js` package (browser) - check npm for latest: `npm view @stripe/stripe-js version`
- Stripe API version: Pin to `'2024-11-20.acacia'` in Stripe client initialization (see `lib/stripe/server.ts` pattern)
- **Important:** Pinning API version ensures stability and prevents breaking changes

**Environment Variables:**
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Server-side only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Client-side
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signature verification
```

**API Routes:**
- `POST /api/payment/create-checkout-session` - Create Stripe Checkout session
- `POST /api/webhooks/stripe` - Handle Stripe webhooks (no authentication required, signature verification only)

**Database Migrations:**
- Migration file naming: `YYYYMMDDHHMMSS_add_stripe_payment_fields.sql`
- Idempotent migration (use `IF NOT EXISTS` for columns)
- Add indexes for performance (payment_status queries)

**Security Requirements:**
- Never expose Stripe secret key to client
- Verify webhook signatures (prevent unauthorized webhook calls)
- Validate all user inputs (Zod schemas)
- Store only Stripe customer/subscription IDs (not payment details)
- PCI DSS compliance handled by Stripe (we never touch credit card data)

### File Structure Requirements

**New Files to Create:**
- `app/payment/page.tsx` - Payment page (Server Component)
- `app/payment/payment-form.tsx` - Plan selection form (Client Component)
- `app/payment/success/page.tsx` - Payment success page (Server Component)
- `app/api/payment/create-checkout-session/route.ts` - Checkout session API
- `app/api/webhooks/stripe/route.ts` - Stripe webhook handler (with `export const runtime = 'nodejs'`)
- `lib/stripe/env.ts` - Stripe environment validation (follow `lib/supabase/env.ts` pattern)
- `lib/stripe/server.ts` - Server-side Stripe client (with API version pinning)
- `lib/stripe/client.ts` - Client-side Stripe.js initialization
- `lib/stripe/prices.ts` - Type-safe Stripe price ID mapping
- `supabase/migrations/YYYYMMDDHHMMSS_add_stripe_payment_fields.sql` - Database migration (idempotent)

**Files to Modify:**
- `app/api/auth/login/route.ts` - Add payment status check to redirect logic
- `app/middleware.ts` - Add payment status check for protected routes
- `app/api/organizations/create/route.ts` - Set default payment_status
- `lib/supabase/database.types.ts` - Regenerate after migration
- `.env.example` - Add Stripe environment variables

### Testing Requirements

**Unit Tests:**
- Test Stripe Checkout session creation with valid/invalid inputs
- Test webhook signature verification
- Test webhook event handling (checkout.session.completed, subscription.updated, etc.)
- Test payment status checks in login redirect logic
- Test database migration (idempotency, indexes)

**Integration Tests:**
- Test complete payment flow (plan selection → Stripe Checkout → webhook → database update)
- Test payment failure handling (canceled checkout, declined card)
- Test webhook idempotency (duplicate events)
- Test payment status redirects (pending → payment page, active → dashboard)

**Manual Testing:**
- Test Stripe Checkout in test mode (use test card numbers)
- Test webhook delivery (use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
- Test payment success flow (complete checkout, verify database update, verify redirect)
- Test payment failure flow (cancel checkout, verify error message, verify retry)

### Previous Story Intelligence

**From Story 1.6 (Organization Creation):**
- Organizations are created with `plan = 'starter'` by default
- Organization creation happens before payment (user must have organization to pay)
- Use `getCurrentUser()` helper to load organization data
- Organization settings page pattern: Server Component wrapper + Client Component form
- Duplicate name checks use application-level validation (before database insert)
- API routes follow pattern: Zod validation → Supabase query → Error handling → Response

**From Story 1.4 (User Login):**
- Login redirect logic already checks for organization existence
- Payment status check should be added after organization check in login flow
- Use `getCurrentUser()` helper pattern for loading user + organization data
- Middleware already handles authentication and OTP verification
- Payment status check should be added to middleware for protected routes

**Code Patterns to Follow:**
- Environment validation: `lib/supabase/env.ts` pattern (create `lib/stripe/env.ts`)
- API route structure: Validation → Database query → External API call → Response
- Error handling: Try-catch blocks, ZodError handling, user-friendly error messages
- Form patterns: Server Component wrapper + Client Component form (see Story 1.6)
- Styling: Match Tailwind classes from registration/login pages exactly

### Library and Framework Requirements

**Stripe SDK:**
- **Package:** `stripe` (server-side), `@stripe/stripe-js` (client-side)
- **Version:** Latest stable (check npm: `npm view stripe version`)
- **Documentation:** https://stripe.com/docs/stripe-js
- **API Version:** Configure in Stripe client initialization (use latest stable)

**Next.js Integration:**
- API Routes: Use Next.js 16 App Router API route handlers
- Server Components: Use for payment page and success page (load organization data)
- Client Components: Use for payment form (interactive plan selection)
- Environment Variables: Use `process.env` for server-side, `NEXT_PUBLIC_*` for client-side

**Supabase Integration:**
- Use existing Supabase server client from `lib/supabase/server.ts`
- Query `organizations` table for payment status
- Update `organizations` table with Stripe customer/subscription IDs
- Use existing `getCurrentUser()` helper pattern

### Architecture Compliance

**API Design:**
- RESTful API routes in `app/api/` directory
- Zod schema validation on all requests
- Consistent error response format: `{ error: string, details?: any }`
- Success response format: `{ success: true, data: any }`

**Database Design:**
- Add payment fields to `organizations` table (not separate table for MVP)
- Use migrations for schema changes (idempotent)
- Add indexes for performance (payment_status queries)
- Foreign key constraints where applicable

**Security:**
- Environment variables for secrets (never commit to git)
- Webhook signature verification (prevent unauthorized calls)
- Input validation (Zod schemas)
- PCI DSS compliance via Stripe (we never touch credit card data)

**Error Handling:**
- Try-catch blocks in all async operations
- User-friendly error messages (don't expose internal errors)
- Logging for debugging (console.log or Sentry)
- Retry logic for webhook processing failures

### Project Context Reference

**Primary Sources:**
- **epics.md** (Story 1.7 section) - Story requirements and acceptance criteria
- **prd.md** (Access Control & Payment Model, Pricing Tiers sections) - Payment requirements, pricing details, payment flow
- **architecture.md** (API Design, Security Architecture sections) - Technical stack, API patterns, security requirements
- **ux-design-specification.md** (Form Patterns, Button Hierarchy sections) - UX patterns for forms, buttons, success states

**PRD Context:**
- Payment-First Model: No free trials, payment required before dashboard access (FR130-FR137)
- Pricing Tiers: Starter ($59/$89), Pro ($175/$220), Agency ($299/$399) with annual discounts
- Payment Flow: Account creation → Plan selection → Payment → Dashboard access
- Grace Period: 7-day grace period for failed payments (Story 1.9)
- Stripe Integration: Stripe Checkout for payment processing, webhooks for subscription management

**Architecture Decisions:**
- Stripe Checkout: Hosted payment page (PCI DSS compliance via Stripe)
- Webhook Handler: Async payment confirmation (Stripe → our system)
- Database Storage: Payment fields in `organizations` table (not separate table for MVP)
- Payment Status: Enum with values: `pending_payment`, `active`, `suspended`, `canceled`

**Stripe Documentation:**
- Stripe Checkout: https://stripe.com/docs/payments/checkout
- Stripe Webhooks: https://stripe.com/docs/webhooks
- Stripe API Reference: https://stripe.com/docs/api
- Stripe Testing: https://stripe.com/docs/testing

**Next.js Documentation:**
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Next.js Environment Variables: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

### Next Steps After Completion

**Immediate Next Story (1.8):**
- Payment-First Access Control (Paywall Implementation)
- Will check payment status in middleware and block dashboard access until payment confirmed
- Depends on Story 1.7 for payment status tracking

**Future Stories Dependencies:**
- Story 1.9 will implement account suspension/reactivation (uses payment_status field)
- Story 1.12 will implement basic dashboard access (requires payment confirmation)
- Story 10.6 will implement plan upgrades/downgrades (uses Stripe subscription management)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (via Cursor)

### Debug Log References

### Completion Notes List

### File List

