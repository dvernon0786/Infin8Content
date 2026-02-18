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

export interface TransitionResult {
  ok: boolean
  previousState: WorkflowState
  nextState: WorkflowState
  applied: boolean
  skipped?: boolean
}

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
  ): Promise<TransitionResult> {

    const supabase = createServiceRoleClient()

    const currentState = await this.getCurrentState(workflowId)

    // � DEBUG: Log transition details
    console.log('[FSM TRANSITION DEBUG]', {
      workflowId,
      currentState,
      event,
      allowedEvents: Object.keys(WorkflowTransitions[currentState] || {})
    })

    // �🔒 Prevent resetting completed workflows
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
      // No valid transition - return deterministic result, never throw
      return {
        ok: false,
        previousState: currentState,
        nextState: currentState,
        applied: false
      }
    }

    // 🟢 Idempotency shortcut
    if (currentState === nextState) {
      return {
        ok: true,
        previousState: currentState,
        nextState: currentState,
        applied: false // No change needed
      }
    }

    // 🔍 DEBUG: Verify service role authentication
    console.log('SERVICE ROLE KEY STARTS WITH:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10))
    console.log('SUPABASE URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    
    const testUpdate = await supabase
      .from('intent_workflows')
      .update({ state: 'step_4_longtails_running' })
      .eq('id', workflowId)

    console.log('Manual update test:', testUpdate)

    // 🔒 Atomic compare-and-swap - REQUIRED for safety
    const { data: updated } = await supabase
      .from('intent_workflows')
      .update({ state: nextState })
      .eq('id', workflowId)
      .eq('state', currentState) // 🔒 CRITICAL - restore atomic safety
      .select('state')
      .single()

    if (!updated) {
      // Another worker already acquired the transition - this is expected behavior
      return {
        ok: true,
        applied: false,
        skipped: true,
        previousState: currentState,
        nextState: currentState
      }
    }

    const { data: latest, error: latestError } = await supabase
      .from('intent_workflows')
      .select('state')
      .eq('id', workflowId)
      .single()

    if (latestError || !latest) {
      return {
        ok: false,
        applied: false,
        previousState: currentState,
        nextState: currentState
      }
    }

    return {
      ok: true,
      applied: true,
      previousState: currentState,
      nextState: (latest as any).state as WorkflowState
    }
  }
}
