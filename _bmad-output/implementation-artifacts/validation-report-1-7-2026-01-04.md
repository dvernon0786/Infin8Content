# Validation Report

**Document:** `_bmad-output/implementation-artifacts/1-7-stripe-payment-integration-and-subscription-setup.md`
**Checklist:** `_bmad/bmm/workflows/4-implementation/create-story/checklist.md`
**Date:** 2026-01-04

## Summary
- Overall: 8/12 critical requirements fully met (67%)
- Critical Issues: 4
- Enhancement Opportunities: 6
- Optimization Suggestions: 3

## Section Results

### Critical Technical Requirements

✓ **Stripe SDK Installation** - PASS
- Evidence: Task 1 specifies exact packages (`stripe`, `@stripe/stripe-js`) and installation steps
- Lines: 43-52

⚠ **Webhook Route Configuration** - PARTIAL
- Evidence: Task 4 mentions webhook handler but missing critical Next.js App Router configuration
- Missing: Next.js requires `export const runtime = 'nodejs'` and raw body access for webhook signature verification
- Impact: Webhook signature verification will fail without raw body access
- Lines: 94-117

✗ **Stripe Customer Creation Strategy** - FAIL
- Evidence: Task 3 mentions "create customer if doesn't exist" but doesn't specify WHEN or HOW
- Missing: Should customer be created before checkout session? Or during checkout? Need explicit strategy
- Impact: Developer may implement incorrectly, causing duplicate customers or failed checkouts
- Lines: 90

⚠ **Price ID Storage and Management** - PARTIAL
- Evidence: Task 9 mentions storing price IDs but doesn't specify WHERE (database table? env vars? config file?)
- Missing: Explicit storage location and access pattern (e.g., `lib/stripe/prices.ts` with type-safe price ID mapping)
- Impact: Developer may choose wrong storage location, making price updates difficult
- Lines: 172

✓ **Database Schema Migration** - PASS
- Evidence: Task 7 provides detailed schema with column types, constraints, and indexes
- Lines: 137-150

⚠ **Webhook Idempotency Implementation** - PARTIAL
- Evidence: Task 12 mentions idempotency but doesn't specify HOW to track processed events
- Missing: Database table or pattern for storing processed Stripe event IDs to prevent duplicate processing
- Impact: Duplicate webhook events could cause double-charging or data corruption
- Lines: 196

### Architecture Compliance

✓ **Stripe Integration Pattern** - PASS
- Evidence: Dev Notes section clearly explains Checkout vs. Stripe.js usage, webhook flow
- Lines: 203-208

✓ **Payment Flow Architecture** - PASS
- Evidence: Step-by-step flow diagram provided
- Lines: 210-216

⚠ **Next.js Route Handler Pattern** - PARTIAL
- Evidence: References Next.js 16 App Router but missing webhook-specific configuration
- Missing: Raw body configuration example for webhook route
- Impact: Developer may not know how to access raw body for signature verification
- Lines: 246-248

### Previous Story Intelligence

✓ **Story 1.6 Patterns** - PASS
- Evidence: References `getCurrentUser()` helper, Server Component + Client Component pattern
- Lines: 305-311

✓ **Story 1.4 Patterns** - PASS
- Evidence: References login redirect logic, middleware patterns
- Lines: 313-318

⚠ **Environment Validation Pattern** - PARTIAL
- Evidence: References `lib/supabase/env.ts` pattern but doesn't show example
- Missing: Should include example of validation function structure (now added via file read)
- Impact: Developer may not follow exact pattern, causing inconsistency
- Lines: 321

### File Structure Requirements

✓ **New Files List** - PASS
- Evidence: Comprehensive list of all files to create with descriptions
- Lines: 264-273

✓ **Files to Modify** - PASS
- Evidence: Clear list of existing files that need updates
- Lines: 275-280

### Testing Requirements

✓ **Unit Tests** - PASS
- Evidence: Specific test cases listed for key functionality
- Lines: 284-289

✓ **Integration Tests** - PASS
- Evidence: End-to-end test scenarios provided
- Lines: 291-295

✓ **Manual Testing** - PASS
- Evidence: Stripe CLI command and test scenarios provided
- Lines: 297-301

### Disaster Prevention

✗ **Success Page Race Condition** - FAIL
- Evidence: Task 5 verifies session but doesn't handle case where webhook hasn't processed yet
- Missing: Strategy for handling user arriving at success page before webhook completes (polling? wait? show pending?)
- Impact: User may see success page but payment_status still 'pending_payment', causing confusion
- Lines: 119-127

✗ **Feature Comparison Table Source** - FAIL
- Evidence: Task 2 mentions feature comparison but doesn't specify WHERE to get feature list
- Missing: Reference to PRD section (e.g., "Pricing Tiers" section lines 1047-1110) with exact feature list
- Impact: Developer may create incomplete or incorrect feature comparison
- Lines: 63

