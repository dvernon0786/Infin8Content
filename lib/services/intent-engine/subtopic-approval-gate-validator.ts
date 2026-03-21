import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

type KeywordRow = Database['public']['Tables']['keywords']['Row']

export interface SubtopicApprovalInput {
  organizationId: string
  keywordId: string
  workflowId: string
}

export interface GateValidationResult {
  allowed: boolean
  reason: string
}

export interface SubtopicKeywordRow extends KeywordRow {
  subtopics_status: string
  subtopics: any[]
}

export class SubtopicApprovalGateValidator {
  async validateSubtopicApprovalGate(
    input: SubtopicApprovalInput
  ): Promise<GateValidationResult> {
    try {
      // Get keyword with subtopics
      const { data: keyword, error: keywordError } = await supabaseAdmin
        .from('keywords')
        .select('*')
        .eq('id', input.keywordId)
        .eq('organization_id', input.organizationId)
        .single()

      if (keywordError || !keyword) {
        return {
          allowed: false,
          reason: 'Gate evaluation failed – refusing state transition'
        }
      }

      const typedKeyword = keyword as SubtopicKeywordRow

      // Check if subtopics are generated
      if (typedKeyword.subtopics_status !== 'complete') {
        return {
          allowed: false,
          reason: 'Subtopics not yet generated'
        }
      }

      // Check if subtopics exist and are valid
      if (!typedKeyword.subtopics || typedKeyword.subtopics.length === 0) {
        return {
          allowed: false,
          reason: 'No subtopics available for approval'
        }
      }

      // Check if already approved
      const { data: existingApproval } = await supabaseAdmin
        .from('intent_approvals')
        .select('id')
        .eq('organization_id', input.organizationId)
        .eq('entity_id', input.keywordId)
        .eq('entity_type', 'subtopics')
        .eq('decision', 'approved')
        .single()

      if (existingApproval) {
        return {
          allowed: false,
          reason: 'Subtopics already processed for approval'
        }
      }

      return {
        allowed: true,
        reason: 'Subtopics generated and ready for approval'
      }

    } catch (error) {
      return {
        allowed: false,
        reason: 'Gate evaluation failed – refusing state transition'
      }
    }
  }
}

export const subtopicApprovalGateValidator = new SubtopicApprovalGateValidator()
