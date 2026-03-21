-- Fix payment_status constraint to include 'trialing'
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_payment_status_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_payment_status_check 
  CHECK (payment_status IN ('pending_payment', 'active', 'suspended', 'canceled', 'past_due', 'trialing'));

-- Fix plan constraint to include 'trial'
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_plan_check 
  CHECK (plan IN ('starter', 'pro', 'agency', 'trial'));
