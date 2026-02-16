import { createServiceRoleClient } from '@/lib/supabase/server'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'
import { WorkflowFSM } from '@/lib/fsm/workflow-fsm'

export interface GateResult {
  allowed: boolean
  seedApprovalStatus: string
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

export class SeedApprovalGateValidator {
  /**
   * Validates seed approval gate for a workflow
   * Uses FSM state instead of legacy step ordering
   */
  async validateGate(
    workflowId: string,
    organizationId: string,
    userId: string
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
          seedApprovalStatus: 'not_found',
          workflowState: 'unknown',
          error: 'Workflow not found',
          errorResponse: {
            error: 'Workflow not found',
            requiredAction: 'Provide valid workflow ID'
          }
        }
      }

      // FSM-based validation: Only allow approval at step_3_seeds
      if (workflow.state !== 'step_3_seeds') {
        // If workflow is beyond step_3_seeds, allow (already approved)
        // If workflow is before step_3_seeds, block (seeds not ready yet)
        const isBeyondSeeds = ['step_4_longtails', 'step_5_filtering', 'step_6_clustering', 'step_7_validation', 'step_8_subtopics', 'step_9_articles', 'completed'].includes(workflow.state)
        const isBeforeSeeds = ['step_0_auth', 'step_1_icp', 'step_2_competitors'].includes(workflow.state)
        
        if (isBeforeSeeds) {
          return {
            allowed: false,
            seedApprovalStatus: 'not_ready',
            workflowState: workflow.state,
            error: 'Seed keywords not yet extracted',
            errorResponse: {
              error: 'Seed keywords not yet extracted',
              requiredAction: 'Complete previous workflow steps first'
            }
          }
        }
        
        if (isBeyondSeeds) {
          return {
            allowed: true,
            seedApprovalStatus: 'already_approved',
            workflowState: workflow.state
          }
        }
      }

      // Workflow is at step_3_seeds - approval is required
      return {
        allowed: true,
        seedApprovalStatus: 'approval_required',
        workflowState: workflow.state
      }
    } catch (error) {
      console.error('Error validating seed approval gate:', error)
      return {
        allowed: false,
        seedApprovalStatus: 'error',
        workflowState: 'unknown',
        error: 'Internal server error',
        errorResponse: {
          error: 'Internal server error',
          requiredAction: 'Please try again later'
        }
      }
    }
  }

  /**
   * Processes seed approval decision
   */
  async processApproval(
    workflowId: string,
    organizationId: string,
    userId: string,
    approvalData: ApprovalData
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
          seedApprovalStatus: 'not_found',
          workflowState: 'unknown',
          error: 'Workflow not found'
        }
      }

      // FSM validation: Only allow approval at step_3_seeds
      if (workflow.state !== 'step_3_seeds') {
        return {
          allowed: false,
          seedApprovalStatus: 'invalid_state',
          workflowState: workflow.state,
          error: `Seed approval only allowed at step_3_seeds, current state: ${workflow.state}`
        }
      }

      // Process approval decision
      const { error: approvalError } = await supabase
        .from('intent_approvals')
        .insert({
          entity_type: 'workflow',
          entity_id: workflowId,
          decision: approvalData.decision,
          approved_items: approvalData.approved_items,
          actor_id: userId,
          organization_id: organizationId,
          created_at: new Date().toISOString()
        })

      if (approvalError) {
        console.error('Error recording approval:', approvalError)
        return {
          allowed: false,
          seedApprovalStatus: 'error',
          workflowState: workflow.state,
          error: 'Failed to record approval decision'
        }
      }

      // Log approval action
      await logIntentAction({
        organizationId,
        workflowId,
        entityType: 'workflow',
        entityId: workflowId,
        actorId: userId,
        action: approvalData.decision === 'approved' ? 'SEEDS_APPROVED' : 'SEEDS_REJECTED',
        details: {
          decision: approvalData.decision,
          approvedItems: approvalData.approved_items
        }
      })

      // FSM TRANSITION: Trigger deterministic state transition on approval
      if (approvalData.decision === 'approved') {
        await WorkflowFSM.transition(workflowId, 'SEEDS_APPROVED', { userId })
      }

      return {
        allowed: true,
        seedApprovalStatus: approvalData.decision,
        workflowState: workflow.state
      }
    } catch (error) {
      console.error('Error processing seed approval:', error)
      return {
        allowed: false,
        seedApprovalStatus: 'error',
        workflowState: 'unknown',
        error: 'Internal server error'
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
