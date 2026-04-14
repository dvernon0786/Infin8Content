ALTER TABLE organizations
ADD COLUMN trial_ends_at timestamp with time zone NULL;

-- Backfill any orgs already on trial plan_type
-- so the PaymentGuard has something to evaluate
UPDATE organizations
SET trial_ends_at = created_at + interval '3 days'
WHERE plan_type = 'trial'
  AND trial_ends_at IS NULL;
