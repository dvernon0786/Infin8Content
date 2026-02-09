/**
 * Workflow Dashboard Service
 * Story 39.6: Create Workflow Status Dashboard
 * 
 * Handles all business logic for dashboard data aggregation,
 * progress calculation, and summary statistics.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { IntentWorkflow } from '@/lib/types/intent-workflow'
import { 
  WORKFLOW_PROGRESS_MAP, 
  WORKFLOW_STEP_DESCRIPTIONS,
  ALL_WORKFLOW_STATES,
  calculateProgress,
  getStepDescription,
  assertValidWorkflowState,
  type WorkflowState 
} from '@/lib/constants/intent-workflow-steps'
import { normalizeWorkflowStatus } from '@/lib/utils/normalize-workflow-status'

export interface WorkflowDashboardItem {
  id: string
  name: string
  status: string
  progress_percentage: number
  current_step: string
  created_at: string
  updated_at: string
  created_by: string
  estimated_completion?: string
}

export interface DashboardSummary {
  total_workflows: number
  completed_workflows: number
  in_progress_workflows: number
  failed_workflows: number
}

export interface DashboardResponse {
  workflows: WorkflowDashboardItem[]
  filters: {
    statuses: string[]
    date_ranges: string[]
  }
  summary: DashboardSummary
}

/**
 * Progress calculation and step descriptions
 * Uses canonical functions from constants
 */

/**
 * Calculate summary statistics from workflows
 */
export function calculateSummary(workflows: IntentWorkflow[]): DashboardSummary {
  const summary: DashboardSummary = {
    total_workflows: workflows.length,
    completed_workflows: 0,
    in_progress_workflows: 0,
    failed_workflows: 0,
  }

  workflows.forEach(workflow => {
    if (workflow.status === 'completed') {
      summary.completed_workflows++
    } else if (workflow.status === 'failed') {
      summary.failed_workflows++
    } else {
      summary.in_progress_workflows++
    }
  })

  return summary
}

/**
 * Calculate estimated completion time based on progress and creation time
 * Uses linear extrapolation from current progress
 */
export function calculateEstimatedCompletion(
  createdAt: string,
  updatedAt: string,
  progressPercentage: number
): string | undefined {
  if (progressPercentage >= 100) return undefined
  if (progressPercentage === 0) return undefined

  const created = new Date(createdAt).getTime()
  const updated = new Date(updatedAt).getTime()
  const elapsed = updated - created

  if (elapsed === 0) return undefined

  const remainingProgress = 100 - progressPercentage
  const estimatedRemainingTime = (elapsed / progressPercentage) * remainingProgress
  const estimatedCompletion = new Date(updated + estimatedRemainingTime)

  return estimatedCompletion.toISOString()
}

/**
 * Format workflows for dashboard display
 */
export function formatWorkflows(workflows: IntentWorkflow[]): WorkflowDashboardItem[] {
  return workflows.map(workflow => {
    const progress = calculateProgress(workflow.status)
    return {
      id: workflow.id,
      name: workflow.name,
      status: workflow.status,
      progress_percentage: progress,
      current_step: getStepDescription(workflow.status),
      created_at: workflow.created_at,
      updated_at: workflow.updated_at,
      created_by: workflow.created_by,
      estimated_completion: calculateEstimatedCompletion(
        workflow.created_at,
        workflow.updated_at,
        progress
      ),
    }
  })
}

/**
 * Fetch all workflows for an organization
 */
export async function getWorkflowDashboard(
  supabase: SupabaseClient,
  organizationId: string
): Promise<DashboardResponse> {
  const { data: workflows, error } = await supabase
    .from('intent_workflows')
    .select('*')
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch workflows: ${error.message}`)
  }

  const normalizedWorkflows = (workflows || []).map(w => ({
    ...w,
    status: normalizeWorkflowStatus(w.status),
  }))
  const formattedWorkflows = formatWorkflows(normalizedWorkflows)
  const summary = calculateSummary(normalizedWorkflows)

  return {
    workflows: formattedWorkflows,
    filters: {
      statuses: [...ALL_WORKFLOW_STATES],
      date_ranges: ['today', 'this_week', 'this_month', 'all_time'],
    },
    summary,
  }
}
