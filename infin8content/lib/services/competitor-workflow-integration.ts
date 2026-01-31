/**
 * Competitor Workflow Integration Utilities
 * Story 33.3: Configure Competitor URLs for Analysis
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Interface for competitor data used in workflows
 */
export interface CompetitorWorkflowData {
  id: string
  url: string
  domain: string
  name?: string
  is_active: boolean
  created_at: string
}

/**
 * Retrieves competitor URLs for a given workflow
 * Used by the Intent Engine workflow to access competitor analysis data
 * 
 * @param workflowId - The workflow ID to get competitors for
 * @returns Array of competitor data for the workflow's organization
 */
export async function getWorkflowCompetitors(workflowId: string): Promise<CompetitorWorkflowData[]> {
  const supabase = await createClient()
  
  // First get the workflow to find its organization
  const { data: workflow, error: workflowError } = await supabase
    .from('intent_workflows')
    .select('organization_id')
    .eq('id', workflowId)
    .single()
  
  if (workflowError || !workflow) {
    console.error('Error fetching workflow for competitor integration:', workflowError)
    return []
  }
  
  // Get all active competitors for the organization
  const workflowOrgId = (workflow as any).organization_id
  const { data: competitors, error: competitorsError } = await supabase
    .from('organization_competitors')
    .select(`
      id,
      url,
      domain,
      name,
      is_active,
      created_at
    `)
    .eq('organization_id', workflowOrgId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  
  if (competitorsError) {
    console.error('Error fetching competitors for workflow:', competitorsError)
    return []
  }
  
  return (competitors as CompetitorWorkflowData[]) || []
}

/**
 * Retrieves competitor URLs by organization ID
 * Direct access method for workflows that already have the organization context
 * 
 * @param organizationId - The organization ID to get competitors for
 * @returns Array of competitor data for the organization
 */
export async function getOrganizationCompetitors(organizationId: string): Promise<CompetitorWorkflowData[]> {
  const supabase = await createClient()
  
  const { data: competitors, error } = await supabase
    .from('organization_competitors')
    .select(`
      id,
      url,
      domain,
      name,
      is_active,
      created_at
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching organization competitors:', error)
    return []
  }
  
  return (competitors as CompetitorWorkflowData[]) || []
}

/**
 * Formats competitor data for workflow context
 * Transforms database results into the format expected by workflow steps
 * 
 * @param competitors - Array of competitor data from database
 * @returns Formatted competitor data for workflow use
 */
export function formatCompetitorsForWorkflow(competitors: CompetitorWorkflowData[]) {
  return competitors.map(competitor => ({
    id: competitor.id,
    url: competitor.url,
    domain: competitor.domain,
    name: competitor.name || competitor.domain, // Use domain as fallback name
    added_date: competitor.created_at
  }))
}

/**
 * Validates that competitor URLs persist across workflow instances
 * Checks if competitors are still available and active for a workflow
 * 
 * @param workflowId - The workflow ID to validate competitors for
 * @returns Boolean indicating if competitors are properly configured
 */
export async function validateWorkflowCompetitors(workflowId: string): Promise<boolean> {
  const competitors = await getWorkflowCompetitors(workflowId)
  
  // A workflow should have at least one competitor to be valid for analysis
  return competitors.length > 0
}

/**
 * Extracts just the URLs from competitor data for workflow processing
 * Convenience function for workflow steps that only need URLs
 * 
 * @param workflowId - The workflow ID to get competitor URLs for
 * @returns Array of competitor URLs
 */
export async function getWorkflowCompetitorUrls(workflowId: string): Promise<string[]> {
  const competitors = await getWorkflowCompetitors(workflowId)
  return competitors.map(competitor => competitor.url)
}
