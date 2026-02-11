-- Fix: Drop overly restrictive status-step synchronization trigger
-- Date: 2026-02-12
-- Purpose: Allow legitimate workflow state transitions

-- Drop the restrictive trigger that blocks progress
drop trigger if exists trg_enforce_status_step_sync on intent_workflows;

-- Drop the restrictive function
drop function if exists enforce_status_step_sync();

-- Keep the basic CHECK constraint for step bounds (1-10)
-- Keep the index for performance
-- Keep the current_step column

-- Migration complete
-- Workflow can now progress through legitimate state transitions
