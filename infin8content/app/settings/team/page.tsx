import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'
import TeamMembersList from './team-members-list'
import InviteTeamMemberForm from './invite-team-member-form'

export default async function TeamSettingsPage() {
  const currentUser = await getCurrentUser()

  // Authorization Check: Only owners can access team settings
  if (!currentUser || !currentUser.org_id || currentUser.role !== 'owner') {
    redirect('/settings/organization')
  }

  // Fetch team members list via API
  // Note: We'll fetch this on the client side in the component to keep it simple
  // Alternatively, we could fetch here and pass as props

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Team Settings</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Invite Team Member</h2>
            <InviteTeamMemberForm />
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Team Members</h2>
            <TeamMembersList />
          </div>
        </div>
      </div>
    </div>
  )
}

