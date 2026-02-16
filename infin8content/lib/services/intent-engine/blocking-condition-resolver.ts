/**
 * Blocking Condition Resolver Service
 * Story 39-7: Display Workflow Blocking Conditions
 *
 * Provides clear, actionable feedback when workflows are blocked at gates.
 * Explains what is required to unblock and provides direct links to required actions.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'
import { INTENT_WORKFLOW_STEPS } from '@/lib/constants/intent-workflow-steps'

export interface BlockingCondition {
  blocked_at_step: string
  blocking_gate: string
  blocking_reason: string
  required_action: string
  action_link: string
  blocked_since: string
  blocked_by_user_id?: string | null
}

export interface WorkflowData {
  id: string
  state: string
  organization_id: string
  seed_keywords_approved?: boolean
  subtopics_approved?: boolean
}

interface BlockingConditionMap {
  [step: string]: {
    gate_id: string
    blocking_reason: string
    required_action: string
    action_link_template: string
  }
}

export class BlockingConditionResolver {
  /**
   * Resolves blocking condition for a workflow
   * Returns null if workflow is not blocked
   */
  async resolveBlockingCondition(
    workflowId: string,
    organizationId: string
  ): Promise<BlockingCondition | null> {
    try {
      const supabase = createServiceRoleClient()

      // Query workflow status
      const { data: workflow, error: workflowError } = await supabase
        .from('intent_workflows')
        .select('id, state, organization_id, seed_keywords_approved, subtopics_approved')
        .eq('id', workflowId)
        .eq('organization_id', organizationId)
        .single() as { data: WorkflowData | null; error: any }

      if (workflowError || !workflow) {
        console.warn('Workflow not found:', { workflowId, organizationId, error: workflowError })
        return null
      }

      // Check if workflow is blocked
      const blockingCondition = this.checkBlockingCondition(workflow)

      if (blockingCondition) {
        // Log the blocking condition query for audit trail
        await this.logBlockingConditionQuery(workflowId, organizationId, blockingCondition)
      }

      return blockingCondition
    } catch (error) {
      console.error('Error resolving blocking condition:', error)
      return null
    }
  }

  /**
   * Checks if a workflow is blocked and returns the blocking condition
   */
  private checkBlockingCondition(workflow: WorkflowData): BlockingCondition | null {
    const map = this.getBlockingConditionMap()
    const currentStep = workflow.state

    // Check if current step has a blocking condition
    if (map[currentStep]) {
      const condition = map[currentStep]

      // Special case: seed approval gate
      if (condition.gate_id === 'gate_seeds_approval_required' && workflow.seed_keywords_approved) {
        return null // Not blocked - seeds are approved
      }

      // Special case: subtopic approval gate
      if (condition.gate_id === 'gate_subtopic_approval_required' && workflow.subtopics_approved) {
        return null // Not blocked - subtopics are approved
      }

      return this.formatBlockingCondition(
        workflow.id,
        currentStep,
        condition.gate_id,
        condition.blocking_reason,
        condition.required_action
      )
    }

    return null
  }

  /**
   * Returns the map of blocking conditions for each workflow step
   */
  getBlockingConditionMap(): BlockingConditionMap {
    return {
      [INTENT_WORKFLOW_STEPS.AUTH]: {
        gate_id: 'gate_icp_required',
        blocking_reason: 'ICP generation required before competitor analysis',
        required_action: 'Generate ICP document',
        action_link_template: '/workflows/{workflow_id}/steps/generate-icp',
      },
      [INTENT_WORKFLOW_STEPS.ICP]: {
        gate_id: 'gate_competitors_required',
        blocking_reason: 'Competitor analysis required before seed keywords',
        required_action: 'Analyze competitors',
        action_link_template: '/workflows/{workflow_id}/steps/analyze-competitors',
      },
      [INTENT_WORKFLOW_STEPS.KEYWORDS]: {
        gate_id: 'gate_seeds_approval_required',
        blocking_reason: 'Seed keywords must be approved before longtail expansion',
        required_action: 'Review and approve seeds',
        action_link_template: '/workflows/{workflow_id}/approvals/seeds',
      },
      [INTENT_WORKFLOW_STEPS.LONGTAILS]: {
        gate_id: 'gate_filtering_required',
        blocking_reason: 'Keyword filtering required before clustering',
        required_action: 'Filter keywords',
        action_link_template: '/workflows/{workflow_id}/steps/filter-keywords',
      },
      [INTENT_WORKFLOW_STEPS.FILTERING]: {
        gate_id: 'gate_clustering_required',
        blocking_reason: 'Clustering required before subtopic generation',
        required_action: 'Cluster keywords',
        action_link_template: '/workflows/{workflow_id}/steps/cluster-keywords',
      },
      [INTENT_WORKFLOW_STEPS.CLUSTERING]: {
        gate_id: 'gate_validation_required',
        blocking_reason: 'Cluster validation required before subtopics',
        required_action: 'Validate clusters',
        action_link_template: '/workflows/{workflow_id}/steps/validate-clusters',
      },
      [INTENT_WORKFLOW_STEPS.VALIDATION]: {
        gate_id: 'gate_subtopic_generation_required',
        blocking_reason: 'Subtopic generation required before approval',
        required_action: 'Generate subtopics',
        action_link_template: '/workflows/{workflow_id}/steps/generate-subtopics',
      },
      [INTENT_WORKFLOW_STEPS.SUBTOPICS]: {
        gate_id: 'gate_subtopic_approval_required',
        blocking_reason: 'Subtopics must be approved before article generation',
        required_action: 'Review and approve subtopics',
        action_link_template: '/workflows/{workflow_id}/approvals/subtopics',
      },
    }
  }

  /**
   * Formats a blocking condition with all required fields
   */
  formatBlockingCondition(
    workflowId: string,
    blockedAtStep: string,
    blockingGate: string,
    blockingReason: string,
    requiredAction: string
  ): BlockingCondition {
    const map = this.getBlockingConditionMap()
    const condition = map[blockedAtStep]

    return {
      blocked_at_step: blockedAtStep,
      blocking_gate: blockingGate,
      blocking_reason: blockingReason,
      required_action: requiredAction,
      action_link: condition.action_link_template.replace('{workflow_id}', workflowId),
      blocked_since: new Date().toISOString(),
    }
  }

  /**
   * Checks if a workflow is blocked
   */
  async isWorkflowBlocked(workflowId: string, organizationId: string): Promise<boolean> {
    const condition = await this.resolveBlockingCondition(workflowId, organizationId)
    return condition !== null
  }

  /**
   * Logs blocking condition query for audit trail
   */
  private async logBlockingConditionQuery(
    workflowId: string,
    organizationId: string,
    condition: BlockingCondition
  ): Promise<void> {
    try {
      await logIntentAction({
        organizationId,
        workflowId,
        entityType: 'workflow',
        entityId: workflowId,
        actorId: '00000000-0000-0000-0000-000000000000', // System actor UUID
        action: 'workflow.blocking_condition.queried',
        details: {
          blocked_at_step: condition.blocked_at_step,
          blocking_gate: condition.blocking_gate,
          blocking_reason: condition.blocking_reason,
          required_action: condition.required_action,
        },
        ipAddress: null,
        userAgent: null,
      })
    } catch (error) {
      console.error('Failed to log blocking condition query:', error)
      // Non-blocking - don't let logging failures affect the response
    }
  }
}
