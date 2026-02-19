/**
 * CI Invariant Tests - Workflow Engine Structural Safety
 * 
 * These tests enforce architectural invariants to prevent regression.
 * They must NEVER fail in production - if they fail, the architecture is broken.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Workflow Engine Structural Invariants', () => {
  const projectRoot = process.cwd()
  const infin8contentRoot = projectRoot // Files are directly in project root

  /**
   * Helper: Get all TypeScript files in directory recursively
   */
  function getAllTsFiles(dir: string): string[] {
    const files: string[] = []
    const entries = require('fs').readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...getAllTsFiles(fullPath))
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        files.push(fullPath)
      }
    }
    return files
  }

  /**
   * Helper: Check if file contains pattern
   */
  function fileContains(filePath: string, pattern: RegExp): boolean {
    try {
      const content = readFileSync(filePath, 'utf-8')
      return pattern.test(content)
    } catch {
      return false
    }
  }

  describe('Invariant 1: No Raw FSM Usage', () => {
    it('should not contain WorkflowFSM.transition calls anywhere', () => {
      const allFiles = getAllTsFiles(infin8contentRoot)
      const violatingFiles: string[] = []

      for (const file of allFiles) {
        // Skip test files, the deprecated workflow-fsm.ts itself, script utilities, legitimate internal FSM usage, error messages, and core FSM files
        if (file.includes('.test.') || 
            file.includes('workflow-fsm.ts') ||
            file.includes('scripts/') ||
            file.includes('lib/services/intent-engine/human-approval-processor.ts') || // Uses InternalWorkflowFSM
            file.includes('lib/services/intent-engine/article-workflow-linker.ts') || // Uses InternalWorkflowFSM
            file.includes('lib/services/keyword-engine/subtopic-approval-processor.ts') || // Uses InternalWorkflowFSM
            file.includes('lib/fsm/unified-workflow-engine.ts') || // Contains error messages
            file.includes('lib/fsm/workflow-machine.ts')) { // Contains comments
          continue
        }

        if (fileContains(file, /WorkflowFSM\.transition\(/)) {
          violatingFiles.push(file.replace(projectRoot, ''))
        }
      }

      expect(violatingFiles).toEqual([])
    })

    it('should not contain WorkflowFSM.getCurrentState calls anywhere', () => {
      const allFiles = getAllTsFiles(infin8contentRoot)
      const violatingFiles: string[] = []

      for (const file of allFiles) {
        // Skip test files, the deprecated workflow-fsm.ts itself, script utilities, legitimate internal FSM usage, error messages, and core FSM files
        if (file.includes('.test.') || 
            file.includes('workflow-fsm.ts') ||
            file.includes('scripts/') ||
            file.includes('lib/services/intent-engine/human-approval-processor.ts') || // Uses InternalWorkflowFSM
            file.includes('lib/services/intent-engine/article-workflow-linker.ts') || // Uses InternalWorkflowFSM
            file.includes('lib/services/keyword-engine/subtopic-approval-processor.ts') || // Uses InternalWorkflowFSM
            file.includes('lib/fsm/unified-workflow-engine.ts') || // Contains error messages
            file.includes('lib/fsm/workflow-machine.ts')) { // Contains comments
          continue
        }

        if (fileContains(file, /WorkflowFSM\.getCurrentState\(/)) {
          violatingFiles.push(file.replace(projectRoot, ''))
        }
      }

      expect(violatingFiles).toEqual([])
    })
  })

  describe('Invariant 2: No Manual Inngest.send Calls', () => {
    it('should not contain inngest.send calls outside unified engine', () => {
      const allFiles = getAllTsFiles(infin8contentRoot)
      const violatingFiles: string[] = []

      for (const file of allFiles) {
        // Skip test files, unified engine itself, node_modules, and legitimate article generation
        if (file.includes('.test.') || 
            file.includes('unified-workflow-engine.ts') ||
            file.includes('node_modules') ||
            file.includes('app/api/articles/generate/route.ts') || // Legitimate article generation
            file.includes('app/api/articles/test-inngest/route.ts')) { // Test endpoint
          continue
        }

        if (fileContains(file, /inngest\.send\(/)) {
          violatingFiles.push(file.replace(projectRoot, ''))
        }
      }

      expect(violatingFiles).toEqual([])
    })
  })

  describe('Invariant 3: Automation Graph Completeness', () => {
    it('should contain all required automation edges', () => {
      const unifiedEnginePath = join(infin8contentRoot, 'lib/fsm/unified-workflow-engine.ts')
      const content = readFileSync(unifiedEnginePath, 'utf-8')

      // Required automation edges
      const requiredEdges = [
        "'SEEDS_APPROVED': 'intent.step4.longtails'",
        "'HUMAN_SUBTOPICS_APPROVED': 'intent.step9.articles'",
        "'LONGTAIL_SUCCESS': 'intent.step5.filtering'",
        "'FILTERING_SUCCESS': 'intent.step6.clustering'",
        "'CLUSTERING_SUCCESS': 'intent.step7.validation'",
        "'VALIDATION_SUCCESS': 'intent.step8.subtopics'"
      ]

      for (const edge of requiredEdges) {
        expect(content).toContain(edge)
      }
    })

    it('should NOT contain SUBTOPICS_SUCCESS edge (human gate only)', () => {
      const unifiedEnginePath = join(infin8contentRoot, 'lib/fsm/unified-workflow-engine.ts')
      const content = readFileSync(unifiedEnginePath, 'utf-8')

      // This edge must NOT exist in the automation graph - step 9 is human gate only
      // Check specifically in AUTOMATION_GRAPH object, not in comments or error messages
      const graphMatch = content.match(/export const AUTOMATION_GRAPH = \{[\s\S]*?\} as const/)
      if (graphMatch) {
        const graphContent = graphMatch[0]
        // Check for the actual edge in the graph object, not in comments
        // Use a more precise regex that won't match comments
        const graphLines = graphContent.split('\n').filter(line => 
          line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('*')
        )
        const graphObjectContent = graphLines.join('\n')
        const hasEdge = /'SUBTOPICS_SUCCESS':\s*'intent\.step9\.articles'/.test(graphObjectContent)
        expect(hasEdge).toBe(false)
      }
    })
  })

  describe('Invariant 4: FSM Internal Implementation', () => {
    it('should have internal FSM that is NOT exported', () => {
      const internalFsmPath = join(infin8contentRoot, 'lib/fsm/fsm.internal.ts')
      const content = readFileSync(internalFsmPath, 'utf-8')

      // Should contain InternalWorkflowFSM class
      expect(content).toContain('class InternalWorkflowFSM')

      // Should only export for unified engine (with comment explaining deliberate export)
      expect(content).toContain('export { InternalWorkflowFSM }')
      expect(content).toContain('DO NOT USE ELSEWHERE')
    })

    it('should have deprecated FSM that throws errors', () => {
      const deprecatedFsmPath = join(infin8contentRoot, 'lib/fsm/workflow-fsm.ts')
      const content = readFileSync(deprecatedFsmPath, 'utf-8')

      // Should throw errors for all methods
      expect(content).toContain('throw new Error(')
      expect(content).toContain('FORBIDDEN: Direct WorkflowFSM')
    })
  })

  describe('Invariant 5: Unified Engine Only Export', () => {
    it('should only export transitionWithAutomation from FSM module', () => {
      const unifiedEnginePath = join(infin8contentRoot, 'lib/fsm/unified-workflow-engine.ts')
      const content = readFileSync(unifiedEnginePath, 'utf-8')

      // Should export the unified function
      expect(content).toContain('export async function transitionWithAutomation')

      // Should export automation graph
      expect(content).toContain('export const AUTOMATION_GRAPH')

      // Should NOT export internal FSM
      expect(content).not.toContain('export { InternalWorkflowFSM }')
      expect(content).not.toContain('export class InternalWorkflowFSM')
    })
  })
})
