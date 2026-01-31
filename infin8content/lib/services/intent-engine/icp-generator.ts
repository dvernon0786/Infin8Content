/**
 * ICP Generator Service
 * Story 34.1: Generate ICP Document via Perplexity AI
 * 
 * Generates Ideal Customer Profile (ICP) documents using OpenRouter Perplexity API
 * based on organization profile data.
 */

import { generateContent, type OpenRouterMessage } from '@/lib/services/openrouter/openrouter-client'
import { createServiceRoleClient } from '@/lib/supabase/server'

export interface ICPData {
  industries: string[]
  buyerRoles: string[]
  painPoints: string[]
  valueProposition: string
  generatedAt: string
  apiVersion: string
}

export interface ICPGenerationRequest {
  organizationName: string
  organizationUrl: string
  organizationLinkedInUrl: string
}

export interface ICPGenerationResult {
  icp_data: ICPData
  tokensUsed: number
  modelUsed: string
  generatedAt: string
}

/**
 * Generate ICP document using Perplexity API via OpenRouter
 * 
 * @param request - Organization profile data for ICP generation
 * @param organizationId - Organization ID for tracking and storage
 * @returns Generated ICP data with metadata
 */
export async function generateICPDocument(
  request: ICPGenerationRequest,
  organizationId: string,
  timeoutMs: number = 300000 // 5 minutes default
): Promise<ICPGenerationResult> {
  const startTime = Date.now()

  // Validate inputs
  if (!request.organizationName || !request.organizationUrl || !request.organizationLinkedInUrl) {
    throw new Error('Organization name, URL, and LinkedIn URL are required')
  }

  // Validate URL formats
  try {
    new URL(request.organizationUrl)
    new URL(request.organizationLinkedInUrl)
  } catch (e) {
    throw new Error('Invalid URL format for organization_url or organization_linkedin_url')
  }

  // System prompt for ICP analysis
  const systemPrompt = `## Role
You are an expert Business Intelligence Analyst specializing in creating comprehensive Ideal Customer Profile (ICP) analyses.
Your purpose is to research and analyze companies to develop detailed customer personas, pain points, and market positioning insights for strategic business development.

## Constraints
- Must research all three provided inputs (company name, URL, LinkedIn URL) thoroughly
- Generate specific, actionable ICP insights rather than generic business descriptions
- Focus on B2B customer characteristics and pain points
- Ensure all sections are completed with detailed, research-backed information
- Maintain professional business analysis tone throughout
- Base conclusions on actual company data found through research
- If insufficient data is found, clearly indicate limitations and provide best estimates
- Do not make assumptions about company operations without supporting evidence`

  // User prompt with organization data
  const userPrompt = `## Inputs
- **Company Name** (required): ${request.organizationName}
- **Company URL** (required): ${request.organizationUrl}
- **Company LinkedIn URL** (required): ${request.organizationLinkedInUrl}

## Instructions

### Research Phase:
1. Search for comprehensive company information using the company name and URL
2. Analyze the company's website to understand their products, services, and target market
3. Research the company's LinkedIn presence for additional business insights
4. Gather information about company size, industry, and business model
5. Identify key stakeholders and decision-makers from available sources

### Analysis Phase:
1. Synthesize research findings to create detailed ICP components
2. Develop specific product/service descriptions based on actual offerings
3. Identify target customer segments based on company positioning
4. Analyze market challenges the company's customers likely face
5. Determine customer objectives and current solution approaches

### Output Generation:
Generate a comprehensive ICP analysis with the following five sections:

1. **Product Description**
   - Detailed explanation of the company's core product or service offering
   - Key features and benefits that differentiate the solution
   - Implementation approach and delivery method
   - Target use cases and applications

2. **Who are the ICP?**
   - Specific business characteristics (size, revenue, industry)
   - Geographic and operational details
   - Key decision-maker roles and demographics
   - Organizational structure and team composition

3. **Pain Points / Challenges**
   - Primary operational challenges faced by target customers
   - Technical or process limitations in current state
   - Resource constraints and capability gaps
   - Market or competitive pressures affecting the business

4. **Key Goals / Objectives**
   - Strategic business objectives driving purchasing decisions
   - Operational improvements sought by target customers
   - Performance metrics and success criteria
   - Growth and scaling aspirations

5. **How do they currently solve their problems?**
   - Existing tools, systems, and processes in use
   - Workarounds and manual solutions currently employed
   - Current solution limitations and gaps

## Error Handling
- If company information is limited or unclear, indicate data limitations and provide analysis based on available information
- If the company URL is inaccessible, focus research on company name and LinkedIn data
- If LinkedIn URL provides minimal information, supplement with additional web searches
- If the company operates in an unfamiliar industry, research industry standards and common practices
- If conflicting information is found across sources, prioritize the most recent and authoritative data
- If the company appears to serve multiple market segments, identify the primary ICP and note secondary segments

## Output Format
Return a JSON object with the following structure:
{
  "industries": ["industry1", "industry2", ...],
  "buyerRoles": ["role1", "role2", ...],
  "painPoints": ["pain point 1", "pain point 2", ...],
  "valueProposition": "Clear statement of value proposition for the ICP"
}`

  // Call OpenRouter API with Perplexity model
  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]

  try {
    // Wrap API call with timeout enforcement
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`ICP generation timeout: exceeded ${timeoutMs}ms limit`))
      }, timeoutMs)
    })

    const result = await Promise.race([
      generateContent(messages, {
        maxTokens: 2000,
        temperature: 0.7,
        maxRetries: 2,
        model: 'perplexity/llama-3.1-sonar-small-128k-online'
      }),
      timeoutPromise
    ])

    // Parse JSON response
    let icpData: ICPData
    try {
      const parsed = JSON.parse(result.content)
      icpData = {
        industries: parsed.industries || [],
        buyerRoles: parsed.buyerRoles || [],
        painPoints: parsed.painPoints || [],
        valueProposition: parsed.valueProposition || '',
        generatedAt: new Date().toISOString(),
        apiVersion: '1.0'
      }
    } catch (parseError) {
      throw new Error(`Failed to parse ICP response: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
    }

    // Validate ICP data structure
    validateICPData(icpData)

    const duration = Date.now() - startTime
    console.log(`[ICPGenerator] ICP generation completed in ${duration}ms using model: ${result.modelUsed}`)

    return {
      icp_data: icpData,
      tokensUsed: result.tokensUsed,
      modelUsed: result.modelUsed,
      generatedAt: new Date().toISOString()
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[ICPGenerator] ICP generation failed after ${duration}ms:`, error)
    throw error
  }
}

