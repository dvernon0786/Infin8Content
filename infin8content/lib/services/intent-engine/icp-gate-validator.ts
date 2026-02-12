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
  status: string
  organization_id: string
  step_1_icp_completed_at: string | null
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
      
      // Query workflow status and ICP completion
      const { data: workflow, error } = await supabase
        .from('intent_workflows')
        .select('id, status, organization_id, step_1_icp_completed_at')
        .eq('id', workflowId)
        .single() as { data: WorkflowData | null, error: any }

      if (error) {
        if (error.code === 'PGRST116') {
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
        
        // Database errors - fail open for availability
        console.error('Database error in ICP gate validation:', error)
        return {
          allowed: true,
          icpStatus: 'error',
          workflowStatus: 'error',
          error: 'Database error - failing open for availability'
        }
      }

      if (!workflow) {
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

      // Check if ICP is complete (status must be step_1_icp or later)
      const icpCompleteStatuses = [
        'step_1_icp',
        'step_2_icp_complete',
        'step_3_competitors',
        'step_4_longtails',
        'step_5_filtering',
        'step_6_clustering',
        'step_7_validation',
        'step_8_subtopics',
        'step_9_articles'
      ]

      const isICPComplete = icpCompleteStatuses.includes(workflow.status)

      if (!isICPComplete) {
        return {
          allowed: false,
          icpStatus: workflow.status,
          workflowStatus: workflow.status,
          error: `ICP completion required before ${workflow.status}`,
          errorResponse: {
            error: `ICP completion required before ${workflow.status}`,
            workflowStatus: workflow.status,
            icpStatus: workflow.status,
            requiredAction: 'Complete ICP generation (step 1) before proceeding',
            currentStep: workflow.status,
            blockedAt: new Date().toISOString()
          }
        }
      }

      // ICP is complete - allow access
      return {
        allowed: true,
        icpStatus: workflow.status,
        workflowStatus: workflow.status
      }

    } catch (error) {
      console.error('Unexpected error in ICP gate validation:', error)
      // Fail open for availability
      return {
        allowed: true,
        icpStatus: 'error',
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
