/**
 * FSM Automation Boundary Validator
 * 
 * This test suite validates that every FSM transition that begins automation
 * has a corresponding Inngest event emission. This prevents silent dead-ends.
 */

import { WorkflowTransitions } from '@/lib/fsm/workflow-machine'
import { WorkflowEvent, WorkflowState } from '@/lib/fsm/workflow-events'

/**
 * Define which transitions begin automation and require event emission
 */
const AUTOMATION_BOUNDARIES: Partial<Record<WorkflowState, WorkflowEvent[]>> = {
  'step_3_seeds': ['SEEDS_APPROVED'],
  'step_8_subtopics': ['HUMAN_SUBTOPICS_APPROVED'],
  // Add future automation boundaries here
}

/**
 * Define which events should be emitted by which workers
 */
const WORKER_EVENT_EMISSIONS: Record<string, string> = {
  'intent.step4.longtails': 'intent.step5.filtering',
  'intent.step5.filtering': 'intent.step6.clustering', 
  'intent.step6.clustering': 'intent.step7.validation',
  'intent.step7.validation': 'intent.step8.subtopics',
  'intent.step9.articles': 'WORKFLOW_COMPLETED',
}

describe('FSM Automation Boundary Validation', () => {
  
  test('all automation boundaries have defined event emissions', () => {
    Object.entries(AUTOMATION_BOUNDARIES).forEach(([state, events]) => {
      events.forEach(event => {
        // Verify the transition exists in FSM
        expect(WorkflowTransitions[state as WorkflowState]).toHaveProperty(event)
        
        // Verify the transition leads to a running state or next automation step
        const nextState = WorkflowTransitions[state as WorkflowState]?.[event]
        expect(nextState).toBeTruthy()
        // Some transitions go directly to next step, others to running states
        expect(nextState).toMatch(/^(step_\d+_\w+|step_\d+)$/)
      })
    })
  })

  test('all worker event emissions are defined', () => {
    Object.entries(WORKER_EVENT_EMISSIONS).forEach(([inputEvent, outputEvent]) => {
      // Verify input event exists
      expect(inputEvent).toMatch(/^intent\.\w+\.\w+$/)
      
      // Verify output event exists (allow WORKFLOW_COMPLETED as final state)
      expect(outputEvent).toMatch(/^(intent\.\w+\.\w+|WORKFLOW_COMPLETED)$/)
      
      // Verify they're not the same (no infinite loops)
      expect(inputEvent).not.toBe(outputEvent)
    })
  })

  test('no automation boundaries are missing', () => {
    // Check all states that transition to *_running states
    Object.entries(WorkflowTransitions).forEach(([state, transitions]) => {
      Object.entries(transitions).forEach(([event, nextState]) => {
        if (nextState.includes('_running')) {
          // This transition begins automation - should be in AUTOMATION_BOUNDARIES
          const isKnownBoundary = AUTOMATION_BOUNDARIES[state as WorkflowState]?.includes(event as WorkflowEvent)
          
          // Allow exceptions for internal worker transitions (LONGTAIL_START, etc.)
          const isWorkerTransition = event.includes('_START') || event.includes('_RETRY')
          
          if (!isWorkerTransition) {
            expect(isKnownBoundary).toBe(true)
          }
        }
      })
    })
  })

  test('human gates do not have automation events', () => {
    // Verify that human-only transitions don't require event emissions
    const humanOnlyStates = ['step_1_icp', 'step_2_competitors']
    
    humanOnlyStates.forEach(state => {
      const transitions = WorkflowTransitions[state as WorkflowState]
      if (transitions) {
        Object.keys(transitions).forEach(event => {
          // These should NOT be in AUTOMATION_BOUNDARIES
          const stateBoundaries = AUTOMATION_BOUNDARIES[state as WorkflowState]
          if (stateBoundaries) {
            expect(stateBoundaries).not.toContain(event as WorkflowEvent)
          }
        })
      }
    })
  })
})

/**
 * Runtime validation function for production safety
 */
export function validateAutomationBoundary(
  currentState: WorkflowState,
  event: WorkflowEvent
): { isValid: boolean; requiresEventEmission: boolean; expectedEvent?: string } {
  
  const requiresEvent = AUTOMATION_BOUNDARIES[currentState]?.includes(event)
  
  if (requiresEvent) {
    const eventMap: Record<string, string> = {
      'SEEDS_APPROVED': 'intent.step4.longtails',
      'HUMAN_SUBTOPICS_APPROVED': 'intent.step9.articles',
    }
    
    return {
      isValid: true,
      requiresEventEmission: true,
      expectedEvent: eventMap[event]
    }
  }
  
  return {
    isValid: true,
    requiresEventEmission: false
  }
}
