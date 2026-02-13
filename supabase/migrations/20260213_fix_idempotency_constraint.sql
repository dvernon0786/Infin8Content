-- Fix idempotency constraint to use UUID-only keys
-- The previous implementation used composite strings which violated UUID column type

-- Drop the old composite constraint
ALTER TABLE ai_usage_ledger
DROP CONSTRAINT IF EXISTS unique_workflow_idempotency;

-- Add proper UUID-only constraint on idempotency_key (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_idempotency_key' 
        AND conrelid = 'ai_usage_ledger'::regclass
    ) THEN
        ALTER TABLE ai_usage_ledger
        ADD CONSTRAINT unique_idempotency_key
        UNIQUE (idempotency_key);
    END IF;
END $$;

-- Update the atomic function to use the correct constraint
-- Drop all versions of the function by specifying the exact signature
DROP FUNCTION IF EXISTS record_usage_increment_and_complete_step(
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
);

-- Also drop the version without idempotency_key parameter if it exists
DROP FUNCTION IF EXISTS record_usage_increment_and_complete_step(
  p_workflow_id UUID,
  p_organization_id UUID,
  p_model TEXT,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER,
  p_cost NUMERIC,
  p_icp_data JSONB,
  p_tokens_used INTEGER,
  p_generated_at TIMESTAMPTZ
);

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
  v_existing_workflow_data JSONB;
  v_ledger_inserted_id UUID;
  v_current_total_cost NUMERIC;
  v_max_cost NUMERIC DEFAULT 1.00;
BEGIN

  -- 🔒 Tenant-scoped row lock
  SELECT workflow_data
  INTO v_existing_workflow_data
  FROM intent_workflows
  WHERE id = p_workflow_id
  AND organization_id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow not found or tenant mismatch: %', p_workflow_id;
  END IF;

  -- 1️⃣ Idempotent ledger insert
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
  ON CONFLICT (idempotency_key)
  DO NOTHING
  RETURNING id INTO v_ledger_inserted_id;

  -- Only mutate workflow if ledger insert actually happened
  IF v_ledger_inserted_id IS NOT NULL THEN

    v_current_total_cost :=
      COALESCE((v_existing_workflow_data->>'total_ai_cost')::numeric, 0);

    IF (v_current_total_cost + p_cost) > v_max_cost THEN
      RAISE EXCEPTION
        'Workflow cost limit exceeded: current=%, additional=%, limit=%',
        v_current_total_cost, p_cost, v_max_cost;
    END IF;

    UPDATE intent_workflows
    SET
      state = 'COMPETITOR_PENDING',
      workflow_data =
        COALESCE(v_existing_workflow_data, '{}'::jsonb)
        - 'icp_generation_error'
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
      status = 'step_1_icp',
      current_step = 2,
      step_1_icp_error_message = NULL,
      step_1_icp_last_error_message = NULL,
      step_1_icp_completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_workflow_id
    AND organization_id = p_organization_id;

  END IF;

END;
$$;

-- Comment on function
COMMENT ON FUNCTION record_usage_increment_and_complete_step IS 'Atomically records AI usage and increments workflow cost with proper UUID idempotency';
