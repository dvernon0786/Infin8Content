-- Migration: Add atomic cost guard function
-- Date: 2026-02-12
-- Purpose: Prevent race conditions in AI cost enforcement

-- Function to atomically check and update workflow cost
CREATE OR REPLACE FUNCTION check_and_update_workflow_cost(
  p_workflow_id uuid,
  p_additional_cost numeric,
  p_max_cost numeric DEFAULT 1.00
) RETURNS boolean AS $$
DECLARE
  current_total numeric;
BEGIN
  -- Lock the workflow row and get current cost
  SELECT (workflow_data->>'total_ai_cost')::numeric 
  INTO current_total
  FROM intent_workflows 
  WHERE id = p_workflow_id 
  FOR UPDATE;
  
  -- If workflow doesn't exist, treat as 0 cost
  IF current_total IS NULL THEN
    current_total := 0;
  END IF;
  
  -- Check if adding this cost would exceed limit
  IF current_total + p_additional_cost > p_max_cost THEN
    RETURN false; -- Would exceed limit
  END IF;
  
  -- Update the total cost atomically
  UPDATE intent_workflows 
  SET workflow_data = jsonb_set(
    workflow_data,
    '{total_ai_cost}',
    to_jsonb((current_total + p_additional_cost)::numeric)
  )
  WHERE id = p_workflow_id;
  
  RETURN true; -- Success
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Function to get organization's monthly AI cost
CREATE OR REPLACE FUNCTION get_organization_monthly_ai_cost(
  p_organization_id uuid
) RETURNS numeric AS $$
DECLARE
  monthly_total numeric;
BEGIN
  SELECT COALESCE(SUM(cost), 0)
  INTO monthly_total
  FROM ai_usage_ledger
  WHERE organization_id = p_organization_id
    AND created_at >= date_trunc('month', CURRENT_DATE);
  
  RETURN monthly_total;
END;
$$ LANGUAGE plpgsql;

-- Function to check organization monthly quota
CREATE OR REPLACE FUNCTION check_organization_monthly_quota(
  p_organization_id uuid,
  p_monthly_limit numeric DEFAULT 25.00
) RETURNS boolean AS $$
DECLARE
  current_monthly_cost numeric;
BEGIN
  current_monthly_cost := get_organization_monthly_ai_cost(p_organization_id);
  
  RETURN current_monthly_cost <= p_monthly_limit;
END;
$$ LANGUAGE plpgsql;

-- Index for organization monthly cost queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_ledger_org_month 
ON ai_usage_ledger(organization_id, created_at);

-- Index for workflow cost queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_ledger_workflow 
ON ai_usage_ledger(workflow_id);

-- Comment on functions
COMMENT ON FUNCTION check_and_update_workflow_cost IS 'Atomically checks if adding cost would exceed limit and updates if safe';
COMMENT ON FUNCTION get_organization_monthly_ai_cost IS 'Calculates organization total AI cost for current month';
COMMENT ON FUNCTION check_organization_monthly_quota IS 'Checks if organization is within monthly AI cost quota';
