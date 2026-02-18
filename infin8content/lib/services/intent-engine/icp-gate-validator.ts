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
  icp_data: any | null
}

export class ICPGateValidator {
  /**
   * Validates ICP completion for a given workflow
   */
  async validateICPCompletion(workflowId: string): Promise<GateResult> {
    try {
      const supabase = createServiceRoleClient()

      const { data: workflow, error } = await supabase
        .from('intent_workflows')
        .select('id, state, organization_id, icp_data')
        .eq('id', workflowId)
        .single() as { data: WorkflowData | null; error: any }

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

      // Block if still on Step 1
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

      // 🔥 Correct validation: check icp_data column directly
      if (!workflow.icp_data) {
        return {
          allowed: false,
          icpStatus: 'missing_data',
          workflowStatus: workflow.state,
          error: 'ICP data missing',
          errorResponse: {
            error: 'ICP data missing - please regenerate ICP',
            workflowStatus: workflow.state,
            requiredAction: 'Regenerate ICP data',
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

      // 🔒 Fail closed
      return {
        allowed: false,
        icpStatus: 'error',
        workflowStatus: 'error',
        error: 'ICP validation failed unexpectedly',
        errorResponse: {
          error: 'ICP validation failed unexpectedly',
          requiredAction: 'Retry operation or contact support',
          blockedAt: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Logs gate enforcement attempts (non-blocking)
   */
  async logGateEnforcement(
    workflowId: string,
    stepName: string,
    result: GateResult
  ): Promise<void> {
    try {
      const supabase = createServiceRoleClient()

      const { data: workflow } = await supabase
        .from('intent_workflows')
        .select('organization_id')
        .eq('id', workflowId)
        .single() as { data: { organization_id: string } | null }

      await logIntentAction({
        organizationId: workflow?.organization_id || '',
        workflowId,
        entityType: 'workflow',
        entityId: workflowId,
        actorId: 'system', // no FK violation
        action: result.allowed
          ? AuditAction.WORKFLOW_GATE_ICP_ALLOWED
          : AuditAction.WORKFLOW_GATE_ICP_BLOCKED,
        details: {
          attempted_step: stepName,
          icp_status: result.icpStatus,
          workflow_status: result.workflowStatus,
          enforcement_action: result.allowed ? 'allowed' : 'blocked',
          error_message: result.error,
          timestamp: new Date().toISOString()
        }
      })
    } catch (auditError) {
      console.error('Failed to log gate enforcement:', auditError)
      // Non-blocking
    }
  }
}
