/**
 * Research Agent Status Updater
 * Story B-2: Research Agent Service
 * 
 * Handles section status transitions during research process
 * Server-only execution with proper error handling
 */

import { createClient } from '@supabase/supabase-js'
import { SectionStatus } from '../../../types/article'
import { ResearchAgentOutput } from './research-agent'

/**
 * Server-only guard - works in both Node.js and Edge runtimes
 */
function assertServerContext(): void {
  if (typeof window !== 'undefined') {
    throw new Error('Research agent updater used in browser context')
  }
  
  // Additional Edge runtime guard
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtimes are server-only but have different constraints
    // This is still safe for admin client usage
  }
}

/**
 * Create admin client with server-only guard
 */
function createAdminClient() {
  assertServerContext()
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface UpdateSectionStatusParams {
  sectionId: string
  status: SectionStatus
  errorDetails?: Record<string, unknown>
}

export type UpdateResult = 
  | { ok: true }
  | { ok: false; error: Error }

/**
 * Update section status in database
 * 
 * @param params - Section ID and new status
 * @returns Success indicator with detailed error information
 */
export async function updateSectionStatus(
  params: UpdateSectionStatusParams
): Promise<UpdateResult> {
  try {
    assertServerContext()
    const supabaseAdmin = createAdminClient()
    
    const updateData: any = {
      status: params.status,
      updated_at: new Date().toISOString()
    }

    if (params.errorDetails) {
      updateData.error_details = params.errorDetails
    }

    const { error } = await supabaseAdmin
      .from('article_sections')
      .update(updateData)
      .eq('id', params.sectionId)

    if (error) {
      return { ok: false, error: new Error(`Database error: ${error.message}`) }
    }

    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * Update section with research results
 * 
 * @param sectionId - Section ID
 * @param researchPayload - Research results from Perplexity
 * @returns Success indicator with detailed error information
 */
export async function updateSectionWithResearch(
  sectionId: string,
  researchPayload: ResearchAgentOutput
): Promise<UpdateResult> {
  try {
    assertServerContext()
    const supabaseAdmin = createAdminClient()
    
    const { error } = await supabaseAdmin
      .from('article_sections')
      .update({
        research_payload: researchPayload,
        status: 'researched' as SectionStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', sectionId)

    if (error) {
      return { ok: false, error: new Error(`Database error: ${error.message}`) }
    }

    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * Mark section as researching
 * 
 * @param sectionId - Section ID
 * @returns Success indicator with detailed error information
 */
export async function markSectionResearching(sectionId: string): Promise<UpdateResult> {
  return updateSectionStatus({
    sectionId,
    status: 'researching'
  })
}

/**
 * Mark section as researched with results
 * 
 * @param sectionId - Section ID
 * @param researchPayload - Research results
 * @returns Success indicator with detailed error information
 */
export async function markSectionResearched(
  sectionId: string,
  researchPayload: ResearchAgentOutput
): Promise<UpdateResult> {
  return updateSectionWithResearch(sectionId, researchPayload)
}

/**
 * Mark section as failed with error details
 * 
 * @param sectionId - Section ID
 * @param error - Error that occurred
 * @returns Success indicator with detailed error information
 */
export async function markSectionFailed(
  sectionId: string,
  error: unknown
): Promise<UpdateResult> {
  const errorDetails = {
    message: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
    type: 'research_error'
  }

  return updateSectionStatus({
    sectionId,
    status: 'failed',
    errorDetails
  })
}
