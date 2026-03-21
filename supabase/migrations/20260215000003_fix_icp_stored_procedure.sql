-- Fix ICP Stored Procedure for Unified Workflow States
-- Update record_usage_increment_and_complete_step to use unified state column
-- Date: February 15, 2026

-- Drop the old procedure that uses legacy columns
DROP FUNCTION IF EXISTS record_usage_increment_and_complete_step;

-- Create updated procedure that uses unified state
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
  v_current_total_cost NUMERIC;
  v_max_cost NUMERIC;
BEGIN
  -- 🔒 Lock workflow row to prevent concurrent mutation
  SELECT workflow_data, total_ai_cost
  INTO v_existing_workflow_data, v_current_total_cost
  FROM intent_workflows
  WHERE id = p_workflow_id
  AND organization_id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow not found: %', p_workflow_id;
  END IF;

  -- Check idempotency to prevent duplicate processing
  SELECT EXISTS(
    SELECT 1 
    FROM ai_usage_ledger 
    WHERE idempotency_key = p_idempotency_key
  )
  INTO v_ledger_inserted;

  IF NOT v_ledger_inserted THEN
    -- Cost limit validation
    SELECT max_ai_cost_per_workflow
    INTO v_max_cost
    FROM organizations
    WHERE id = p_organization_id;
    
    IF (v_current_total_cost + p_cost) > v_max_cost THEN
      RAISE EXCEPTION 'Workflow cost limit exceeded: current=%, additional=%, limit=%', 
                   v_current_total_cost, p_cost, v_max_cost;
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
    );

    -- 2️⃣ Update workflow atomically using UNIFIED STATE
    UPDATE intent_workflows
    SET
      workflow_data =
        COALESCE(v_existing_workflow_data, '{}'::jsonb)
        - 'icp_generation_error'                      -- remove stale error
        || jsonb_build_object(
             'total_ai_cost',
             v_current_total_cost + p_cost
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
      state = 'step_2_competitors',  -- UNIFIED STATE: advance to next step
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
