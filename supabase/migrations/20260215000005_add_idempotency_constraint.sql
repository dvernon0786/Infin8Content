-- Add Unique Constraint for True Idempotency
-- Prevents duplicate usage records from race conditions
-- Date: February 15, 2026

-- Add unique constraint on idempotency_key
ALTER TABLE ai_usage_ledger
ADD CONSTRAINT ai_usage_ledger_idempotency_unique
UNIQUE (idempotency_key);
