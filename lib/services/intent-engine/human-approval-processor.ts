import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

type ApprovalRecord = Database['public']['Tables']['intent_approvals']['Row']

export interface HumanApprovalInput {
  organizationId: string
  workflowId: string
  entityType: 'seed_keywords' | 'subtopics' | 'clusters'
  entityId: string
  decision: 'approved' | 'rejected'
  feedback?: string
  userId: string
}

export interface HumanApprovalResult {
  success: boolean
  approval?: ApprovalRecord
  error?: string
}

export class HumanApprovalProcessor {
  async processApproval(input: HumanApprovalInput): Promise<HumanApprovalResult> {
    try {
      const { data, error } = await supabaseAdmin
        .from('intent_approvals')
        .upsert({
          organization_id: input.organizationId,
          workflow_id: input.workflowId,
          entity_type: input.entityType,
          entity_id: input.entityId,
          decision: input.decision,
          feedback: input.feedback,
          decided_by: input.userId,
          decided_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, approval: data }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async getApproval(
    organizationId: string, 
    entityType: string, 
    entityId: string
  ): Promise<ApprovalRecord | null> {
    try {
      const { data } = await supabaseAdmin
        .from('intent_approvals')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .single()

      return data
    } catch {
      return null
    }
  }
}

export const humanApprovalProcessor = new HumanApprovalProcessor()
