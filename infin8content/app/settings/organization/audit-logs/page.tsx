import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AuditLogsTable from '@/components/settings/audit-logs-table'

export default async function AuditLogsPage() {
    const currentUser = await getCurrentUser()

    // Redirect if not authenticated or no organization
    if (!currentUser || !currentUser.org_id) {
        redirect('/create-organization')
    }

    // Only organization owners can view audit logs
    if (currentUser.role !== 'owner') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-2xl mx-auto px-4">
                    <p className="text-center text-gray-600">Only organization owners can view audit logs</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            View all security-relevant actions in your organization
                        </p>
                    </div>
                    <Link
                        href="/settings/organization"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        ← Back to Settings
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <AuditLogsTable />
                </div>
            </div>
        </div>
    )
}
