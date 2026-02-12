-- Add idempotency protection to ai_usage_ledger
-- Prevents double settlement on network retries (Stripe-level safety)

-- Add idempotency_key column
ALTER TABLE ai_usage_ledger
ADD COLUMN idempotency_key UUID;

-- Add unique constraint for workflow + idempotency key
ALTER TABLE ai_usage_ledger
ADD CONSTRAINT unique_workflow_idempotency
UNIQUE (workflow_id, idempotency_key);

-- Add index for performance
CREATE INDEX idx_ai_usage_ledger_idempotency 
ON ai_usage_ledger(workflow_id, idempotency_key);