/**
 * Validate ICP data structure
 */
function validateICPData(data: ICPData): void {
  if (!Array.isArray(data.industries) || data.industries.length === 0) {
    throw new Error('ICP data must include at least one industry')
  }
  if (!Array.isArray(data.buyerRoles) || data.buyerRoles.length === 0) {
    throw new Error('ICP data must include at least one buyer role')
  }
  if (!Array.isArray(data.painPoints) || data.painPoints.length === 0) {
    throw new Error('ICP data must include at least one pain point')
  }
  if (!data.valueProposition || data.valueProposition.trim().length === 0) {
    throw new Error('ICP data must include a value proposition')
  }
}

/**
 * Store ICP generation result in workflow
 */
export async function storeICPGenerationResult(
  workflowId: string,
  organizationId: string,
  icpResult: ICPGenerationResult
): Promise<void> {
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('intent_workflows')
    .update({
      icp_data: icpResult.icp_data,
      step_1_icp_completed_at: new Date().toISOString(),
      status: 'step_1_icp',
      workflow_data: {
        icp_generation: {
          tokensUsed: icpResult.tokensUsed,
          modelUsed: icpResult.modelUsed,
          generatedAt: icpResult.generatedAt
        }
      }
    })
    .eq('id', workflowId)
    .eq('organization_id', organizationId)

  if (error) {
    throw new Error(`Failed to store ICP generation result: ${error.message}`)
  }

  console.log(`[ICPGenerator] ICP result stored for workflow ${workflowId}`)
}

/**
 * Handle ICP generation failure
 */
export async function handleICPGenerationFailure(
  workflowId: string,
  organizationId: string,
  error: Error
): Promise<void> {
  const supabase = createServiceRoleClient()

  const { error: updateError } = await supabase
    .from('intent_workflows')
    .update({
      status: 'failed',
      step_1_icp_error_message: error.message,
      workflow_data: {
        icp_generation_error: {
          message: error.message,
          timestamp: new Date().toISOString()
        }
      }
    })
    .eq('id', workflowId)
    .eq('organization_id', organizationId)

  if (updateError) {
    console.error(`Failed to update workflow error status: ${updateError.message}`)
  }

  console.log(`[ICPGenerator] ICP generation failure recorded for workflow ${workflowId}`)
}
