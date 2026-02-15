import { createServiceRoleClient } from '@/lib/supabase/server'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'
import { AuditAction } from '@/types/audit'

export interface GateResult {
  allowed: boolean
  subtopicApprovalStatus: string
  workflowStatus: string
  error?: string
  errorResponse?: object
}

export interface WorkflowData {
  id: string
  state: string
  organization_id: string
}

export interface ApprovalData {
  decision: string
  approved_items: string[] | null
}

export class SubtopicApprovalGateValidator {
  /**
   * Validates subtopic approval completion for a given workflow
   * @param workflowId - The workflow ID to validate
   * @returns GateResult indicating if access is allowed
   */
  async validateSubtopicApproval(workflowId: string): Promise<GateResult> {
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
          subtopicApprovalStatus: 'not_found',
          workflowStatus: 'not_found',
          error: 'Workflow not found',
          errorResponse: {
            error: 'Workflow not found',
            workflowId,
            requiredAction: 'Provide valid workflow ID'
          }
        }
      }

      // FSM rule: subtopic approval only relevant at step_7_validation
      if (workflow.state !== 'step_7_validation') {

        // If workflow already progressed beyond validation,
        // approval already happened → allow
        if (
          workflow.state === 'step_8_subtopics' ||
          workflow.state === 'step_9_articles' ||
          workflow.state === 'completed' ||
          workflow.state === 'failed'
        ) {
          return {
            allowed: true,
            subtopicApprovalStatus: 'already_completed',
            workflowStatus: workflow.state
          }
        }

        // Otherwise block - not ready for subtopic approval yet
        return {
          allowed: false,
          subtopicApprovalStatus: 'invalid_state',
          workflowStatus: workflow.state,
          error: 'Subtopic approval required before article generation',
          errorResponse: {
            error: 'Subtopic approval required before article generation',
            workflowStatus: workflow.state,
            requiredAction: 'Complete topic clustering first',
            currentStep: 'subtopic-approval',
            blockedAt: new Date().toISOString()
          }
        }
      }

      // We are at step_7_validation
      // Check subtopic approval record
      const { data: approval } = await supabase
        .from('intent_approvals')
        .select('decision')
        .eq('workflow_id', workflowId)
        .eq('approval_type', 'subtopics')
        .eq('decision', 'approved')
        .single()

      if (!approval) {
        return {
          allowed: false,
          subtopicApprovalStatus: 'not_approved',
          workflowStatus: workflow.state,
          error: 'Subtopics must be approved before article generation',
          errorResponse: {
            error: 'Subtopics must be approved before article generation',
            workflowStatus: workflow.state,
            requiredAction: 'Approve subtopics first',
            currentStep: 'subtopic-approval',
            blockedAt: new Date().toISOString()
          }
        }
      }

      return {
        allowed: true,
        subtopicApprovalStatus: 'approved',
        workflowStatus: workflow.state
      }

    } catch (error) {
      console.error('Subtopic gate unexpected error:', error)

      return {
        allowed: true,
        subtopicApprovalStatus: 'error',
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

      // Determine action based on result
      let action: string
      if (result.subtopicApprovalStatus === 'error') {
        action = AuditAction.WORKFLOW_GATE_SUBTOPICS_ERROR
      } else if (result.allowed) {
        action = AuditAction.WORKFLOW_GATE_SUBTOPICS_ALLOWED
      } else {
        action = AuditAction.WORKFLOW_GATE_SUBTOPICS_BLOCKED
      }

      await logIntentAction({
        organizationId: workflow.organization_id,
        workflowId,
        entityType: 'workflow',
        entityId: workflowId,
        actorId: '00000000-0000-0000-0000-000000000000', // System actor UUID
        action,
        details: {
          attempted_step: stepName,
          subtopic_approval_status: result.subtopicApprovalStatus,
          workflow_status: result.workflowStatus,
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
