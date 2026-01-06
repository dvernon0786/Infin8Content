/**
 * Audit Logs Table Component
 * Story 1.13: Audit Logging for Compliance
 */

'use client'

import { useState, useEffect } from 'react'
import { getAuditLogs, exportAuditLogsAsCSV, type GetAuditLogsResult } from '@/app/settings/organization/audit-logs-actions'
import type { AuditLog } from '@/types/audit'

export default function AuditLogsTable() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [actionFilter, setActionFilter] = useState('')
    const [exporting, setExporting] = useState(false)

    // Fetch logs
    useEffect(() => {
        async function fetchLogs() {
            try {
                setLoading(true)
                setError(null)
                const result: GetAuditLogsResult = await getAuditLogs({
                    page,
                    pageSize: 50,
                    actionFilter: actionFilter || undefined,
                })
                setLogs(result.logs)
                setTotalPages(result.totalPages)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load audit logs')
            } finally {
                setLoading(false)
            }
        }

        fetchLogs()
    }, [page, actionFilter])

    // Export as CSV
    async function handleExport() {
        try {
            setExporting(true)
            const csv = await exportAuditLogsAsCSV({
                actionFilter: actionFilter || undefined,
            })

            // Create download link
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `audit-logs-${new Date().toISOString()}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export audit logs')
        } finally {
            setExporting(false)
        }
    }

    // Format date
    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleString()
    }

    // Format action
    function formatAction(action: string) {
        return action.replace(/\./g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    }

    if (loading && logs.length === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Filters and Export */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <label htmlFor="action-filter" className="block text-sm font-medium text-gray-700 mb-1">
                        Filter by Action
                    </label>
                    <select
                        id="action-filter"
                        value={actionFilter}
                        onChange={(e) => {
                            setActionFilter(e.target.value)
                            setPage(1) // Reset to first page
                        }}
                        className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="">All Actions</option>
                        <option value="billing.subscription.created">Billing: Subscription Created</option>
                        <option value="billing.subscription.updated">Billing: Subscription Updated</option>
                        <option value="billing.subscription.canceled">Billing: Subscription Canceled</option>
                        <option value="billing.payment.succeeded">Billing: Payment Succeeded</option>
                        <option value="billing.payment.failed">Billing: Payment Failed</option>
                        <option value="team.invitation.sent">Team: Invitation Sent</option>
                        <option value="team.invitation.accepted">Team: Invitation Accepted</option>
                        <option value="team.invitation.revoked">Team: Invitation Revoked</option>
                        <option value="team.member.removed">Team: Member Removed</option>
                        <option value="role.changed">Role: Changed</option>
                    </select>
                </div>

                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                    {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Timestamp
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Action
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                IP Address
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    No audit logs found
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(log.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatAction(log.action)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                                        {JSON.stringify(log.details)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {log.ip_address || '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    <span className="text-sm text-gray-700">
                        Page {page} of {totalPages}
                    </span>

                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}
