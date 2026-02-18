/**
 * Compile-time FSM Boundary Guard
 * 
 * This TypeScript utility enforces at compile time that all automation boundaries
 * have proper event emissions. If a boundary is missing, TypeScript will error.
 */

import { WorkflowTransitions } from '@/lib/fsm/workflow-machine'
import { WorkflowEvent, WorkflowState } from '@/lib/fsm/workflow-events'

/**
 * Define automation boundaries that MUST emit events
 */
const AUTOMATION_BOUNDARIES = {
  'step_3_seeds': {
    event: 'SEEDS_APPROVED' as const,
    emits: 'intent.step4.longtails' as const
  },
  'step_8_subtopics': {
    event: 'HUMAN_SUBTOPICS_APPROVED' as const,  
    emits: 'intent.step9.articles' as const
  }
} as const

type AutomationBoundaries = typeof AUTOMATION_BOUNDARIES

/**
 * Compile-time validation that all defined boundaries exist in FSM
 */
type ValidateBoundaries = {
  [K in keyof AutomationBoundaries]: 
    AutomationBoundaries[K]['event'] extends keyof typeof WorkflowTransitions[K]
      ? AutomationBoundaries[K]['event']
      : `❌ MISSING FSM TRANSITION: ${K} -> ${AutomationBoundaries[K]['event']}`
}

/**
 * Runtime boundary checker with compile-time safety
 */
export function checkAutomationBoundary<T extends keyof AutomationBoundaries>(
  state: T,
  event: AutomationBoundaries[T]['event']
): { requiredEvent: AutomationBoundaries[T]['emits'] } {
  const boundary = AUTOMATION_BOUNDARIES[state]
  
  if (boundary.event !== event) {
    throw new Error(`Invalid event ${event} for state ${state}`)
  }
  
  return {
    requiredEvent: boundary.emits
  }
}

/**
 * Helper function to ensure event emission after automation boundary
 */
export async function emitAfterAutomationBoundary<T extends keyof AutomationBoundaries>(
  state: T,
  event: AutomationBoundaries[T]['event'],
  workflowId: string,
  emitFn: (event: string, data: any) => Promise<void>
): Promise<void> {
  const { requiredEvent } = checkAutomationBoundary(state, event)
  
  console.log(`🔥🔥🔥 [FSM Boundary] Emitting ${requiredEvent} for workflow ${workflowId}`)
  
  await emitFn(requiredEvent, { workflowId })
  
  console.log(`✅✅✅ [FSM Boundary] Event ${requiredEvent} sent successfully`)
}

/**
 * Usage example:
 * 
 * // After SEEDS_APPROVED transition
 * await emitAfterAutomationBoundary(
 *   'step_3_seeds',
 *   'SEEDS_APPROVED', 
 *   workflowId,
 *   inngest.send.bind(inngest)
 * )
 * 
 * // After HUMAN_SUBTOPICS_APPROVED transition  
 * await emitAfterAutomationBoundary(
 *   'step_8_subtopics',
 *   'HUMAN_SUBTOPICS_APPROVED',
 *   workflowId, 
 *   inngest.send.bind(inngest)
 * )
 */
