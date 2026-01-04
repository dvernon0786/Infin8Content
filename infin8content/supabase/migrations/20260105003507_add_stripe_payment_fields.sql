-- Add Stripe payment tracking fields to organizations table
-- Creates stripe_webhook_events table for webhook idempotency
-- Story 1.7: Stripe Payment Integration and Subscription Setup

-- ============================================================================
-- Add payment tracking columns to organizations table (idempotent)
-- ============================================================================

DO $$ 
BEGIN
  -- Add stripe_customer_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE organizations ADD COLUMN stripe_customer_id TEXT;
  END IF;
  
  -- Add stripe_subscription_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'stripe_subscription_id') THEN
    ALTER TABLE organizations ADD COLUMN stripe_subscription_id TEXT;
  END IF;
  
  -- Add payment_status column with default and check constraint
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'payment_status') THEN
    ALTER TABLE organizations ADD COLUMN payment_status TEXT DEFAULT 'pending_payment' 
      CHECK (payment_status IN ('pending_payment', 'active', 'suspended', 'canceled'));
  END IF;
  
  -- Add payment_confirmed_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'payment_confirmed_at') THEN
    ALTER TABLE organizations ADD COLUMN payment_confirmed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Note: plan column already exists from initial_schema.sql, but ensure it has the check constraint
  -- If plan column doesn't exist, add it (shouldn't happen, but for safety)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'plan') THEN
    ALTER TABLE organizations ADD COLUMN plan TEXT DEFAULT 'starter' 
      CHECK (plan IN ('starter', 'pro', 'agency'));
  END IF;
END $$;

-- ============================================================================
-- Add unique constraints (idempotent)
-- ============================================================================

DO $$
BEGIN
  -- Unique constraint on stripe_customer_id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_stripe_customer_id_key') THEN
    ALTER TABLE organizations ADD CONSTRAINT organizations_stripe_customer_id_key UNIQUE (stripe_customer_id);
  END IF;
  
  -- Unique constraint on stripe_subscription_id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_stripe_subscription_id_key') THEN
    ALTER TABLE organizations ADD CONSTRAINT organizations_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
  END IF;
END $$;

-- ============================================================================
-- Add indexes for performance (idempotent)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id ON organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription_id ON organizations(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_organizations_payment_status ON organizations(payment_status);

-- ============================================================================
-- Create stripe_webhook_events table for idempotency tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for stripe_webhook_events table
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_event_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_organization_id ON stripe_webhook_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_type ON stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed_at ON stripe_webhook_events(processed_at);

-- Add table comment
COMMENT ON TABLE stripe_webhook_events IS 'Tracks processed Stripe webhook events for idempotency and audit purposes';
COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe customer ID for this organization';
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'Stripe subscription ID for this organization';
COMMENT ON COLUMN organizations.payment_status IS 'Payment status: pending_payment, active, suspended, or canceled';
COMMENT ON COLUMN organizations.payment_confirmed_at IS 'Timestamp when payment was confirmed via Stripe webhook';

