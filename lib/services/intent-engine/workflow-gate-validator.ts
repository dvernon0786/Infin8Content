import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

type WorkflowRow = Database['public']['Tables']['intent_workflows']['Row']

export interface WorkflowGateInput {
  workflowId: string
  organizationId: string
  targetStep: string
}

export interface WorkflowGateResult {
  allowed: boolean
  reason: string
  currentState?: string
}

export interface GateWorkflowRow extends WorkflowRow {
  status: string
  current_step: string
}

export class WorkflowGateValidator {
  async validateWorkflowGate(
    input: WorkflowGateInput
  ): Promise<WorkflowGateResult> {
    try {
      // Get current workflow state
      const { data: workflow, error: workflowError } = await supabaseAdmin
        .from('intent_workflows')
        .select('*')
        .eq('id', input.workflowId)
        .eq('organization_id', input.organizationId)
        .single()

      if (workflowError || !workflow) {
        return {
          allowed: false,
          reason: 'Gate evaluation failed – refusing state transition'
        }
      }

      const typedWorkflow = workflow as GateWorkflowRow

      // Validate step transition is allowed
      const isAllowedTransition = this.isValidStepTransition(
        typedWorkflow.current_step,
        input.targetStep
      )

      if (!isAllowedTransition) {
        return {
          allowed: false,
          reason: `Invalid transition from ${typedWorkflow.current_step} to ${input.targetStep}`,
          currentState: typedWorkflow.current_step
        }
      }

      // Check if workflow is in a terminal state
      if (typedWorkflow.status === 'completed' || typedWorkflow.status === 'failed') {
        return {
          allowed: false,
          reason: 'Workflow is in terminal state',
          currentState: typedWorkflow.status
        }
      }

      return {
        allowed: true,
        reason: 'Valid workflow transition',
        currentState: typedWorkflow.current_step
      }

    } catch (error) {
      return {
        allowed: false,
        reason: 'Gate evaluation failed – refusing state transition'
      }
    }
  }

  private isValidStepTransition(fromStep: string, toStep: string): boolean {
    // Define allowed step transitions
    const validTransitions: Record<string, string[]> = {
      'step_1_icp': ['step_2_competitors'],
      'step_2_competitors': ['step_3_keywords'],
      'step_3_keywords': ['step_4_longtails'],
      'step_4_longtails': ['step_5_filtering'],
      'step_5_filtering': ['step_6_clustering'],
      'step_6_clustering': ['step_7_validation'],
      'step_7_validation': ['step_8_subtopics'],
      'step_8_subtopics': ['step_9_articles'],
      'step_9_articles': ['completed']
    }

    return validTransitions[fromStep]?.includes(toStep) || false
  }
}

export const workflowGateValidator = new WorkflowGateValidator()
