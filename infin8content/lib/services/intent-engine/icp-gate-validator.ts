import { createServiceRoleClient } from '@/lib/supabase/server'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'
import { AuditAction } from '@/types/audit'

export interface GateResult {
  allowed: boolean
  icpStatus: string
  workflowStatus: string
  error?: string
  errorResponse?: object
}

export interface WorkflowData {
  id: string
  state: string
  organization_id: string
}

export class ICPGateValidator {
  /**
   * Validates ICP completion for a given workflow
   * @param workflowId - The workflow ID to validate
   * @returns GateResult indicating if access is allowed
   */
  async validateICPCompletion(workflowId: string): Promise<GateResult> {
    try {
      const supabase = createServiceRoleClient()

      const { data: workflow, error } = await supabase
        .from('intent_workflows')
        .select('id, state, organization_id')
        .eq('id', workflowId)
        .single() as { data: WorkflowData | null, error: any }

      if (error || !workflow) {
        return {
          allowed: false,
          icpStatus: 'not_found',
          workflowStatus: 'not_found',
          error: 'Workflow not found',
          errorResponse: {
            error: 'Workflow not found',
            workflowId,
            requiredAction: 'Provide valid workflow ID'
          }
        }
      }

      // FSM rule: ICP complete if state is NOT step_1_icp
      if (workflow.state === 'step_1_icp') {
        return {
          allowed: false,
          icpStatus: 'not_completed',
          workflowStatus: workflow.state,
          error: 'ICP must be completed before proceeding',
          errorResponse: {
            error: 'ICP must be completed before proceeding',
            workflowStatus: workflow.state,
            requiredAction: 'Complete ICP generation first',
            currentStep: 'icp-generate',
            blockedAt: new Date().toISOString()
          }
        }
      }

      return {
        allowed: true,
        icpStatus: 'completed',
        workflowStatus: workflow.state
      }

    } catch (error) {
      console.error('ICP gate unexpected error:', error)

      return {
        allowed: true,
        icpStatus: 'error',
        workflowStatus: 'error'
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
        action: result.allowed ? AuditAction.WORKFLOW_GATE_ICP_ALLOWED : AuditAction.WORKFLOW_GATE_ICP_BLOCKED,
        details: {
          attempted_step: stepName,
          icp_status: result.icpStatus,
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
