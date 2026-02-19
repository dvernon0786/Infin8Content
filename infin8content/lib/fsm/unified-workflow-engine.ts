/**
 * Unified Workflow Engine - Mathematically Closed Automation
 * 
 * This is the ONLY way transitions should happen.
 * FSM and automation are structurally coupled.
 * No manual inngest.send allowed.
 */

import { InternalWorkflowFSM } from './fsm.internal'
import { inngest } from '@/lib/inngest/client'
import { WorkflowEvent, WorkflowState } from '@/lib/fsm/workflow-events'

/**
 * SINGLE SOURCE OF TRUTH - Automation Graph
 * 
 * Every transition that requires automation is defined here.
 * This is structurally coupled to the FSM machine.
 */
export const AUTOMATION_GRAPH = {
  // Human → Automation boundaries
  'SEEDS_APPROVED': 'intent.step4.longtails',
  'HUMAN_SUBTOPICS_APPROVED': 'intent.step9.articles',
  
  // Worker → Worker chaining
  'LONGTAIL_SUCCESS': 'intent.step5.filtering',
  'FILTERING_SUCCESS': 'intent.step6.clustering',
  'CLUSTERING_SUCCESS': 'intent.step7.validation',
  'VALIDATION_SUCCESS': 'intent.step8.subtopics',
  'ARTICLES_SUCCESS': 'WORKFLOW_COMPLETED',
  // REMOVED: 'SUBTOPICS_SUCCESS': 'intent.step9.articles' - Step 9 is human gate only
  
} as const

export type AutomationEvent = keyof typeof AUTOMATION_GRAPH
export type EmittedEvent = typeof AUTOMATION_GRAPH[AutomationEvent]

/**
 * Get current workflow state (read-only)
 * This is the only way to query workflow state - maintains architectural closure
 */
export async function getWorkflowState(workflowId: string): Promise<WorkflowState> {
  const { InternalWorkflowFSM } = await import('./fsm.internal')
  return await InternalWorkflowFSM.getCurrentState(workflowId)
}

/**
 * Check if an event requires automation
 */
export function requiresAutomation(event: string): event is AutomationEvent {
  return event in AUTOMATION_GRAPH
}

/**
 * Get the required emitted event for an automation trigger
 */
export function getEmittedEvent(event: AutomationEvent): EmittedEvent {
  return AUTOMATION_GRAPH[event]
}

/**
 * UNIFIED TRANSITION FUNCTION - The ONLY way to transition
 * 
 * This function:
 * 1. Executes FSM transition
 * 2. Automatically emits required event if transition applied
 * 3. No manual inngest.send needed anywhere
 * 4. Structural coupling guarantees no missing events
 */
export async function transitionWithAutomation(
  workflowId: string,
  event: WorkflowEvent,
  userId?: string,
  options?: { resetTo?: WorkflowState }
): Promise<{ success: boolean; error?: string; emittedEvent?: string }> {
  
  console.log(`[UnifiedEngine] Transitioning ${workflowId}: ${event}`)
  
  try {
    // 1. Execute FSM transition with options
    const fsmOptions = userId ? { userId, ...(options?.resetTo && { resetTo: options.resetTo }) } : options
    const transitionResult = await InternalWorkflowFSM.transition(workflowId, event, fsmOptions)
    
    if (!transitionResult.applied) {
      console.log(`[UnifiedEngine] Transition not applied for ${workflowId}`)
      return {
        success: false,
        error: 'Transition not applied - likely concurrent execution'
      }
    }

    // 2. Check if this event requires automation
    if (!requiresAutomation(event)) {
      console.log(`[UnifiedEngine] Transition completed (no automation needed): ${event}`)
      return { success: true }
    }

    // 3. AUTOMATIC EMISSION - Guaranteed by structural coupling
    const requiredEvent = getEmittedEvent(event)
    
    console.log(`[UnifiedEngine] Auto-emitting ${requiredEvent} for ${workflowId}`)
    
    await inngest.send({
      name: requiredEvent,
      data: { workflowId }
    })

    console.log(`[UnifiedEngine] Unified transition completed: ${event} → ${requiredEvent}`)
    
    return { 
      success: true, 
      emittedEvent: requiredEvent 
    }

  } catch (error) {
    console.error(`❌❌❌ [UnifiedEngine] Failed unified transition:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * DEPRECATED: Raw FSM transition - throws error to prevent usage
 * 
 * This function exists only to catch accidental usage of raw FSM.
 * All transitions MUST go through transitionWithAutomation.
 */
export async function deprecatedRawTransition(...args: any[]): Promise<never> {
  throw new Error(`
🚨 FORBIDDEN: Raw WorkflowFSM.transition() detected.
   
   All transitions MUST use transitionWithAutomation() to ensure
   automatic event emission and prevent silent stalls.
   
   Replace:
   ❌ await WorkflowFSM.transition(workflowId, 'EVENT')
   
   With:
   ✅ await transitionWithAutomation(workflowId, 'EVENT', userId)
   
   This prevents the original bug class of missing event emissions.
  `)
}
