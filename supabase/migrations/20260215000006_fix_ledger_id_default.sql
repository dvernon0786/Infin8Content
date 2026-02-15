-- Fix ai_usage_ledger id default value
-- Add gen_random_uuid() default to prevent null constraint violation
-- Date: February 15, 2026

-- Add default value to id column
ALTER TABLE ai_usage_ledger
ALTER COLUMN id SET DEFAULT gen_random_uuid();
