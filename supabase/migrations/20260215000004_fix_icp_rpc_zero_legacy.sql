-- Fix ICP RPC to be Zero-Legacy and FSM-Pure
-- Remove all legacy column references, keep only ledger + ICP storage
-- State mutation handled by advanceWorkflow() only
-- Date: February 15, 2026

-- Drop the legacy procedure that mixes old schema with new FSM
DROP FUNCTION IF EXISTS record_usage_increment_and_complete_step;

-- Create zero-legacy, FSM-pure procedure
CREATE OR REPLACE FUNCTION record_usage_increment_and_complete_step(
  p_workflow_id UUID,
  p_organization_id UUID,
  p_model TEXT,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER,
  p_cost NUMERIC,
  p_icp_data JSONB,
  p_tokens_used INTEGER,
  p_generated_at TIMESTAMPTZ,
  p_idempotency_key UUID
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_already_exists BOOLEAN;
BEGIN

  -- 🔐 Idempotency guard
  SELECT EXISTS(
    SELECT 1 FROM ai_usage_ledger
    WHERE idempotency_key = p_idempotency_key
  )
  INTO v_already_exists;

  IF v_already_exists THEN
    RETURN;
  END IF;

  -- 1️⃣ Insert cost record
  INSERT INTO ai_usage_ledger (
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
    p_workflow_id,
    p_organization_id,
    p_model,
    p_prompt_tokens,
    p_completion_tokens,
    p_cost,
    p_idempotency_key,
    NOW()
  );

  -- 2️⃣ Store ICP data only
  UPDATE intent_workflows
  SET
    icp_data = p_icp_data,
    updated_at = NOW()
  WHERE id = p_workflow_id
    AND organization_id = p_organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow not found or tenant mismatch: %', p_workflow_id;
  END IF;

END;
$$;

-- Add comment explaining the architectural change
COMMENT ON FUNCTION record_usage_increment_and_complete_step IS 'Zero-legacy RPC: handles ledger + ICP storage only. State mutation handled by advanceWorkflow()';
