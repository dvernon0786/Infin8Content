import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AcceptInvitationClient from './accept-invitation-client'

interface AcceptInvitationPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function AcceptInvitationPage({ searchParams }: AcceptInvitationPageProps) {
  const params = await searchParams
  const token = params.token

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invitation</h1>
            <p className="text-gray-600">No invitation token provided.</p>
          </div>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  // Validate invitation token
  // RPC function returns SETOF (array), so we need to handle it properly
  const { data: invitationData, error: invitationError } = await supabase.rpc(
    'get_invitation_by_token' as any,
    { token_input: token }
  )

  if (invitationError || !invitationData || invitationData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invitation Not Found</h1>
            <p className="text-gray-600">
              This invitation link is invalid or has already been used.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Get first invitation (should only be one since token is unique)
  const invitation = invitationData[0]
  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invitation Not Found</h1>
            <p className="text-gray-600">
              This invitation link is invalid or has already been used.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Check expiration
  const expiresAt = new Date(invitation.expires_at)
  if (expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invitation Expired</h1>
            <p className="text-gray-600">
              This invitation has expired. Please request a new invitation from the organization
              owner.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Check status
  if (invitation.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invitation Already Used</h1>
            <p className="text-gray-600">
              This invitation has already been accepted or cancelled.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Check if user is authenticated
  const currentUser = await getCurrentUser()

  // If authenticated, we'll let the client component handle auto-acceptance
  // This avoids fetch issues in server components

  // Get inviter name
  const { data: inviter } = await supabase
    .from('users')
    .select('email')
    .eq('id', invitation.created_by)
    .single()

  // Get organization name separately
  const { data: organization } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', invitation.org_id)
    .single()

  const organizationName = organization?.name || 'the organization'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <AcceptInvitationClient
          invitation={{
            email: invitation.email,
            role: invitation.role,
            organizationName,
            inviterName: inviter?.email || 'the organization owner',
            token,
          }}
          isAuthenticated={!!currentUser}
        />
      </div>
    </div>
  )
}

