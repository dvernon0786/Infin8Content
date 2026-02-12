-- Atomic ICP Generation Completion Function
-- Combines financial settlement and workflow state update in single transaction
-- Eliminates split-brain risk and ensures deterministic behavior

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
  p_idempotency_key UUID DEFAULT gen_random_uuid()
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing_workflow_data JSONB;
  v_ledger_inserted BOOLEAN;
BEGIN
  -- 🔒 Lock workflow row to prevent concurrent mutation
  SELECT workflow_data
  INTO v_existing_workflow_data
  FROM intent_workflows
  WHERE id = p_workflow_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow not found: %', p_workflow_id;
  END IF;

  -- 1️⃣ Financial settlement with idempotency protection
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
  )
  ON CONFLICT (workflow_id, idempotency_key) 
  DO NOTHING
  RETURNING id INTO v_ledger_inserted;

  -- Only update workflow if ledger insertion actually happened (idempotency)
  IF v_ledger_inserted IS NOT NULL THEN

  -- 🔒 Elite cost cap enforcement inside transaction (prevents race conditions)
  DECLARE
    v_current_total_cost NUMERIC;
    v_max_cost NUMERIC DEFAULT 1.00; -- $1.00 hard cap per workflow
  BEGIN
    SELECT COALESCE((workflow_data->>'total_ai_cost')::numeric, 0)
    INTO v_current_total_cost
    FROM intent_workflows
    WHERE id = p_workflow_id
    AND organization_id = p_organization_id;
    
    IF (v_current_total_cost + p_cost) > v_max_cost THEN
      RAISE EXCEPTION 'Workflow cost limit exceeded: current=%, additional=%, limit=%', 
                   v_current_total_cost, p_cost, v_max_cost;
    END IF;
  END;

  -- 2️⃣ Update workflow atomically in same transaction
  UPDATE intent_workflows
  SET
    workflow_data =
      COALESCE(v_existing_workflow_data, '{}'::jsonb)
      - 'icp_generation_error'                      -- remove stale error
      || jsonb_build_object(
           'total_ai_cost',
           COALESCE((v_existing_workflow_data->>'total_ai_cost')::numeric, 0) + p_cost
         )
      || jsonb_build_object(
           'icp_generation',
           jsonb_build_object(
             'tokensUsed', p_tokens_used,
             'modelUsed', p_model,
             'cost', p_cost,
             'generatedAt', p_generated_at
           )
         ),
    icp_data = p_icp_data,
    status = 'step_1_icp',
    current_step = 2,
    step_1_icp_error_message = NULL,
    step_1_icp_last_error_message = NULL,
    step_1_icp_completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_workflow_id
    AND organization_id = p_organization_id;

  -- Verify workflow was found and belongs to organization
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow not found or tenant mismatch: %', p_workflow_id;
  END IF;

  END IF; -- Close idempotency conditional

END;
$$;
