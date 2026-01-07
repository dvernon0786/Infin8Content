/**
 * Audit Logs Table Component
 * Story 1.13: Audit Logging for Compliance
 */

'use client'

import { useState, useEffect } from 'react'
import { getAuditLogs, exportAuditLogsAsCSV, type GetAuditLogsResult } from '@/app/settings/organization/audit-logs-actions'
import type { AuditLog } from '@/types/audit'

interface TeamMember {
    id: string
    email: string
    role: string
}

export default function AuditLogsTable() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [exportError, setExportError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [actionFilter, setActionFilter] = useState('')
    const [userFilter, setUserFilter] = useState('')
    const [users, setUsers] = useState<TeamMember[]>([])
    const [loadingUsers, setLoadingUsers] = useState(true)
    const [exporting, setExporting] = useState(false)

    // Fetch users for filter dropdown
    useEffect(() => {
        async function fetchUsers() {
            try {
                setLoadingUsers(true)
                const response = await fetch('/api/team/members')
                if (!response.ok) {
                    throw new Error('Failed to fetch users')
                }
                const data = await response.json()
                setUsers(data.members || [])
            } catch (err) {
                console.error('Failed to fetch users:', err)
                // Don't show error - filter will just be empty
            } finally {
                setLoadingUsers(false)
            }
        }

        fetchUsers()
    }, [])

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
                    userFilter: userFilter || undefined,
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
    }, [page, actionFilter, userFilter])

    // Export as CSV
    async function handleExport() {
        try {
            setExporting(true)
            setExportError(null)
            const csv = await exportAuditLogsAsCSV({
                actionFilter: actionFilter || undefined,
                userFilter: userFilter || undefined,
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
            const errorMessage = err instanceof Error ? err.message : 'Failed to export audit logs'
            setExportError(errorMessage)
            // Also show as toast/notification if available
            console.error('Export failed:', err)
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
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div className="flex gap-4 flex-1 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
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
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                            <option value="data.export.requested">Data: Export Requested</option>
                            <option value="account.deletion.requested">Account: Deletion Requested</option>
                        </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label htmlFor="user-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by User
                        </label>
                        <select
                            id="user-filter"
                            value={userFilter}
                            onChange={(e) => {
                                setUserFilter(e.target.value)
                                setPage(1) // Reset to first page
                            }}
                            disabled={loadingUsers}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                        >
                            <option value="">All Users</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.email} ({user.role})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                    {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
            </div>

            {/* Error Messages */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                </div>
            )}
            {exportError && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
                    Export Error: {exportError}
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
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                IP Address
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No audit logs found
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => {
                                const user = users.find((u) => u.id === log.user_id)
                                return (
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
                                            {user ? user.email : log.user_id || 'System'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {log.ip_address || '-'}
                                        </td>
                                    </tr>
                                )
                            })
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
