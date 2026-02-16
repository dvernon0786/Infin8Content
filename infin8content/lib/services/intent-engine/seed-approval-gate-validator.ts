import { createServiceRoleClient } from '@/lib/supabase/server'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'

export interface GateResult {
  allowed: boolean
  seedApprovalStatus: string
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

export class SeedApprovalGateValidator {
  /**
   * Validates seed approval completion for a given workflow
   * @param workflowId - The workflow ID to validate
   * @returns GateResult indicating if access is allowed
   */
  async validateSeedApproval(workflowId: string): Promise<GateResult> {
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

      // FSM rule: longtail expand allowed only from step_3_seeds
      if (workflow.state !== 'step_3_seeds') {

        // If workflow already progressed beyond seeds,
        // approval already happened → allow
        if (
          workflow.state === 'step_4_longtails' ||
          workflow.state === 'step_5_filtering' ||
          workflow.state === 'step_6_clustering' ||
          workflow.state === 'step_7_validation' ||
          workflow.state === 'step_8_subtopics' ||
          workflow.state === 'step_9_articles' ||
          workflow.state === 'completed' ||
          workflow.state === 'failed'
        ) {
          return {
            allowed: true,
            seedApprovalStatus: 'already_completed',
            workflowStatus: workflow.state
          }
        }

        // Otherwise block - not ready for approval yet
        return {
          allowed: false,
          seedApprovalStatus: 'invalid_state',
          workflowStatus: workflow.state,
          error: 'Seed approval required before longtail expansion',
          errorResponse: {
            error: 'Seed approval required before longtail expansion',
            workflowStatus: workflow.state,
            requiredAction: 'Complete seed extraction first',
            currentStep: 'longtail-expand',
            blockedAt: new Date().toISOString()
          }
        }
      }

      // We are at step_3_seeds
      // Check approval record
      const { data: approval } = await supabase
        .from('intent_approvals')
        .select('decision')
        .eq('workflow_id', workflowId)
        .eq('approval_type', 'seed_keywords')
        .eq('decision', 'approved')
        .single()

      if (!approval) {
        return {
          allowed: false,
          seedApprovalStatus: 'not_approved',
          workflowStatus: workflow.state,
          error: 'Seed keywords must be approved before longtail expansion',
          errorResponse: {
            error: 'Seed keywords must be approved before longtail expansion',
            workflowStatus: workflow.state,
            requiredAction: 'Approve seed keywords first',
            currentStep: 'longtail-expand',
            blockedAt: new Date().toISOString()
          }
        }
      }

      return {
        allowed: true,
        seedApprovalStatus: 'approved',
        workflowStatus: workflow.state
      }

    } catch (error) {
      console.error('Seed gate unexpected error:', error)

      return {
        allowed: true,
        seedApprovalStatus: 'error',
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
        actorId: '00000000-0000-0000-0000-000000000000', // System actor UUID
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
