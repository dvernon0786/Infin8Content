import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

type WorkflowRow = Database['public']['Tables']['intent_workflows']['Row']

export interface BlockingConditionInput {
  workflowId: string
  organizationId: string
  currentStep: string
}

export interface BlockingConditionResult {
  allowed: boolean
  reason: string
  blockedBy?: string[]
}

export interface BlockingWorkflowRow extends WorkflowRow {
  step_metadata: Record<string, any>
}

export class BlockingConditionResolver {
  async resolveBlockingConditions(
    input: BlockingConditionInput
  ): Promise<BlockingConditionResult> {
    try {
      // Get workflow with current state
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

      const typedWorkflow = workflow as BlockingWorkflowRow
      const blockers: string[] = []

      // Check for required approvals
      const requiredApprovals = this.getRequiredApprovals(input.currentStep)
      for (const approvalType of requiredApprovals) {
        const hasApproval = await this.checkApprovalExists(
          input.organizationId,
          input.workflowId,
          approvalType
        )
        if (!hasApproval) {
          blockers.push(`Missing ${approvalType} approval`)
        }
      }

      // Check for required data completion
      const requiredData = this.getRequiredData(input.currentStep)
      for (const dataKey of requiredData) {
        if (!typedWorkflow.step_metadata[dataKey]) {
          blockers.push(`Missing required data: ${dataKey}`)
        }
      }

      const allowed = blockers.length === 0
      return {
        allowed,
        reason: allowed ? 'All conditions satisfied' : `Blocked by: ${blockers.join(', ')}`,
        blockedBy: allowed ? undefined : blockers
      }

    } catch (error) {
      return {
        allowed: false,
        reason: 'Gate evaluation failed – refusing state transition'
      }
    }
  }

  private async checkApprovalExists(
    organizationId: string,
    workflowId: string,
    entityType: string
  ): Promise<boolean> {
    try {
      const { data } = await supabaseAdmin
        .from('intent_approvals')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('workflow_id', workflowId)
        .eq('entity_type', entityType)
        .eq('decision', 'approved')
        .single()

      return !!data
    } catch {
      return false
    }
  }

  private getRequiredApprovals(step: string): string[] {
    const approvalMap: Record<string, string[]> = {
      'step_3_keywords': ['seed_keywords'],
      'step_8_subtopics': ['subtopics'],
      'step_7_validation': ['clusters']
    }
    return approvalMap[step] || []
  }

  private getRequiredData(step: string): string[] {
    const dataMap: Record<string, string[]> = {
      'step_2_competitors': ['competitor_analysis'],
      'step_4_longtails': ['seed_keywords_processed'],
      'step_5_filtering': ['longtails_generated'],
      'step_6_clustering': ['keywords_filtered']
    }
    return dataMap[step] || []
  }
}

export const blockingConditionResolver = new BlockingConditionResolver()
