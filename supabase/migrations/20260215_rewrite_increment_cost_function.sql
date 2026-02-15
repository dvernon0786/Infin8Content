-- Migration: Rewrite increment_workflow_cost to use ai_usage_ledger
-- Date: 2026-02-15
-- Purpose: Zero-legacy cost recording using ledger instead of workflow_data

-- Drop existing function
DROP FUNCTION IF EXISTS increment_workflow_cost(uuid, numeric);

-- Create zero-legacy version using ai_usage_ledger
CREATE OR REPLACE FUNCTION increment_workflow_cost(
  p_workflow_id uuid,
  p_organization_id uuid,
  p_model text,
  p_prompt_tokens int,
  p_completion_tokens int,
  p_cost numeric
) RETURNS void AS $$
BEGIN
  -- Insert cost record into ai_usage_ledger
  INSERT INTO ai_usage_ledger(
    workflow_id, 
    organization_id, 
    model, 
    prompt_tokens, 
    completion_tokens, 
    cost
  ) VALUES (
    p_workflow_id, 
    p_organization_id, 
    p_model, 
    p_prompt_tokens, 
    p_completion_tokens, 
    p_cost
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Comment on function
COMMENT ON FUNCTION increment_workflow_cost IS 'Zero-legacy cost recording using ai_usage_ledger instead of workflow_data';
