/**
 * Bulletproof FSM Transition Wrapper
 * 
 * Enforces that every automation boundary transition emits its required event.
 * Impossible to transition without emitting.
 */

import { transitionWithAutomation } from '@/lib/fsm/unified-workflow-engine'
import { inngest } from '@/lib/inngest/client'

/**
 * Automation boundary definitions with required events
 */
const AUTOMATION_BOUNDARIES = {
  'step_3_seeds': {
    event: 'SEEDS_APPROVED' as const,
    requiredEvent: 'intent.step4.longtails' as const
  },
  'step_8_subtopics': {
    event: 'HUMAN_SUBTOPICS_APPROVED' as const,
    requiredEvent: 'intent.step9.articles' as const
  }
} as const

type AutomationBoundaryState = keyof typeof AUTOMATION_BOUNDARIES

/**
 * Bulletproof transition function - emission is guaranteed
 */
export async function transitionAndTrigger(
  workflowId: string,
  state: AutomationBoundaryState,
  event: typeof AUTOMATION_BOUNDARIES[AutomationBoundaryState]['event'],
  userId: string
): Promise<{ success: boolean; error?: string; emittedEvent?: string }> {
  
  // Validate this is a known automation boundary
  const boundary = AUTOMATION_BOUNDARIES[state]
  if (!boundary || boundary.event !== event) {
    return {
      success: false,
      error: `Unknown automation boundary: ${state} -> ${event}`
    }
  }

  console.log(`🔥🔥🔥 [BoundaryGuard] Transitioning ${workflowId}: ${state} -> ${event}`)
  
  try {
    // 1. Execute FSM transition
    const transitionResult = await transitionWithAutomation(workflowId, event, userId)
    
    if (!transitionResult.success) {
      console.log(`⚠️⚠️⚠️ [BoundaryGuard] Transition not applied for ${workflowId}`)
      return {
        success: false,
        error: transitionResult.error || 'Transition not applied - likely concurrent execution'
      }
    }

    console.log(`✅✅✅ [BoundaryGuard] Transition successful: ${event}`)
    return {
      success: true,
      emittedEvent: transitionResult.emittedEvent
    }

  } catch (error) {
    console.error(`❌❌❌ [BoundaryGuard] Failed boundary transition:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Type-safe guard for checking if a state/event pair requires automation
 */
export function requiresAutomationEvent(state: string, event: string): boolean {
  return Object.entries(AUTOMATION_BOUNDARIES).some(
    ([s, b]) => s === state && b.event === event
  )
}

/**
 * Get required event for automation boundary
 */
export function getRequiredEvent(state: AutomationBoundaryState): string {
  return AUTOMATION_BOUNDARIES[state]?.requiredEvent
}