⚠ **Migration Idempotency Pattern** - PARTIAL
- Evidence: Task 7 mentions idempotent migration but doesn't show SQL pattern
- Missing: Example SQL showing `IF NOT EXISTS` or `DO $$ BEGIN ... END $$` pattern
- Impact: Developer may not implement true idempotency, causing migration failures on re-run
- Lines: 139

### LLM Optimization

⚠ **Verbosity in Technical Requirements** - PARTIAL
- Evidence: Some sections are verbose without adding actionable value
- Example: "Latest stable version (check npm for current version)" could be more direct
- Impact: Wastes tokens, reduces clarity

✓ **Structure and Organization** - PASS
- Evidence: Clear sections, good use of headings and bullet points
- Lines: 199-426

## Failed Items

### 1. Stripe Customer Creation Strategy (CRITICAL)
**Issue:** Task 3 mentions creating customer "if doesn't exist" but doesn't specify the strategy.
**Recommendation:** Add explicit instruction:
- Create Stripe customer BEFORE creating checkout session
- Use `stripe.customers.create()` with email from user record
- Store customer ID in session metadata for webhook retrieval
- If customer already exists (by email), retrieve existing customer ID

### 2. Success Page Race Condition (CRITICAL)
**Issue:** User may arrive at success page before webhook processes payment.
**Recommendation:** Add handling strategy:
- Option A: Poll database for payment_status update (with timeout)
- Option B: Show "Processing payment..." message with auto-refresh
- Option C: Verify session status via Stripe API and show appropriate message
- Include fallback: If webhook delayed > 30 seconds, show "Payment received, activating account..." with manual refresh option

### 3. Feature Comparison Table Source (CRITICAL)
**Issue:** Task 2 doesn't specify where to get feature list for comparison table.
**Recommendation:** Add explicit reference:
- Source: PRD "Pricing Tiers" section (lines 1047-1110 in prd.md)
- Extract feature list: articles/month, keyword researches, CMS connections, projects, stores, products, team members, storage, API calls, white-label, client portal, support SLA, uptime SLA
- Create feature comparison component showing Starter vs. Pro vs. Agency differences

### 4. Webhook Route Raw Body Configuration (CRITICAL)
**Issue:** Next.js App Router webhook route needs special configuration for raw body access.
**Recommendation:** Add explicit configuration:
```typescript
export const runtime = 'nodejs' // Required for webhooks
export async function POST(request: Request) {
  const body = await request.text() // Get raw body as string
  const signature = request.headers.get('stripe-signature')
  // ... rest of webhook handler
}
```

## Partial Items

### 1. Webhook Idempotency Implementation
**What's Missing:** Database table or pattern for tracking processed Stripe event IDs.
**Recommendation:** Add to Task 7 migration:
- Create `stripe_webhook_events` table with columns: `id`, `stripe_event_id` (unique), `event_type`, `processed_at`, `organization_id`
- In webhook handler, check if `stripe_event_id` exists before processing
- Store event ID after successful processing

### 2. Price ID Storage Location
**What's Missing:** Explicit storage location and access pattern.
**Recommendation:** Add to Task 9:
- Create `lib/stripe/prices.ts` with type-safe price ID mapping:
```typescript
export const STRIPE_PRICE_IDS = {
  starter: { monthly: 'price_xxx', annual: 'price_yyy' },
  pro: { monthly: 'price_zzz', annual: 'price_aaa' },
  agency: { monthly: 'price_bbb', annual: 'price_ccc' },
} as const
```
- Document: Update this file when prices change in Stripe Dashboard

### 3. Migration Idempotency Pattern
**What's Missing:** Example SQL showing idempotent pattern.
**Recommendation:** Add example to Task 7:
```sql
-- Idempotent column addition
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE organizations ADD COLUMN stripe_customer_id TEXT;
  END IF;
END $$;
```

### 4. Environment Validation Pattern Example
**What's Missing:** Example showing exact pattern from lib/supabase/env.ts.
**Recommendation:** Add to Task 1:
- Reference: See `lib/supabase/env.ts` for exact pattern (lines 1-47)
- Create `lib/stripe/env.ts` following same structure:
  - Function: `validateStripeEnv()` checks `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Throws error with helpful message if missing
  - Returns validated values

## Recommendations

### Must Fix (Critical)
1. Add Stripe customer creation strategy to Task 3
2. Add success page race condition handling to Task 5
3. Add feature comparison table source reference to Task 2
4. Add webhook route raw body configuration to Task 4

### Should Improve (Important)
1. Add webhook idempotency table to migration (Task 7)
2. Add price ID storage pattern to Task 9
3. Add migration idempotency SQL example to Task 7
4. Add environment validation pattern example to Task 1

### Consider (Nice to Have)
1. Add Stripe API version pinning (e.g., `apiVersion: '2024-11-20.acacia'`)
2. Add webhook retry strategy details (exponential backoff, max retries)
3. Optimize verbose sections for token efficiency

