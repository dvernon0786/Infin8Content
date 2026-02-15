-- Add Unique Constraint for True Idempotency (Production-Safe)
-- Prevents duplicate usage records from race conditions
-- Uses CONCURRENTLY to avoid table locks in production
-- Date: February 15, 2026

-- Create unique index concurrently to avoid table locks
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS 
ai_usage_ledger_idempotency_unique
ON ai_usage_ledger (idempotency_key);
