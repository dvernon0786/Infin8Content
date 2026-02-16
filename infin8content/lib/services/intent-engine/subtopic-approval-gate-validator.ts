import { createServiceRoleClient } from '@/lib/supabase/server'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'
import { WORKFLOW_STEP_ORDER } from '@/lib/constants/intent-workflow-steps'
import { AuditAction } from '@/types/audit'

export interface GateResult {
  allowed: boolean
  subtopicApprovalStatus: string
  workflowState: string
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
      
      // Query workflow.state
      const { data: workflow, error: workflowError } = await supabase
        .from('intent_workflows')
        .select('id, status, organization_id')
        .eq('id', workflowId)
        .single() as { data: WorkflowData | null, error: any }

      if (workflowError) {
        if (workflowError.code === 'PGRST116') {
          return {
            allowed: false,
            subtopicApprovalStatus: 'not_found',
            workflowState: 'not_found',
            error: 'Workflow not found',
            errorResponse: {
              error: 'Workflow not found',
              workflowId,
              requiredAction: 'Provide valid workflow ID'
            }
          }
        }
        
        // Database errors - fail open for availability
        console.error('Database error in subtopic approval gate validation:', workflowError)
        return {
          allowed: true,
          subtopicApprovalStatus: 'error',
          workflowState: 'error',
          error: 'Database error - failing open for availability'
        }
      }

      if (!workflow) {
        return {
          allowed: false,
          subtopicApprovalStatus: 'not_found',
          workflowState: 'not_found',
          error: 'Workflow not found',
          errorResponse: {
            error: 'Workflow not found',
            workflowId,
            requiredAction: 'Provide valid workflow ID'
          }
        }
      }

      // Workflow must be at step_8_subtopics to require subtopic approval
      if (workflow.state !== 'step_8_subtopics') {
        // If workflow is beyond step_8_subtopics, allow (already approved)
        // If workflow is before step_8_subtopics, block (subtopics not ready yet)
        const stepOrder = ['step_1_icp', 'step_2_competitors', 'step_3_seeds', 'step_4_longtails', 'step_5_filtering', 'step_6_clustering', 'step_7_validation', 'step_8_subtopics', 'step_9_articles']
        const currentIndex = stepOrder.indexOf(workflow.state)
        const approvalIndex = stepOrder.indexOf('step_8_subtopics')
        const effectiveIndex = currentIndex === -1 ? stepOrder.length : currentIndex
        
        if (effectiveIndex < approvalIndex) {
          // Workflow hasn't reached subtopic approval step yet
          return {
            allowed: false,
            subtopicApprovalStatus: 'not_ready',
            workflowState: workflow.state,
            error: 'Subtopics not yet generated for approval',
            errorResponse: {
              error: 'Subtopics not yet generated for approval',
              workflowState: workflow.state,
              subtopicApprovalStatus: 'not_ready',
              requiredAction: 'Complete subtopic generation (step 8) before approval',
              currentStep: 'article-generation',
              blockedAt: new Date().toISOString()
            }
          }
        }
        
        // Workflow is beyond step_8_subtopics, so approval already happened
        return {
          allowed: true,
          subtopicApprovalStatus: 'not_required',
          workflowState: workflow.state,
          error: 'Subtopic approval gate not required at this step'
        }
      }

      // Check if any subtopics have been approved
      const { data: approvals, error: approvalsError } = await supabase
        .from('intent_approvals')
        .select('decision, approved_items')
        .eq('workflow_id', workflowId)
        .eq('approval_type', 'subtopics')
        .in('decision', ['approved', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(1) as { data: ApprovalData[] | null, error: any }

      if (approvalsError) {
        // Database errors - fail open for availability
        console.error('Database error checking subtopic approval:', approvalsError)
        return {
          allowed: true,
          subtopicApprovalStatus: 'error',
          workflowState: workflow.state,
          error: 'Database error - failing open for availability'
        }
      }

      if (!approvals || approvals.length === 0) {
        return {
          allowed: false,
          subtopicApprovalStatus: 'not_approved',
          workflowState: workflow.state,
          error: 'Subtopics must be approved before article generation',
          errorResponse: {
            error: 'Subtopics must be approved before article generation',
            workflowState: workflow.state,
            subtopicApprovalStatus: 'not_approved',
            requiredAction: 'Approve subtopics via keyword approval endpoints',
            currentStep: 'article-generation',
            blockedAt: new Date().toISOString()
          }
        }
      }

      const latestApproval = approvals[0]

      // Check if subtopics were rejected
      if (latestApproval.decision === 'rejected') {
        return {
          allowed: false,
          subtopicApprovalStatus: 'rejected',
          workflowState: workflow.state,
          error: 'Subtopics rejected - revision required',
          errorResponse: {
            error: 'Subtopics rejected - revision required',
            workflowState: workflow.state,
            subtopicApprovalStatus: 'rejected',
            requiredAction: 'Regenerate or revise subtopics before article generation',
            currentStep: 'article-generation',
            blockedAt: new Date().toISOString()
          }
        }
      }

      // Subtopic approval is confirmed - allow access
      return {
        allowed: true,
        subtopicApprovalStatus: 'approved',
        workflowState: workflow.state
      }

    } catch (error) {
      console.error('Unexpected error in subtopic approval gate validation:', error)
      // Fail open for availability
      return {
        allowed: true,
        subtopicApprovalStatus: 'error',
        workflowState: 'error',
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
