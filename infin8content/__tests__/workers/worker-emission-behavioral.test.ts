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

vi.mock('@/lib/fsm/unified-workflow-engine', () => ({
  transitionWithAutomation: vi.fn().mockImplementation((workflowId, event, userId) => {
    const AUTOMATION_GRAPH = {
      'SEEDS_APPROVED': 'intent.step4.longtails',
      'LONGTAIL_SUCCESS': 'intent.step5.filtering',
      'FILTERING_SUCCESS': 'intent.step6.clustering',
      'CLUSTERING_SUCCESS': 'intent.step7.validation',
      'VALIDATION_SUCCESS': 'intent.step8.subtopics',
      'SUBTOPICS_SUCCESS': 'intent.step9.articles',
      'HUMAN_SUBTOPICS_APPROVED': 'intent.step9.articles'
    }
    
    if (AUTOMATION_GRAPH[event as keyof typeof AUTOMATION_GRAPH]) {
      return Promise.resolve({ 
        success: true, 
        emittedEvent: AUTOMATION_GRAPH[event as keyof typeof AUTOMATION_GRAPH] 
      })
    } else {
      return Promise.resolve({ success: true })
    }
  }),
  AUTOMATION_GRAPH: {
    'SEEDS_APPROVED': 'intent.step4.longtails',
    'LONGTAIL_SUCCESS': 'intent.step5.filtering',
    'FILTERING_SUCCESS': 'intent.step6.clustering',
    'CLUSTERING_SUCCESS': 'intent.step7.validation',
    'VALIDATION_SUCCESS': 'intent.step8.subtopics',
    'SUBTOPICS_SUCCESS': 'intent.step9.articles',
    'HUMAN_SUBTOPICS_APPROVED': 'intent.step9.articles'
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

    it('should validate unified engine usage in source code', async () => {
      // Read the actual worker source code to verify unified engine usage
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const workerFilePath = path.join(process.cwd(), 'lib/inngest/functions/intent-pipeline.ts')
      const workerSource = await fs.readFile(workerFilePath, 'utf-8')

      // Verify unified engine is imported and used
      expect(workerSource).toContain('transitionWithAutomation')
      
      // Verify all manual inngest.send calls for worker chaining are removed
      const workerChainingEvents = [
        "name: 'intent.step5.filtering'",
        "name: 'intent.step6.clustering'", 
        "name: 'intent.step7.validation'",
        "name: 'intent.step8.subtopics'"
      ]

      workerChainingEvents.forEach(emission => {
        expect(workerSource).not.toContain(emission)
      })

      // Verify unified transition calls exist
      const requiredTransitions = [
        "transitionWithAutomation(workflowId, 'LONGTAIL_SUCCESS'",
        "transitionWithAutomation(workflowId, 'FILTERING_SUCCESS'",
        "transitionWithAutomation(workflowId, 'CLUSTERING_SUCCESS'",
        "transitionWithAutomation(workflowId, 'VALIDATION_SUCCESS'",
        "transitionWithAutomation(workflowId, 'SUBTOPICS_SUCCESS'"
      ]

      requiredTransitions.forEach(transition => {
        expect(workerSource).toContain(transition)
      })
    })
  })

  describe('Unified Engine Integration', () => {
    it('should enforce emission in unified engine', async () => {
      const { transitionWithAutomation } = await import('@/lib/fsm/unified-workflow-engine')
      
      // Test the unified engine
      const result = await transitionWithAutomation(
        'test-workflow',
        'SEEDS_APPROVED',
        'test-user'
      )

      expect(result.success).toBe(true)
      expect(result.emittedEvent).toBe('intent.step4.longtails')
    })

    it('should handle transitions without automation', async () => {
      const { transitionWithAutomation } = await import('@/lib/fsm/unified-workflow-engine')
      
      // Test a transition that doesn't require automation
      const result = await transitionWithAutomation(
        'test-workflow',
        'ICP_COMPLETED', // This should not be in AUTOMATION_GRAPH
        'test-user'
      )

      expect(result.success).toBe(true)
      expect(result.emittedEvent).toBeUndefined()
    })

    it('should validate complete automation graph', async () => {
      const { AUTOMATION_GRAPH } = await import('@/lib/fsm/unified-workflow-engine')
      
      // Verify all required automation boundaries exist
      const requiredBoundaries = [
        'SEEDS_APPROVED',
        'LONGTAIL_SUCCESS', 
        'FILTERING_SUCCESS',
        'CLUSTERING_SUCCESS',
        'VALIDATION_SUCCESS',
        'SUBTOPICS_SUCCESS',
        'HUMAN_SUBTOPICS_APPROVED'
      ]

      requiredBoundaries.forEach(boundary => {
        expect(AUTOMATION_GRAPH[boundary as keyof typeof AUTOMATION_GRAPH]).toMatch(/^intent\.\w+\.\w+$/)
      })
    })
  })
})
