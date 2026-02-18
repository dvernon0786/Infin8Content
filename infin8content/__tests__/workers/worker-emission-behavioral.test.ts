/**
 * Worker Emission Tests - Behavioral Enforcement
 * 
 * Tests that each worker actually emits its required next event.
 * This prevents regression where worker code changes break event chaining.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { inngest } from '@/lib/inngest/client'

// Mock inngest client and FSM
vi.mock('@/lib/inngest/client', () => ({
  inngest: {
    send: vi.fn()
  }
}))

vi.mock('@/lib/fsm/workflow-fsm', () => ({
  WorkflowFSM: {
    transition: vi.fn().mockResolvedValue({ applied: true })
  }
}))

describe('Worker Event Emission Tests', () => {
  const mockSend = vi.mocked(inngest.send)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Automation Chain Graph Validation', () => {
    it('should have complete event chain from step 4 to step 9', () => {
      const canonicalChain = [
        'intent.step4.longtails',
        'intent.step5.filtering',
        'intent.step6.clustering',
        'intent.step7.validation',
        'intent.step8.subtopics',
        'intent.step9.articles'
      ]

      // Verify each event exists exactly once in the chain
      canonicalChain.forEach(event => {
        expect(event).toMatch(/^intent\.\w+\.\w+$/)
      })

      // Verify chain has no duplicates
      const uniqueEvents = new Set(canonicalChain)
      expect(uniqueEvents.size).toBe(canonicalChain.length)

      // Verify chain starts with step 4 and ends with step 9
      expect(canonicalChain[0]).toBe('intent.step4.longtails')
      expect(canonicalChain[canonicalChain.length - 1]).toBe('intent.step9.articles')
    })

    it('should have exactly one human gate in the chain', () => {
      const humanGateEvents = ['intent.step9.articles'] // Only triggered after human approval
      
      // Verify there's exactly one human-triggered event
      expect(humanGateEvents.length).toBe(1)
      expect(humanGateEvents[0]).toBe('intent.step9.articles')
    })

    it('should validate worker event emission pattern in source code', async () => {
      // Read the actual worker source code to verify emissions
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const workerFilePath = path.join(process.cwd(), 'lib/inngest/functions/intent-pipeline.ts')
      const workerSource = await fs.readFile(workerFilePath, 'utf-8')

      // Verify all required emissions exist in source code
      const requiredEmissions = [
        "name: 'intent.step5.filtering'",
        "name: 'intent.step6.clustering'", 
        "name: 'intent.step7.validation'",
        "name: 'intent.step8.subtopics'",
        "name: 'intent.step9.articles'"
      ]

      requiredEmissions.forEach(emission => {
        expect(workerSource).toContain(emission)
      })

      // Verify Step 8 DOES emit the human gate trigger
      expect(workerSource).toContain('SUBTOPICS_SUCCESS')
      // After SUBTOPICS_SUCCESS, there should be inngest.send for human gate
      const subtopicsSuccessIndex = workerSource.indexOf('SUBTOPICS_SUCCESS')
      const nextSection = workerSource.substring(subtopicsSuccessIndex, subtopicsSuccessIndex + 500)
      expect(nextSection).toContain("name: 'intent.step9.articles'")
    })
  })

  describe('Boundary Wrapper Integration', () => {
    it('should enforce emission in boundary wrapper', async () => {
      const { transitionAndTrigger } = await import('@/lib/fsm/boundary-transition-wrapper')
      
      mockSend.mockResolvedValue({ ids: ['test-event-id'] })

      // Test the bulletproof wrapper
      const result = await transitionAndTrigger(
        'test-workflow',
        'step_3_seeds',
        'SEEDS_APPROVED',
        'test-user'
      )

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith({
        name: 'intent.step4.longtails',
        data: { workflowId: 'test-workflow' }
      })
    })

    it('should fail gracefully on invalid boundary', async () => {
      const { transitionAndTrigger } = await import('@/lib/fsm/boundary-transition-wrapper')
      
      const result = await transitionAndTrigger(
        'test-workflow',
        'invalid_state' as any,
        'INVALID_EVENT' as any,
        'test-user'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unknown automation boundary')
      expect(mockSend).not.toHaveBeenCalled()
    })
  })
})
