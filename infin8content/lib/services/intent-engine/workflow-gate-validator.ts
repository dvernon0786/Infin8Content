import { createServiceRoleClient } from '@/lib/supabase/server'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'

export interface GateResult {
  allowed: boolean
  longtailStatus: string
  clusteringStatus: string
  workflowState: string
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
   * Uses FSM state instead of legacy step ordering
   */
  async validateGate(
    workflowId: string,
    organizationId: string
  ): Promise<GateResult> {
    try {
      const supabase = createServiceRoleClient()

      // Query workflow state
      const { data: workflow, error: workflowError } = await supabase
        .from('intent_workflows')
        .select('id, state, organization_id')
        .eq('id', workflowId)
        .eq('organization_id', organizationId)
        .single() as { data: WorkflowData | null; error: any }

      if (workflowError || !workflow) {
        return {
          allowed: false,
          longtailStatus: 'not_found',
          clusteringStatus: 'not_found',
          workflowState: 'unknown',
          error: 'Workflow not found',
          errorResponse: {
            error: 'Workflow not found',
            requiredAction: 'Provide valid workflow ID'
          }
        }
      }

      // FSM validation: Only allow steps 6+ (clustering onwards)
      const stepOrder = ['step_1_icp', 'step_2_competitors', 'step_3_seeds', 'step_4_longtails', 'step_5_filtering', 'step_6_clustering', 'step_7_validation', 'step_8_subtopics', 'step_9_articles']
      const currentIndex = stepOrder.indexOf(workflow.state)
      const minimumIndex = stepOrder.indexOf('step_6_clustering')
      
      if (currentIndex < minimumIndex) {
        return {
          allowed: false,
          longtailStatus: 'incomplete',
          clusteringStatus: 'incomplete',
          workflowState: workflow.state,
          error: 'Workflow has not completed prerequisite steps',
          errorResponse: {
            error: 'Prerequisites not met',
            currentState: workflow.state,
            requiredState: 'step_6_clustering or later'
          }
        }
      }

      return {
        allowed: true,
        longtailStatus: 'complete',
        clusteringStatus: 'complete',
        workflowState: workflow.state
      }
    } catch (error) {
      console.error('Error validating workflow gate:', error)
      return {
        allowed: false,
        longtailStatus: 'error',
        clusteringStatus: 'error',
        workflowState: 'unknown',
        error: 'Internal server error'
      }
    }
  }

  /**
   * Logs gate enforcement attempts for audit trail
   */
  async logGateEnforcement(
    workflowId: string,
    stepName: string,
    result: GateResult
  ): Promise<void> {
    try {
      const supabase = createServiceRoleClient()
      
      // Get workflow for logging
      const workflowResult = await supabase
        .from('intent_workflows')
        .select('organization_id')
        .eq('id', workflowId)
        .single()

      if (workflowResult.error || !workflowResult.data) {
        console.error('Failed to retrieve workflow for gate logging')
        return
      }

      await logIntentAction({
        organizationId: workflowResult.data.organization_id,
        workflowId,
        entityType: 'workflow',
        entityId: workflowId,
        actorId: '00000000-0000-0000-0000-000000000000', // System actor UUID
        action: `WORKFLOW_GATE_${result.allowed ? 'PASSED' : 'BLOCKED'}`,
        details: {
          attempted_step: stepName,
          longtail_status: result.longtailStatus,
          clustering_status: result.clusteringStatus,
          workflow_state: result.workflowState,
          enforcement_action: result.allowed ? 'allowed' : 'blocked',
          error_message: result.error
        },
        ipAddress: null,
        userAgent: null
      })
    } catch (error) {
      console.error('Failed to log gate enforcement:', error)
      // Non-blocking - don't let logging failures affect gate operation
    }
  }
}
