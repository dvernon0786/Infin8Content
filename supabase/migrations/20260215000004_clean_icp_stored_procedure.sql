-- Clean ICP Stored Procedure - Usage Only
-- Removes all workflow mutations, keeps only usage tracking
-- Date: February 15, 2026

-- Drop the old procedure that mixes concerns
DROP FUNCTION IF EXISTS record_usage_increment_and_complete_step;

-- Create clean usage-only procedure
CREATE OR REPLACE FUNCTION record_usage_increment_and_complete_step(
  p_workflow_id UUID,
  p_organization_id UUID,
  p_model TEXT,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER,
  p_cost NUMERIC,
  p_idempotency_key UUID DEFAULT gen_random_uuid()
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN

  -- Check idempotency - prevent duplicate usage records
  SELECT EXISTS(
    SELECT 1 
    FROM ai_usage_ledger 
    WHERE idempotency_key = p_idempotency_key
  )
  INTO v_exists;

  IF v_exists THEN
    RETURN; -- Already recorded, exit early
  END IF;

  -- Insert usage record only - no workflow mutations
  INSERT INTO ai_usage_ledger (
    id,
    workflow_id,
    organization_id,
    model,
    prompt_tokens,
    completion_tokens,
    cost,
    idempotency_key,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    p_workflow_id,
    p_organization_id,
    p_model,
    p_prompt_tokens,
    p_completion_tokens,
    p_cost,
    p_idempotency_key,
    NOW()
  );

END;
$$;
