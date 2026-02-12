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
  p_generated_at TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing_workflow_data JSONB;
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

  -- 1️⃣ Financial settlement (ledger is append-only truth)
  INSERT INTO ai_usage_ledger (
    id,
    workflow_id,
    organization_id,
    model,
    prompt_tokens,
    completion_tokens,
    cost,
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
    NOW()
  );

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
  WHERE id = p_workflow_id;

END;
$$;
