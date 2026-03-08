-- Hardening Quota Enforcement & Stripe Idempotency
-- Resolves Audit Issues: 1 (Race Condition), 3 (Webhook Idempotency), 4 (Reset Logic)

-- 1. Ensure absolute idempotency for Stripe Webhooks
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_stripe_event_id') THEN
        ALTER TABLE stripe_webhook_events ADD CONSTRAINT unique_stripe_event_id UNIQUE (stripe_event_id);
    END IF;
END $$;

-- 2. Atomic Quota Increment Function
-- This function handles:
-- a) Concurrent safety (atomic increment)
-- b) Cycle reset logic in a single transaction
-- c) Limit enforcement
CREATE OR REPLACE FUNCTION increment_article_usage(
    target_org_id UUID,
    max_limit INTEGER,
    new_reset_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    new_usage INTEGER,
    new_reset TIMESTAMPTZ
) AS $$
DECLARE
    current_org_usage INTEGER;
    current_reset TIMESTAMPTZ;
    is_new_cycle BOOLEAN;
    effective_limit INTEGER;
BEGIN
    -- Select with Row Level Lock (FOR UPDATE)
    SELECT article_usage, usage_reset_at 
    INTO current_org_usage, current_reset
    FROM organizations 
    WHERE id = target_org_id 
    FOR UPDATE;

    -- Determine if we are starting a new billing cycle
    is_new_cycle := current_reset IS NOT NULL AND NOW() > current_reset;

    -- Calculate effective limit (handle downgrades gracefully)
    -- If we are in a new cycle, usage resets to 0 (effectively 1 after increment)
    -- If we are in the same cycle, limit applies
    IF is_new_cycle THEN
        current_org_usage := 0;
        current_reset := COALESCE(new_reset_at, current_reset + INTERVAL '1 month');
    END IF;

    -- Max(current, limit) handles downgrades (Soft Paywall)
    effective_limit := GREATEST(current_org_usage, COALESCE(max_limit, 2147483647));

    IF current_org_usage < effective_limit THEN
        UPDATE organizations
        SET 
            article_usage = current_org_usage + 1,
            usage_reset_at = current_reset,
            updated_at = NOW()
        WHERE id = target_org_id;

        RETURN QUERY SELECT TRUE, current_org_usage + 1, current_reset;
    ELSE
        RETURN QUERY SELECT FALSE, current_org_usage, current_reset;
    END IF;
END;
$$ LANGUAGE plpgsql;
