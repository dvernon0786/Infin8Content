/**
 * Section Research Orchestrator
 * Story B-2: Research Agent Service
 * 
 * Wrapper that handles status transitions around the core research agent.
 * Keeps the research agent pure and testable.
 */

import { runResearchAgent, ResearchAgentInput } from './research-agent'
import { markSectionResearching, markSectionResearched, markSectionFailed, UpdateResult } from './research-agent-updater'

export interface RunSectionResearchInput extends ResearchAgentInput {
  sectionId: string
}

/**
 * Orchestrates the complete research process for a section
 * 
 * @param input - Section details including ID for status updates
 * @returns Research results
 * @throws Error if research fails or status updates fail
 */
export async function runSectionResearch(
  input: RunSectionResearchInput
): Promise<any> {
  const { sectionId, ...researchInput } = input

  // Mark section as researching
  const researchingResult = await markSectionResearching(sectionId)
  if (!researchingResult.ok) {
    throw new Error(`Failed to mark section as researching: ${researchingResult.error.message}`)
  }

  try {
    // Execute core research (pure function)
    const output = await runResearchAgent(researchInput)

    // Persist results and mark as researched
    const researchedResult = await markSectionResearched(sectionId, output)
    if (!researchedResult.ok) {
      throw new Error(`Failed to mark section as researched: ${researchedResult.error.message}`)
    }

    return output
  } catch (error) {
    // Mark as failed with error details
    const failedResult = await markSectionFailed(sectionId, error)
    if (!failedResult.ok) {
      // Log but don't throw - original error is more important
      console.error('Failed to mark section as failed:', failedResult.error)
    }
    throw error
  }
}
