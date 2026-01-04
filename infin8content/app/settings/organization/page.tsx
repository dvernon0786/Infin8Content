import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import OrganizationSettingsForm from './organization-settings-form'

export default async function OrganizationSettingsPage() {
  const currentUser = await getCurrentUser()
  
  // Redirect if not authenticated or no organization
  if (!currentUser || !currentUser.org_id) {
    redirect('/create-organization')
  }
  
  if (!currentUser.organizations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-center text-gray-600">Organization not found</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
          {currentUser.role === 'owner' && (
            <Link
              href="/settings/team"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Team Settings →
            </Link>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Organization Details</h2>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Plan</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{currentUser.organizations.plan}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(currentUser.organizations.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          <OrganizationSettingsForm organization={currentUser.organizations} />
        </div>
      </div>
    </div>
  )
}

