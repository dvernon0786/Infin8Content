import { createServiceRoleClient } from '@/lib/supabase/server'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'

export interface GateResult {
  allowed: boolean
  competitorStatus: string
  workflowStatus: string
  error?: string
  errorResponse?: object
}

export interface WorkflowData {
  id: string
  status: string
  organization_id: string
  competitor_completed_at: string | null
}

export class CompetitorGateValidator {
  /**
   * Validates competitor analysis completion for a given workflow
   * @param workflowId - The workflow ID to validate
   * @returns GateResult indicating if access is allowed
   */
  async validateCompetitorCompletion(workflowId: string): Promise<GateResult> {
    try {
      const supabase = createServiceRoleClient()
      
      // Query workflow status and competitor completion
      const { data: workflow, error } = await supabase
        .from('intent_workflows')
        .select('id, status, organization_id, competitor_completed_at')
        .eq('id', workflowId)
        .single() as { data: WorkflowData | null, error: any }

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            allowed: false,
            competitorStatus: 'not_found',
            workflowStatus: 'not_found',
            error: 'Workflow not found',
            errorResponse: {
              error: 'Workflow not found',
              workflowId,
              requiredAction: 'Provide valid workflow ID'
            }
          }
        }
        
        // Database errors - fail open for availability
        console.error('Database error in competitor gate validation:', error)
        return {
          allowed: true,
          competitorStatus: 'error',
          workflowStatus: 'error',
          error: 'Database error - failing open for availability'
        }
      }

      if (!workflow) {
        return {
          allowed: false,
          competitorStatus: 'not_found',
          workflowStatus: 'not_found',
          error: 'Workflow not found',
          errorResponse: {
            error: 'Workflow not found',
            workflowId,
            requiredAction: 'Provide valid workflow ID'
          }
        }
      }

      // Check if competitor analysis is complete (status must be step_3_competitors or later)
      const competitorCompleteStatuses = [
        'step_3_competitors',
        'step_4_longtails',
        'step_5_filtering',
        'step_6_clustering',
        'step_7_validation',
        'step_8_subtopics',
        'step_9_articles',
        'completed'
      ]

      const isCompetitorComplete = competitorCompleteStatuses.includes(workflow.status)

      if (!isCompetitorComplete) {
        return {
          allowed: false,
          competitorStatus: workflow.status,
          workflowStatus: workflow.status,
          error: 'Competitor analysis required before seed keywords',
          errorResponse: {
            error: 'Competitor analysis required before seed keywords',
            workflowStatus: workflow.status,
            competitorStatus: 'not_complete',
            requiredAction: 'Complete competitor analysis (step 2) before proceeding',
            currentStep: workflow.status,
            blockedAt: new Date().toISOString()
          }
        }
      }

      // Competitor analysis is complete - allow access
      return {
        allowed: true,
        competitorStatus: workflow.status,
        workflowStatus: workflow.status
      }

    } catch (error) {
      console.error('Unexpected error in competitor gate validation:', error)
      // Fail open for availability
      return {
        allowed: true,
        competitorStatus: 'error',
        workflowStatus: 'error',
        error: 'Unexpected error - failing open for availability'
      }
    }
  }

  /**
   * Logs gate enforcement attempts for audit trail
   * @param workflowId - The workflow ID
   * @param stepName - The step being attempted
   * @param result - The gate validation result
   */
  async logGateEnforcement(
    workflowId: string,
    stepName: string,
    result: GateResult
  ): Promise<void> {
    try {
      // Extract organization from workflow for audit logging
      const supabase = createServiceRoleClient()
      const { data: workflow } = await supabase
        .from('intent_workflows')
        .select('organization_id')
        .eq('id', workflowId)
        .single() as { data: Pick<WorkflowData, 'organization_id'> | null }

      if (!workflow) {
        console.warn('Cannot log gate enforcement - workflow not found:', workflowId)
        return
      }

      await logIntentAction({
        organizationId: workflow.organization_id,
        workflowId,
        entityType: 'workflow',
        entityId: workflowId,
        actorId: 'system', // Will be overridden by middleware
        action: result.allowed ? 'workflow.gate.competitors_allowed' : 'workflow.gate.competitors_blocked',
        details: {
          attempted_step: stepName,
          competitor_status: result.competitorStatus,
          workflow_status: result.workflowStatus,
          enforcement_action: result.allowed ? 'allowed' : 'blocked',
          error_message: result.error
        },
        ipAddress: null, // Will be populated by middleware
        userAgent: null // Will be populated by middleware
      })

    } catch (error) {
      console.error('Failed to log gate enforcement:', error)
      // Non-blocking - don't let logging failures affect gate operation
    }
  }
}
