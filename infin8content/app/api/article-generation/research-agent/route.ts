/**
 * Research Agent API Endpoint
 * Story B-2: Research Agent Service
 * 
 * Internal service endpoint for article section research
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { runResearchAgent, ResearchAgentInput } from '@/lib/services/article-generation/research-agent'
import { markSectionResearching, markSectionResearched, markSectionFailed } from '@/lib/services/article-generation/research-agent-updater'
import { logActionAsync } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'

export async function POST(request: NextRequest) {
  try {
    // Authentication required
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const { sectionId, sectionHeader, sectionType, priorSections, organizationContext } = body
    
    if (!sectionId || !sectionHeader || !sectionType || !organizationContext) {
      return NextResponse.json({ 
        error: 'Missing required fields: sectionId, sectionHeader, sectionType, organizationContext' 
      }, { status: 400 })
    }

    // Build research agent input
    const researchInput: ResearchAgentInput = {
      sectionHeader,
      sectionType,
      priorSections: priorSections || [],
      organizationContext
    }

    // Mark section as researching
    const markResult = await markSectionResearching(sectionId)
    if (!markResult.ok) {
      return NextResponse.json({ error: 'Failed to update section status' }, { status: 500 })
    }

    // Log research start
    await logActionAsync({
      orgId: currentUser.org_id,
      userId: currentUser.id,
      action: AuditAction.RESEARCH_AGENT_SECTION_STARTED,
      details: { 
        sectionId, 
        sectionHeader, 
        sectionType,
        organizationName: organizationContext.name 
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    try {
      // Execute research
      const researchResults = await runResearchAgent(researchInput)

      // Update section with research results
      const updateResult = await markSectionResearched(sectionId, researchResults)
      if (!updateResult.ok) {
        throw new Error(`Failed to save research results: ${updateResult.error.message}`)
      }

      // Log research completion
      await logActionAsync({
        orgId: currentUser.org_id,
        userId: currentUser.id,
        action: AuditAction.RESEARCH_AGENT_SECTION_COMPLETED,
        details: { 
          sectionId, 
          sectionHeader, 
          totalSearches: researchResults.totalSearches,
          queriesCount: researchResults.queries.length
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })

      return NextResponse.json({
        success: true,
        data: researchResults
      })

    } catch (researchError) {
      // Mark section as failed
      await markSectionFailed(sectionId, researchError)

      // Log research failure
      await logActionAsync({
        orgId: currentUser.org_id,
        userId: currentUser.id,
        action: AuditAction.RESEARCH_AGENT_SECTION_FAILED,
        details: { 
          sectionId, 
          sectionHeader, 
          error: researchError instanceof Error ? researchError.message : String(researchError)
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })

      throw researchError
    }

  } catch (error) {
    console.error('Research agent API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json({ 
      error: 'Research agent failed',
      details: errorMessage
    }, { status: 500 })
  }
}
