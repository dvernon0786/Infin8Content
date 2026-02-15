-- Final FSM Convergence - Zero Legacy Implementation
-- Complete elimination of all legacy workflow logic
-- Date: February 15, 2026

-- Drop any previous versions
DROP FUNCTION IF EXISTS record_usage_increment_and_complete_step;

-- Create final zero-legacy stored procedure
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
  v_exists BOOLEAN;
BEGIN
  -- Idempotency guard
  SELECT EXISTS (
    SELECT 1 FROM ai_usage_ledger
    WHERE idempotency_key = p_idempotency_key
  )
  INTO v_exists;

  IF v_exists THEN
    RETURN;
  END IF;

  -- Ensure workflow exists + lock it
  PERFORM 1
  FROM intent_workflows
  WHERE id = p_workflow_id
    AND organization_id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow not found: %', p_workflow_id;
  END IF;

  -- Insert usage record
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

  -- Advance workflow state + store ICP
  UPDATE intent_workflows
  SET
    icp_data = p_icp_data,
    state = 'step_2_competitors',
    updated_at = NOW()
  WHERE id = p_workflow_id
    AND organization_id = p_organization_id;

END;
$$;
