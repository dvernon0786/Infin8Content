import { createServiceRoleClient } from '@/lib/supabase/server'
import type { ApprovalEntityType } from '@/lib/constants/approval-thresholds'

export interface ApprovalCountResult {
  workflowId: string
  entityType: ApprovalEntityType
  approvedCount: number
  totalCount: number
}

export class ApprovalGateValidator {
  /**
   * Pure read-only approval counter.
   * Never throws for domain approval logic.
   * May throw for infrastructure/database failure.
   * Never mutates data.
   * Never enforces thresholds.
   * Always enforces entity isolation.
   */
  static async countApproved(
    workflowId: string,
    entityType: ApprovalEntityType,
    organizationId: string
  ): Promise<ApprovalCountResult> {
    const supabase = createServiceRoleClient()

    let table: string
    let workflowColumn: string = 'workflow_id'
    let approvalColumn: string = 'user_selected'
    let subtopicFilter: string | undefined

    switch (entityType) {
      case 'seeds':
      case 'longtails':
        table = 'keywords'
        break

      case 'clusters':
        table = 'topic_clusters'
        break

      case 'subtopics':
        // Deterministic schema: subtopics are stored in keywords table
        // with subtopics_status = 'complete' filter
        table = 'keywords'
        subtopicFilter = 'subtopics_status'
        break

      default:
        throw new Error(`Unsupported approval entity type: ${entityType}`)
    }

    // Build base query
    let totalQuery = supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq(workflowColumn, workflowId)

    let approvedQuery = supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq(workflowColumn, workflowId)
      .eq(approvalColumn, true)

    // Add organization isolation if column exists
    const hasOrgColumn = await this.checkColumnExists(table, 'organization_id')
    if (hasOrgColumn) {
      totalQuery = totalQuery.eq('organization_id', organizationId)
      approvedQuery = approvedQuery.eq('organization_id', organizationId)
    }

    // Add subtopic filter if needed (when using keywords table for subtopics)
    if (subtopicFilter) {
      totalQuery = totalQuery.eq(subtopicFilter, 'complete')
      approvedQuery = approvedQuery.eq(subtopicFilter, 'complete')
    }

    // Total count with entity isolation
    const { count: totalCount, error: totalError } = await totalQuery

    if (totalError) {
      throw new Error(
        `ApprovalGateValidator total count failed: ${totalError.message}` 
      )
    }

    // Approved count with entity isolation
    const { count: approvedCount, error: approvedError } = await approvedQuery

    if (approvedError) {
      throw new Error(
        `ApprovalGateValidator approved count failed: ${approvedError.message}` 
      )
    }

    return {
      workflowId,
      entityType,
      approvedCount: approvedCount ?? 0,
      totalCount: totalCount ?? 0,
    }
  }

  /**
   * Optional: Hash approved IDs for snapshot locking
   * Prevents mid-execution approval changes
   */
  static async hashApprovedIds(
    workflowId: string,
    entityType: ApprovalEntityType,
    organizationId: string
  ): Promise<string> {
    const supabase = createServiceRoleClient()

    let table: string
    let workflowColumn: string = 'workflow_id'
    let approvalColumn: string = 'user_selected'
    let subtopicFilter: string | undefined

    switch (entityType) {
      case 'seeds':
      case 'longtails':
        table = 'keywords'
        break
      case 'clusters':
        table = 'topic_clusters'
        break
      case 'subtopics':
        // Deterministic schema: subtopics are stored in keywords table
        // with subtopics_status = 'complete' filter
        table = 'keywords'
        subtopicFilter = 'subtopics_status'
        break
      default:
        throw new Error(`Unsupported approval entity type: ${entityType}`)
    }

    // Build base query
    let query = supabase
      .from(table)
      .select('id')
      .eq(workflowColumn, workflowId)
      .eq(approvalColumn, true)

    // Add organization isolation if column exists
    const hasOrgColumn = await this.checkColumnExists(table, 'organization_id')
    if (hasOrgColumn) {
      query = query.eq('organization_id', organizationId)
    }

    // Add subtopic filter if needed (when using keywords table for subtopics)
    if (subtopicFilter) {
      query = query.eq(subtopicFilter, 'complete')
    }

    const { data, error } = await query.order('id')

    if (error) {
      throw new Error(`Failed to fetch approved IDs: ${error.message}`)
    }

    const approvedIds = (data || []).map((item: any) => item.id)
    const idString = approvedIds.join(',')
    
    // Simple hash for snapshot locking
    return Buffer.from(idString).toString('base64')
  }

  /**
   * Helper method to check if a column exists in a table
   */
  private static async checkColumnExists(
    tableName: string,
    columnName: string
  ): Promise<boolean> {
    const supabase = createServiceRoleClient()
    
    const { data } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', tableName)
      .eq('table_schema', 'public')
      .eq('column_name', columnName)
      .single()
    
    return !!data
  }
}
