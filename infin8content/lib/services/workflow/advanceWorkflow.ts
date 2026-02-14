/**
 * Unified Workflow State Engine
 * Single Source of Truth: intent_workflows.state
 *
 * This utility enforces:
 * - Legal transitions only
 * - Atomic state changes
 * - No skipping
 * - No silent failures
 * - No race conditions
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { WorkflowState, isLegalTransition } from '@/types/workflow-state'

interface AdvanceWorkflowParams {
  workflowId: string
  organizationId: string
  expectedState: WorkflowState
  nextState: WorkflowState
}

export class WorkflowTransitionError extends Error {
  constructor(
    message: string,
    public readonly currentState?: string,
    public readonly expectedState?: string,
    public readonly attemptedState?: string
  ) {
    super(message)
    this.name = 'WorkflowTransitionError'
  }
}

export async function advanceWorkflow({
  workflowId,
  organizationId,
  expectedState,
  nextState
}: AdvanceWorkflowParams): Promise<void> {

  // 1️⃣ Enforce legal transition
  if (!isLegalTransition(expectedState, nextState)) {
    throw new WorkflowTransitionError(
      `Illegal transition attempted: ${expectedState} → ${nextState}`,
      expectedState,
      undefined,
      nextState
    )
  }

  const supabase = createServiceRoleClient()

  // 2️⃣ Atomic guarded update
  const { data, error } = await supabase
    .from('intent_workflows')
    .update({
      state: nextState,
      updated_at: new Date().toISOString()
    })
    .eq('id', workflowId)
    .eq('organization_id', organizationId)
    .eq('state', expectedState) // prevents race conditions
    .select('id')

  if (error) {
    throw new WorkflowTransitionError(
      `Workflow transition failed: ${error.message}`,
      expectedState,
      expectedState,
      nextState
    )
  }

  // 3️⃣ Prevent silent failure (critical)
  if (!data || data.length === 0) {
    throw new WorkflowTransitionError(
      `Transition rejected. Workflow not in expected state: ${expectedState}`,
      expectedState,
      expectedState,
      nextState
    )
  }
}
