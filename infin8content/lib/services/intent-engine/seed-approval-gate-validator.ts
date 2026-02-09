import { createServiceRoleClient } from '@/lib/supabase/server'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'
import { normalizeWorkflowStatus } from '@/lib/utils/normalize-workflow-status'
import { WORKFLOW_STEP_ORDER } from '@/lib/constants/intent-workflow-steps'

export interface GateResult {
  allowed: boolean
  seedApprovalStatus: string
  workflowStatus: string
  error?: string
  errorResponse?: object
}

export interface WorkflowData {
  id: string
  status: string
  organization_id: string
}

export interface ApprovalData {
  decision: string
  approved_items: string[] | null
}

export class SeedApprovalGateValidator {
  /**
   * Validates seed approval completion for a given workflow
   * @param workflowId - The workflow ID to validate
   * @returns GateResult indicating if access is allowed
   */
  async validateSeedApproval(workflowId: string): Promise<GateResult> {
    try {
      const supabase = createServiceRoleClient()
      
      // Query workflow status
      const { data: workflow, error: workflowError } = await supabase
        .from('intent_workflows')
        .select('id, status, organization_id')
        .eq('id', workflowId)
        .single() as { data: WorkflowData | null, error: any }

      if (workflowError) {
        if (workflowError.code === 'PGRST116') {
          return {
            allowed: false,
            seedApprovalStatus: 'not_found',
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
        console.error('Database error in seed approval gate validation:', workflowError)
        return {
          allowed: true,
          seedApprovalStatus: 'error',
          workflowStatus: 'error',
          error: 'Database error - failing open for availability'
        }
      }

      if (!workflow) {
        return {
          allowed: false,
          seedApprovalStatus: 'not_found',
          workflowStatus: 'not_found',
          error: 'Workflow not found',
          errorResponse: {
            error: 'Workflow not found',
            workflowId,
            requiredAction: 'Provide valid workflow ID'
          }
        }
      }

      // Workflow must be at step_3_keywords to require seed approval
      if (workflow.status !== 'step_3_keywords') {
        // If workflow is beyond step_3_keywords, allow (already approved)
        // If workflow is before step_3_keywords, block (keywords not ready yet)
        const normalizedStatus = normalizeWorkflowStatus(workflow.status)
        const currentIndex = WORKFLOW_STEP_ORDER.indexOf(normalizedStatus)
        const seedIndex = WORKFLOW_STEP_ORDER.indexOf('step_3_keywords')
        
        // Handle terminal states - they are beyond all execution steps
        const effectiveIndex = currentIndex === -1 ? WORKFLOW_STEP_ORDER.length : currentIndex
        
        if (effectiveIndex < seedIndex) {
          // Workflow hasn't reached seed step yet
          return {
            allowed: false,
            seedApprovalStatus: 'not_ready',
            workflowStatus: workflow.status,
            error: 'Seed keywords not yet extracted',
            errorResponse: {
              error: 'Seed keywords not yet extracted',
              workflowStatus: workflow.status,
              seedApprovalStatus: 'not_ready',
              requiredAction: 'Complete seed keyword extraction (step 3) before approval',
              currentStep: 'longtail-expand',
              blockedAt: new Date().toISOString()
            }
          }
        }
        
        // Workflow is beyond step_3_keywords, so approval already happened
        return {
          allowed: true,
          seedApprovalStatus: 'not_required',
          workflowStatus: workflow.status,
          error: 'Seed approval gate not required at this step'
        }
      }

      // Check if seed keywords have been approved
      const { data: approval, error: approvalError } = await supabase
        .from('intent_approvals')
        .select('decision, approved_items')
        .eq('workflow_id', workflowId)
        .eq('approval_type', 'seed_keywords')
        .eq('decision', 'approved')
        .single() as { data: ApprovalData | null, error: any }

      if (approvalError) {
        if (approvalError.code === 'PGRST116') {
          // No approval record found
          return {
            allowed: false,
            seedApprovalStatus: 'not_approved',
            workflowStatus: workflow.status,
            error: 'Seed keywords must be approved before longtail expansion',
            errorResponse: {
              error: 'Seed keywords must be approved before longtail expansion',
              workflowStatus: workflow.status,
              seedApprovalStatus: 'not_approved',
              requiredAction: 'Approve seed keywords via POST /api/intent/workflows/{workflow_id}/steps/approve-seeds',
              currentStep: 'longtail-expand',
              blockedAt: new Date().toISOString()
            }
          }
        }
        
        // Database errors - fail open for availability
        console.error('Database error checking seed approval:', approvalError)
        return {
          allowed: true,
          seedApprovalStatus: 'error',
          workflowStatus: workflow.status,
          error: 'Database error - failing open for availability'
        }
      }

      if (!approval) {
        return {
          allowed: false,
          seedApprovalStatus: 'not_approved',
          workflowStatus: workflow.status,
          error: 'Seed keywords must be approved before longtail expansion',
          errorResponse: {
            error: 'Seed keywords must be approved before longtail expansion',
            workflowStatus: workflow.status,
            seedApprovalStatus: 'not_approved',
            requiredAction: 'Approve seed keywords via POST /api/intent/workflows/{workflow_id}/steps/approve-seeds',
            currentStep: 'longtail-expand',
            blockedAt: new Date().toISOString()
          }
        }
      }

      // Seed approval is confirmed - allow access
      return {
        allowed: true,
        seedApprovalStatus: 'approved',
        workflowStatus: workflow.status
      }

    } catch (error) {
      console.error('Unexpected error in seed approval gate validation:', error)
      // Fail open for availability
      return {
        allowed: true,
        seedApprovalStatus: 'error',
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

      // Determine action based on result
      let action: string
      if (result.seedApprovalStatus === 'error') {
        action = 'workflow.gate.seeds_error'
      } else if (result.allowed) {
        action = 'workflow.gate.seeds_allowed'
      } else {
        action = 'workflow.gate.seeds_blocked'
      }

      await logIntentAction({
        organizationId: workflow.organization_id,
        workflowId,
        entityType: 'workflow',
        entityId: workflowId,
        actorId: 'system',
        action,
        details: {
          attempted_step: stepName,
          seed_approval_status: result.seedApprovalStatus,
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
