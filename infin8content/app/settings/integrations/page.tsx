import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CmsConnectionsManager } from '@/components/settings/CmsConnectionsManager'

export default async function IntegrationsPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser || !currentUser.org_id) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
            <p className="text-sm text-gray-500 mt-1">
              Connect your publishing platforms to publish articles directly from Infin8Content.
            </p>
          </div>
          <Link
            href="/settings/organization"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Organization Settings
          </Link>
        </div>

        <CmsConnectionsManager orgId={currentUser.org_id} />
      </div>
    </div>
  )
}
