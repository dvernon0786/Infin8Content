/**
 * Server actions for audit logs
 * Story 1.13: Audit Logging for Compliance
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import type { AuditLog } from '@/types/audit'

export interface GetAuditLogsParams {
    page?: number
    pageSize?: number
    actionFilter?: string
    userFilter?: string
}

export interface GetAuditLogsResult {
    logs: AuditLog[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
}

/**
 * Get audit logs for the current user's organization
 * Only accessible by organization owners
 */
export async function getAuditLogs(params: GetAuditLogsParams = {}): Promise<GetAuditLogsResult> {
    const { page = 1, pageSize = 50, actionFilter, userFilter } = params

    // Get current user and verify they are an owner
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id || currentUser.role !== 'owner') {
        throw new Error('Unauthorized: Only organization owners can view audit logs')
    }

    const supabase = await createClient()

    // Build query
    let query = supabase
        .from('audit_logs' as any)
        .select('*', { count: 'exact' })
        .eq('org_id', currentUser.org_id)
        .order('created_at', { ascending: false })

    // Apply filters
    if (actionFilter) {
        query = query.eq('action', actionFilter)
    }

    if (userFilter) {
        query = query.eq('user_id', userFilter)
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
        console.error('Failed to fetch audit logs:', error)
        throw new Error('Failed to fetch audit logs')
    }

    const totalCount = count ?? 0
    const totalPages = Math.ceil(totalCount / pageSize)

    return {
        logs: (data as unknown as AuditLog[]) ?? [],
        totalCount,
        page,
        pageSize,
        totalPages,
    }
}

/**
 * Export audit logs as CSV
 * Only accessible by organization owners
 */
export async function exportAuditLogsAsCSV(params: GetAuditLogsParams = {}): Promise<string> {
    const { actionFilter, userFilter } = params

    // Get current user and verify they are an owner
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id || currentUser.role !== 'owner') {
        throw new Error('Unauthorized: Only organization owners can export audit logs')
    }

    const supabase = await createClient()

    // Build query (no pagination for export)
    let query = supabase
        .from('audit_logs' as any)
        .select('*')
        .eq('org_id', currentUser.org_id)
        .order('created_at', { ascending: false })

    // Apply filters
    if (actionFilter) {
        query = query.eq('action', actionFilter)
    }

    if (userFilter) {
        query = query.eq('user_id', userFilter)
    }

    const { data, error } = await query

    if (error) {
        console.error('Failed to export audit logs:', error)
        throw new Error('Failed to export audit logs')
    }

    const logs = (data as unknown as AuditLog[]) ?? []

    // Convert to CSV with proper formatting
    // Headers match data column order exactly
    const headers = ['Timestamp', 'User ID', 'Action', 'Details', 'IP Address', 'User Agent']
    const csvRows: string[] = []

    // Helper function to escape CSV fields
    const escapeCsvField = (field: unknown): string => {
        if (field === null || field === undefined) {
            return ''
        }
        const str = String(field)
        // Escape quotes by doubling them, then wrap in quotes
        return `"${str.replace(/"/g, '""')}"`
    }

    // Add header row
    csvRows.push(headers.map((h) => escapeCsvField(h)).join(','))

    // Add data rows
    for (const log of logs) {
        const row = [
            log.created_at || '',
            log.user_id || '',
            log.action || '',
            JSON.stringify(log.details || {}),
            log.ip_address || '',
            log.user_agent || '',
        ]
        csvRows.push(row.map(escapeCsvField).join(','))
    }

    return csvRows.join('\n')
}
