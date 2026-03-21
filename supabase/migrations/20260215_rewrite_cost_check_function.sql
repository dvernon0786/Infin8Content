-- Migration: Rewrite check_workflow_cost_limit to use ai_usage_ledger
-- Date: 2026-02-15
-- Purpose: Zero-legacy cost enforcement using ledger instead of workflow_data

-- Drop existing function
DROP FUNCTION IF EXISTS check_workflow_cost_limit(uuid, numeric, numeric);

-- Create zero-legacy version using ai_usage_ledger
CREATE OR REPLACE FUNCTION check_workflow_cost_limit(
  p_workflow_id uuid,
  p_additional_cost numeric,
  p_max_cost numeric DEFAULT 1.00
) RETURNS boolean AS $$
DECLARE
  current_total numeric;
BEGIN
  -- Calculate total cost from ai_usage_ledger
  SELECT COALESCE(SUM(cost), 0)
  INTO current_total
  FROM ai_usage_ledger
  WHERE workflow_id = p_workflow_id;

  -- Check if adding this cost would exceed limit
  RETURN current_total + p_additional_cost <= p_max_cost;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Comment on function
COMMENT ON FUNCTION check_workflow_cost_limit IS 'Zero-legacy cost check using ai_usage_ledger instead of workflow_data';
