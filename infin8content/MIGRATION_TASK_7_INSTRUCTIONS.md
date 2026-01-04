# Task 7: Apply Stripe Payment Migration

## Migration File
`supabase/migrations/20260105003507_add_stripe_payment_fields.sql`

## How to Apply Migration

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/ybsgllsnaqkpxgdjdvcz
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**
4. Open the migration file: `infin8content/supabase/migrations/20260105003507_add_stripe_payment_fields.sql`
5. Copy the entire contents of the file
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Verify the migration succeeded (you should see "Success. No rows returned")

### Option 2: Via Supabase CLI (If Authenticated)

```bash
cd infin8content
supabase login  # If not already logged in
supabase link --project-ref ybsgllsnaqkpxgdjdvcz
supabase migration up
```

## What This Migration Does

1. **Adds payment tracking columns to `organizations` table:**
   - `stripe_customer_id` (TEXT, unique)
   - `stripe_subscription_id` (TEXT, unique)
   - `payment_status` (TEXT, default: 'pending_payment', check: 'pending_payment' | 'active' | 'suspended' | 'canceled')
   - `payment_confirmed_at` (TIMESTAMP WITH TIME ZONE)

2. **Creates `stripe_webhook_events` table:**
   - Tracks processed Stripe webhook events for idempotency
   - Columns: `id`, `stripe_event_id` (unique), `event_type`, `organization_id`, `processed_at`, `created_at`

3. **Adds indexes for performance:**
   - Indexes on `stripe_customer_id`, `stripe_subscription_id`, `payment_status`
   - Indexes on `stripe_webhook_events` table fields

## Verify Migration

After applying the migration, verify in Supabase Dashboard:

1. Go to **Table Editor**
2. Check `organizations` table - you should see the new columns:
   - `stripe_customer_id`
   - `stripe_subscription_id`
   - `payment_status`
   - `payment_confirmed_at`
3. Check for new `stripe_webhook_events` table

## Next Steps

After the migration is applied, the TypeScript types will be regenerated automatically.

