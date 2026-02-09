import { createServiceRoleClient } from '@/lib/supabase/server'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'
import { WORKFLOW_STEP_ORDER } from '@/lib/constants/intent-workflow-steps'

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
  status: string
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
      
      // Query workflow status
      let query = supabase
        .from('intent_workflows')
        .select('id, status, organization_id')
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
        // TRADE-OFF: Prioritizes system availability over strict gate enforcement
        // If database is temporarily unavailable, allows access to prevent cascading failures
        // Audit logging will capture the error state for investigation
        console.error('Database error in longtail gate validation:', workflowError)
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

      // Use canonical step ordering
      const currentIndex = WORKFLOW_STEP_ORDER.indexOf(workflow.status as any)
      const longtailIndex = WORKFLOW_STEP_ORDER.indexOf('step_4_longtails')
      const clusteringIndex = WORKFLOW_STEP_ORDER.indexOf('step_6_clustering')

      // Check if workflow has completed both longtails and clustering
      const longtailsComplete = currentIndex >= longtailIndex
      const clusteringComplete = currentIndex >= clusteringIndex

      // If workflow is before step_8_subtopics, check prerequisites
      if (currentIndex < WORKFLOW_STEP_ORDER.indexOf('step_8_subtopics')) {
        // Workflow hasn't reached subtopic step yet
        const missingPrerequisites = []

        if (!longtailsComplete) {
          missingPrerequisites.push('longtail expansion (step 4)')
        }

        if (!clusteringComplete) {
          missingPrerequisites.push('topic clustering (step 6)')
        }

        if (missingPrerequisites.length > 0) {
          return {
            allowed: false,
            longtailStatus: longtailsComplete ? 'complete' : 'not_complete',
            clusteringStatus: clusteringComplete ? 'complete' : 'not_complete',
            workflowStatus: workflow.status,
            error: `Longtail expansion and clustering required before subtopics. Missing: ${missingPrerequisites.join(', ')}`,
            errorResponse: {
              error: 'Longtail expansion and clustering required before subtopics',
              workflowStatus: workflow.status,
              longtailStatus: longtailsComplete ? 'complete' : 'not_complete',
              clusteringStatus: clusteringComplete ? 'complete' : 'not_complete',
              missingPrerequisites,
              requiredAction: 'Complete longtail expansion (step 4) and topic clustering (step 6) before subtopic generation',
              currentStep: 'subtopic-generation',
              blockedAt: new Date().toISOString()
            }
          }
        }
      }

      // Prerequisites are met - allow access
      return {
        allowed: true,
        longtailStatus: longtailsComplete ? 'complete' : 'not_complete',
        clusteringStatus: clusteringComplete ? 'complete' : 'not_complete',
        workflowStatus: workflow.status
      }

    } catch (error) {
      console.error('Unexpected error in longtail gate validation:', error)
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

      // Determine action based on result
      let action: string
      if (result.longtailStatus === 'error' || result.clusteringStatus === 'error') {
        action = 'workflow.gate.longtails_error'
      } else if (result.allowed) {
        action = 'workflow.gate.longtails_allowed'
      } else {
        action = 'workflow.gate.longtails_blocked'
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
          longtail_status: result.longtailStatus,
          clustering_status: result.clusteringStatus,
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
