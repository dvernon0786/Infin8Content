import { createServiceRoleClient } from '@/lib/supabase/server'
import { WorkflowState, WorkflowEvent } from './workflow-events'
import { WorkflowTransitions } from './workflow-machine'

const AllowedResetStates: WorkflowState[] = [
  'step_1_icp',
  'step_2_competitors',
  'step_3_seeds',
  'step_4_longtails',
  'step_5_filtering',
  'step_6_clustering',
  'step_7_validation'
]

export class WorkflowFSM {
  static async getCurrentState(workflowId: string): Promise<WorkflowState> {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('intent_workflows')
      .select('state')
      .eq('id', workflowId)
      .single() as { data: { state: string } | null; error: any }

    if (error || !data) {
      throw new Error('Workflow not found')
    }

    return data.state as WorkflowState
  }

  static getAllowedEvents(state: WorkflowState): WorkflowEvent[] {
    return Object.keys(WorkflowTransitions[state] || {}) as WorkflowEvent[]
  }

  static canTransition(state: WorkflowState, event: WorkflowEvent): boolean {
    return !!WorkflowTransitions[state]?.[event]
  }

  static async transition(
    workflowId: string,
    event: WorkflowEvent,
    options?: { resetTo?: WorkflowState; userId?: string }
  ): Promise<WorkflowState> {

    const supabase = createServiceRoleClient()

    const currentState = await this.getCurrentState(workflowId)

    // 🔒 Prevent resetting completed workflows
    if (currentState === 'completed' && event === 'HUMAN_RESET') {
      throw new Error('Cannot reset completed workflow')
    }

    let nextState: WorkflowState | undefined

    // 🔁 HUMAN RESET
    if (event === 'HUMAN_RESET') {
      if (!options?.resetTo) {
        throw new Error('HUMAN_RESET requires resetTo')
      }

      if (!AllowedResetStates.includes(options.resetTo)) {
        throw new Error('Invalid reset target')
      }

      nextState = options.resetTo
    } else {
      nextState = WorkflowTransitions[currentState]?.[event]
    }

    if (!nextState) {
      throw new Error(`Invalid transition: ${currentState} -> ${event}`)
    }

    // 🟢 Idempotency shortcut
    if (currentState === nextState) {
      return currentState
    }

    // 🔒 Atomic update
    const { data, error } = await supabase
      .from('intent_workflows')
      .update({ state: nextState })
      .eq('id', workflowId)
      .eq('state', currentState)
      .select('state')
      .single()

    if (error || !data) {

      // ⚠️ Possible concurrent modification — re-check state
      const { data: latest } = await supabase
        .from('intent_workflows')
        .select('state')
        .eq('id', workflowId)
        .single() as { data: { state: string } | null; error: any }

      if (!latest) {
        throw new Error('Workflow missing during transition reconciliation')
      }

      // If state changed, another worker transitioned it.
      if (latest.state !== currentState) {
        return latest.state as WorkflowState
      }

      // If still same state, something is genuinely wrong
      throw new Error('FSM transition failed unexpectedly')
    }

    // 📜 Audit log (non-blocking safe)
    try {
      await supabase.from('workflow_state_transitions').insert({
        workflow_id: workflowId,
        previous_state: currentState,
        event,
        next_state: nextState,
        triggered_by: options?.userId ?? null,
        created_at: new Date().toISOString()
      })
    } catch (auditError) {
      // Never fail transition due to audit log
      console.warn('[FSM] Audit log failed:', auditError)
    }

    return nextState
  }
}
