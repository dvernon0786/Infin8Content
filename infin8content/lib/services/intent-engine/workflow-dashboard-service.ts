/**
 * Workflow Dashboard Service
 * Story 39.6: Create Workflow Status Dashboard
 * 
 * Handles all business logic for dashboard data aggregation,
 * progress calculation, and summary statistics.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { IntentWorkflow } from '@/lib/types/intent-workflow'
import { STATE_ORDER, type WorkflowState } from '@/lib/fsm/workflow-events'

// Type hardening for Supabase joins (Zero Drift)
type WorkflowWithCounts = IntentWorkflow & {
  keywords?: { count: number }[]
  articles?: { count: number }[]
}

export interface WorkflowDashboardItem {
  id: string
  name: string
  state: WorkflowState
  progress_percentage: number
  created_at: string
  updated_at: string
  created_by: string
  estimated_completion?: string
  keywords?: number
  articles?: number
  display_updated_at: string
  display_created_at: string
}

export interface DashboardSummary {
  total_workflows: number
  completed_workflows: number
  in_progress_workflows: number
  total_keywords: number
  total_articles: number
  pending_approvals: number
  avg_completion_percentage: number
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
 * Calculate summary statistics from formatted workflows
 * Single Authority: Summary now derives from already computed progress
 */
export function calculateSummary(workflows: WorkflowDashboardItem[]): DashboardSummary {
  const activeCount = workflows.filter(w => {
    const base = w.state.replace(/_(running|failed|queued)$/, '')
    return base !== 'completed' && base !== 'cancelled'
  }).length

  // BUG FIX #2: Summary now properly detects completed workflows even in transition states
  const completedCount = workflows.filter(w => {
    const base = w.state.replace(/_(running|failed|queued)$/, '')
    return base === 'completed'
  }).length

  const totalKeywords = workflows.reduce((acc, w) => acc + (w.keywords || 0), 0)
  const totalArticles = workflows.reduce((acc, w) => acc + (w.articles || 0), 0)

  const pendingApprovals = workflows.filter(w => {
    const base = w.state.replace(/_(running|failed|queued)$/, '')
    return base === 'step_3_seeds' || base === 'step_8_subtopics'
  }).length

  // BUG FIX #1: Deriving average from formatted progress (Single Authority)
  const totalProgress = workflows.reduce((acc, w) => acc + w.progress_percentage, 0)
  const avgCompletion = workflows.length > 0 ? Math.round(totalProgress / workflows.length) : 0

  return {
    total_workflows: workflows.length,
    completed_workflows: completedCount,
    in_progress_workflows: activeCount,
    total_keywords: totalKeywords,
    total_articles: totalArticles,
    pending_approvals: pendingApprovals,
    avg_completion_percentage: avgCompletion
  }
}

/**
 * Calculate estimated completion time based on progress and creation time
 * Uses linear extrapolation from current progress
 */
export function calculateEstimatedCompletion(
  createdAt: string,
  updatedAt: string,
  progressPercentage: number,
  baseState: string
): string | undefined {
  if (progressPercentage >= 100) return undefined
  if (progressPercentage === 0) return undefined

  // UX Hardening: Do not calculate if at an approval gate
  // These steps require human interaction, so linear extrapolation is misleading
  const gateStates = ['step_3_seeds', 'step_8_subtopics']
  if (gateStates.includes(baseState)) return undefined

  const created = new Date(createdAt).getTime()
  const updated = new Date(updatedAt).getTime()
  const elapsed = updated - created

  // GUARD #4: No division by zero or negative elapsed time (Zero Drift)
  if (elapsed <= 0 || progressPercentage <= 0) return undefined

  const remainingProgress = 100 - progressPercentage
  const estimatedRemainingTime = (elapsed / progressPercentage) * remainingProgress

  // CAP: Limit estimates to 1 year out to avoid extreme future dates from logic bugs
  const MAX_ESTIMATE = 365 * 24 * 60 * 60 * 1000
  const finalEstimateTime = Math.min(estimatedRemainingTime, MAX_ESTIMATE)

  const estimatedCompletion = new Date(updated + finalEstimateTime)

  return estimatedCompletion.toISOString()
}

/**
 * Format workflows for dashboard display
 * Uses pure FSM state for progress calculation
 */
export function formatWorkflows(workflows: IntentWorkflow[]): WorkflowDashboardItem[] {
  const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return workflows.map(workflow => {
    // Pure FSM: Derive progress from state order only
    // BUG FIX #3: Normalize state before lookup to handle _running/_failed/_queued
    const baseState = workflow.state.replace(/_(running|failed|queued)$/, '')
    const stateIndex = STATE_ORDER.indexOf(baseState as WorkflowState)
    const progress = stateIndex >= 0 ? (stateIndex / (STATE_ORDER.length - 1)) * 100 : 0

    return {
      id: workflow.id,
      name: workflow.name,
      state: workflow.state,
      progress_percentage: progress,
      created_at: workflow.created_at,
      updated_at: workflow.updated_at,
      created_by: workflow.created_by,
      display_created_at: dateFormatter.format(new Date(workflow.created_at)),
      display_updated_at: dateFormatter.format(new Date(workflow.updated_at)),
      estimated_completion: calculateEstimatedCompletion(
        workflow.created_at,
        workflow.updated_at,
        progress,
        baseState
      ),
      keywords: (workflow as WorkflowWithCounts).keywords?.[0]?.count || 0,
      articles: (workflow as WorkflowWithCounts).articles?.[0]?.count || 0
    }
  })
}

/**
 * Fetch all workflows for an organization with optional date range filtering
 */
export async function getWorkflowDashboard(
  supabase: SupabaseClient,
  organizationId: string,
  range: '7d' | '30d' | '90d' | 'all' = 'all'
): Promise<DashboardResponse> {
  let query = supabase
    .from('intent_workflows')
    .select(`
      id,
      name,
      state,
      organization_id,
      created_at,
      updated_at,
      created_by,
      keywords:keywords(count),
      articles:articles(count)
    `)
    .eq('organization_id', organizationId)

  // Apply date range filter if not 'all'
  if (range !== 'all') {
    const days = parseInt(range.replace('d', ''), 10)
    const dateLimit = new Date()
    dateLimit.setDate(dateLimit.getDate() - days)
    query = query.gte('updated_at', dateLimit.toISOString())
  }

  const { data: workflows, error } = await query
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch workflows: ${error.message}`)
  }

  const formattedWorkflows = formatWorkflows(workflows || [])
  const summary = calculateSummary(formattedWorkflows)

  return {
    workflows: formattedWorkflows,
    filters: {
      statuses: [...STATE_ORDER],
      date_ranges: ['7d', '30d', '90d', 'all'],
    },
    summary,
  }
}
