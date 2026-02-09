/**
 * Test suite to verify canonical workflow states and prevent regression
 */

import { 
  INTENT_WORKFLOW_STEPS,
  WORKFLOW_STEP_ORDER,
  ALL_WORKFLOW_STATES,
  assertValidWorkflowState
} from '../lib/constants/intent-workflow-steps'
import { assertValidWorkflowTransition } from '../lib/inngest/workflow-transition-guard'
import { normalizeWorkflowStatus } from '../lib/utils/normalize-workflow-status'

describe('Canonical Workflow States', () => {
  describe('Single Source of Truth', () => {
    test('should have exactly 12 workflow states', () => {
      expect(ALL_WORKFLOW_STATES).toHaveLength(12)
    })

    test('should have 10 execution steps plus 2 terminal states', () => {
      expect(WORKFLOW_STEP_ORDER).toHaveLength(10)
      expect(ALL_WORKFLOW_STATES).toContain('completed')
      expect(ALL_WORKFLOW_STATES).toContain('failed')
    })

    test('should have correct step progression', () => {
      expect(WORKFLOW_STEP_ORDER[0]).toBe('step_0_auth')
      expect(WORKFLOW_STEP_ORDER[1]).toBe('step_1_icp')
      expect(WORKFLOW_STEP_ORDER[9]).toBe('step_9_articles')
    })
  })

  describe('Runtime Validation', () => {
    test('should accept valid workflow states', () => {
      expect(() => assertValidWorkflowState('step_1_icp')).not.toThrow()
      expect(() => assertValidWorkflowState('completed')).not.toThrow()
      expect(() => assertValidWorkflowState('failed')).not.toThrow()
    })

    test('should reject invalid workflow states', () => {
      expect(() => assertValidWorkflowState('invalid_step')).toThrow('🚨 Invalid workflow status emitted: invalid_step')
      expect(() => assertValidWorkflowState('step_3_seeds')).toThrow('🚨 Invalid workflow status emitted: step_3_seeds')
    })
  })

  describe('Legacy Status Normalization', () => {
    test('should normalize legacy status values', () => {
      expect(normalizeWorkflowStatus('step_3_seeds')).toBe('step_3_keywords')
      expect(normalizeWorkflowStatus('step_4_topics')).toBe('step_4_longtails')
      expect(normalizeWorkflowStatus('step_5_generation')).toBe('step_9_articles')
      expect(normalizeWorkflowStatus('step_8_approval')).toBe('step_8_subtopics')
    })

    test('should pass through canonical status values', () => {
      expect(normalizeWorkflowStatus('step_1_icp')).toBe('step_1_icp')
      expect(normalizeWorkflowStatus('completed')).toBe('completed')
    })
  })

  describe('Transition Validation', () => {
    test('should allow valid linear progression', () => {
      expect(() => assertValidWorkflowTransition('step_1_icp', 'step_2_competitors')).not.toThrow()
      expect(() => assertValidWorkflowTransition('step_8_subtopics', 'step_9_articles')).not.toThrow()
    })

    test('should allow terminal state transitions', () => {
      expect(() => assertValidWorkflowTransition('step_5_filtering', 'completed')).not.toThrow()
      expect(() => assertValidWorkflowTransition('step_9_articles', 'failed')).not.toThrow()
    })

    test('should reject illegal transitions', () => {
      expect(() => assertValidWorkflowTransition('step_1_icp', 'step_3_keywords')).toThrow()
      expect(() => assertValidWorkflowTransition('step_5_filtering', 'step_2_competitors')).toThrow()
    })

    test('should allow idempotent transitions', () => {
      expect(() => assertValidWorkflowTransition('step_1_icp', 'step_1_icp')).not.toThrow()
    })
  })
})
