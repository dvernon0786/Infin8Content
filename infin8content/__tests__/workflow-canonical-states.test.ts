/**
 * Test suite to verify sealed FSM workflow states and prevent regression
 * 
 * This test suite enforces the mathematically sealed FSM architecture
 * with zero semantic ambiguity and single source of truth.
 */

import { 
  WORKFLOW_STEP_ORDER,
  ALL_WORKFLOW_STATES,
  assertValidWorkflowState
} from '../lib/constants/intent-workflow-steps'
import type { WorkflowState } from '../lib/fsm/workflow-events'

// Add global Jest types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidWorkflowState(): R
    }
  }
}

// Extend Jest matchers
expect.extend({
  toBeValidWorkflowState(received: string) {
    const pass = (() => {
      try {
        assertValidWorkflowState(received)
        return true
      } catch {
        return false
      }
    })()
    return {
      message: () =>
        `expected ${received} to be a valid workflow state`,
      pass,
    }
  },
})

describe('Sealed FSM Workflow States', () => {
  describe('Single Source of Truth - FSM Architecture', () => {
    test('should have exactly 10 workflow states (9 steps + 1 terminal)', () => {
      expect(ALL_WORKFLOW_STATES).toHaveLength(10)
    })

    test('should have 9 execution steps plus 1 terminal state', () => {
      expect(WORKFLOW_STEP_ORDER).toHaveLength(9)
      expect(ALL_WORKFLOW_STATES).toContain('completed')
      // ❌ NO failed state - FSM is mathematically sealed
      expect(ALL_WORKFLOW_STATES).not.toContain('failed')
    })

    test('should have correct FSM step progression', () => {
      // ✅ FSM-aligned progression - no step_0_auth
      expect(WORKFLOW_STEP_ORDER[0]).toBe('step_1_icp')
      expect(WORKFLOW_STEP_ORDER[1]).toBe('step_2_competitors')
      expect(WORKFLOW_STEP_ORDER[2]).toBe('step_3_seeds') // ✅ FSM state
      expect(WORKFLOW_STEP_ORDER[8]).toBe('step_9_articles')
    })

    test('should contain only FSM-defined states', () => {
      const fsmStates: WorkflowState[] = [
        'step_1_icp',
        'step_2_competitors', 
        'step_3_seeds',
        'step_4_longtails',
        'step_5_filtering',
        'step_6_clustering',
        'step_7_validation',
        'step_8_subtopics',
        'step_9_articles',
        'completed'
      ]

      fsmStates.forEach(state => {
        expect(ALL_WORKFLOW_STATES).toContain(state)
      })

      // ❌ NO legacy states
      expect(ALL_WORKFLOW_STATES).not.toContain('step_0_auth')
      expect(ALL_WORKFLOW_STATES).not.toContain('step_3_keywords')
      expect(ALL_WORKFLOW_STATES).not.toContain('failed')
    })
  })

  describe('FSM Runtime Validation', () => {
    test('should accept valid FSM workflow states', () => {
      expect(() => assertValidWorkflowState('step_1_icp')).not.toThrow()
      expect(() => assertValidWorkflowState('step_3_seeds')).not.toThrow() // ✅ FSM state
      expect(() => assertValidWorkflowState('completed')).not.toThrow()
    })

    test('should reject invalid workflow states', () => {
      expect(() => assertValidWorkflowState('invalid_step')).toThrow('🚨 Invalid workflow status emitted: invalid_step')
      // ❌ NO legacy states allowed
      expect(() => assertValidWorkflowState('step_0_auth')).toThrow()
      expect(() => assertValidWorkflowState('step_3_keywords')).toThrow()
      expect(() => assertValidWorkflowState('failed')).toThrow()
    })

    test('should enforce FSM state boundaries', () => {
      // All valid states should pass validation
      ALL_WORKFLOW_STATES.forEach(state => {
        expect(state).toBeValidWorkflowState()
      })
    })
  })

  
  describe('FSM Mathematical Properties', () => {
    test('should have deterministic state ordering', () => {
      const expectedOrder = [
        'step_1_icp',
        'step_2_competitors',
        'step_3_seeds',
        'step_4_longtails',
        'step_5_filtering',
        'step_6_clustering',
        'step_7_validation',
        'step_8_subtopics',
        'step_9_articles'
      ]

      expect(WORKFLOW_STEP_ORDER).toEqual(expectedOrder)
    })

    test('should have single terminal state', () => {
      const terminalStates = ALL_WORKFLOW_STATES.filter(state => !WORKFLOW_STEP_ORDER.includes(state))
      expect(terminalStates).toHaveLength(1)
      expect(terminalStates[0]).toBe('completed')
    })

    test('should maintain FSM consistency', () => {
      // All step order states should be in all states
      WORKFLOW_STEP_ORDER.forEach(step => {
        expect(ALL_WORKFLOW_STATES).toContain(step)
      })

      // Step order should not include terminal state
      expect(WORKFLOW_STEP_ORDER).not.toContain('completed')
    })
  })

  describe('Regression Prevention', () => {
    test('should prevent re-introduction of legacy states', () => {
      // These tests will fail if anyone tries to add back legacy states
      expect(ALL_WORKFLOW_STATES).not.toContain('step_0_auth')
      expect(ALL_WORKFLOW_STATES).not.toContain('step_3_keywords')
      expect(ALL_WORKFLOW_STATES).not.toContain('failed')
      
      expect(WORKFLOW_STEP_ORDER).not.toContain('step_0_auth')
      expect(WORKFLOW_STEP_ORDER).not.toContain('step_3_keywords')
    })

    test('should prevent semantic drift in state names', () => {
      // Ensure no synonyms or variations exist
      const stateStrings = ALL_WORKFLOW_STATES.join(' ')
      expect(stateStrings).not.toContain('status')
      expect(stateStrings).not.toContain('current_step')
      expect(stateStrings).not.toContain('workflow_data')
    })
  })
})
