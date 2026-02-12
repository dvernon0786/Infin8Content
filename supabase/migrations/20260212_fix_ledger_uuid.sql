-- Migration: Fix ai_usage_ledger UUID generation
-- Date: 2026-02-12
-- Purpose: Add UUID generation to record_usage_and_increment function

-- Drop and recreate the function with UUID generation
DROP FUNCTION IF EXISTS record_usage_and_increment;

CREATE OR REPLACE FUNCTION record_usage_and_increment(
  p_workflow_id uuid,
  p_organization_id uuid,
  p_model text,
  p_prompt_tokens int,
  p_completion_tokens int,
  p_cost numeric
) RETURNS void AS $$
BEGIN
  INSERT INTO ai_usage_ledger(
    id,  -- Add UUID generation
    workflow_id, 
    organization_id, 
    model, 
    prompt_tokens, 
    completion_tokens, 
    cost
  ) VALUES (
    gen_random_uuid(),  -- Generate UUID
    p_workflow_id, 
    p_organization_id, 
    p_model,
    p_prompt_tokens, 
    p_completion_tokens, 
    p_cost
  );

  UPDATE intent_workflows
  SET workflow_data = jsonb_set(
    workflow_data,
    '{total_ai_cost}',
    to_jsonb(
      COALESCE((workflow_data->>'total_ai_cost')::numeric, 0) + p_cost
    )
  )
  WHERE id = p_workflow_id;
END;
$$ LANGUAGE plpgsql;

-- Comment on function
COMMENT ON FUNCTION record_usage_and_increment IS 'Atomically records AI usage and increments workflow cost with UUID generation';
