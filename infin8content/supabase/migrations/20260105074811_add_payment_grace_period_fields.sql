-- Add grace period and suspension tracking fields to organizations table
-- Story 1.8: Payment-First Access Control (Paywall Implementation)

-- ============================================================================
-- Add grace period and suspension columns to organizations table (idempotent)
-- ============================================================================

DO $$ 
BEGIN
  -- Add grace_period_started_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'grace_period_started_at') THEN
    ALTER TABLE organizations ADD COLUMN grace_period_started_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add suspended_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'suspended_at') THEN
    ALTER TABLE organizations ADD COLUMN suspended_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- ============================================================================
-- Update payment_status CHECK constraint to include 'past_due' (idempotent)
-- ============================================================================

DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_payment_status_check') THEN
    ALTER TABLE organizations DROP CONSTRAINT organizations_payment_status_check;
  END IF;
  
  -- Add updated constraint with 'past_due' status
  ALTER TABLE organizations ADD CONSTRAINT organizations_payment_status_check 
    CHECK (payment_status IN ('pending_payment', 'active', 'past_due', 'suspended', 'canceled'));
END $$;

-- ============================================================================
-- Add indexes for performance (idempotent)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_grace_period_started_at ON organizations(grace_period_started_at);
CREATE INDEX IF NOT EXISTS idx_organizations_suspended_at ON organizations(suspended_at);

-- ============================================================================
-- Add column comments explaining grace period logic
-- ============================================================================

COMMENT ON COLUMN organizations.grace_period_started_at IS 'Timestamp when payment failure occurred and grace period started. Grace period duration is 7 days from this timestamp. After 7 days, account is automatically suspended.';
COMMENT ON COLUMN organizations.suspended_at IS 'Timestamp when account was suspended due to payment failure after grace period expiration. Account remains suspended until payment is successfully processed.';

