import { createServiceRoleClient } from '@/lib/supabase/server'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'

export interface GateResult {
  allowed: boolean
  longtailStatus: string
  clusteringStatus: string
  workflowStatus: string
  error?: string
  errorResponse?: object
}

export interface WorkflowData {
  id: string
  state: string
  organization_id: string
}

export interface WorkflowValidationParams {
  workflowId: string
  organizationId: string
}

export class WorkflowGateValidator {
  /**
   * Validates that longtails and clustering are complete before subtopic generation
   * @param workflowId - The workflow ID to validate
   * @param organizationId - The organization ID for isolation validation
   * @returns GateResult indicating if access is allowed
   */
  async validateLongtailsRequiredForSubtopics(workflowId: string, organizationId?: string): Promise<GateResult> {
    try {
      const supabase = createServiceRoleClient()
      
      // Query workflow state
      let query = supabase
        .from('intent_workflows')
        .select('id, state, organization_id')
        .eq('id', workflowId)
      
      // Add organization isolation if provided
      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }
      
      const { data: workflow, error: workflowError } = await query
        .single() as { data: WorkflowData | null, error: any }

      if (workflowError) {
        if (workflowError.code === 'PGRST116') {
          return {
            allowed: false,
            longtailStatus: 'not_found',
            clusteringStatus: 'not_found',
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
        console.error('Database error in workflow gate validation:', workflowError)
        return {
          allowed: true,
          longtailStatus: 'error',
          clusteringStatus: 'error',
          workflowStatus: 'error',
          error: 'Database error - failing open for availability'
        }
      }

      if (!workflow) {
        return {
          allowed: false,
          longtailStatus: 'not_found',
          clusteringStatus: 'not_found',
          workflowStatus: 'not_found',
          error: 'Workflow not found',
          errorResponse: {
            error: 'Workflow not found',
            workflowId,
            requiredAction: 'Provide valid workflow ID'
          }
        }
      }

      // FSM validation: longtails and clustering must be complete before subtopics
      const validStates = ['step_6_clustering', 'step_7_validation', 'step_8_subtopics', 'step_9_articles', 'completed']
      
      if (!validStates.includes(workflow.state)) {
        return {
          allowed: false,
          longtailStatus: 'incomplete',
          clusteringStatus: 'incomplete',
          workflowStatus: workflow.state,
          error: 'Longtail expansion and clustering must be complete before subtopic generation',
          errorResponse: {
            error: 'Prerequisites not met',
            workflowStatus: workflow.state,
            requiredAction: 'Complete longtail expansion and clustering first',
            currentStep: 'subtopic-generation',
            blockedAt: new Date().toISOString()
          }
        }
      }

      // All checks passed - allow access
      return {
        allowed: true,
        longtailStatus: 'complete',
        clusteringStatus: 'complete',
        workflowStatus: workflow.state
      }

    } catch (error) {
      console.error('Unexpected error in workflow gate validation:', error)
      // Fail open for availability
      return {
        allowed: true,
        longtailStatus: 'error',
        clusteringStatus: 'error',
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
        actorId: '00000000-0000-0000-0000-000000000000', // System actor UUID
        action: result.allowed ? 'workflow.gate.longtails_allowed' : 'workflow.gate.longtails_blocked',
        details: {
          attempted_step: stepName,
          longtail_status: result.longtailStatus,
          clustering_status: result.clusteringStatus,
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
