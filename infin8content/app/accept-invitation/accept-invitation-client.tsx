'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AcceptInvitationClientProps {
  invitation: {
    email: string
    role: string
    organizationName: string
    inviterName: string
    token: string
  }
  isAuthenticated: boolean
}

export default function AcceptInvitationClient({
  invitation,
  isAuthenticated,
}: AcceptInvitationClientProps) {
  const router = useRouter()
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAcceptInvitation = async () => {
    setIsAccepting(true)
    setError(null)

    try {
      const response = await fetch('/api/team/accept-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: invitation.token }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to accept invitation')
        return
      }

      if (data.requiresRegistration) {
        // Redirect to registration with token
        router.push(data.redirectUrl)
        return
      }

      // Redirect to dashboard on success
      router.push(data.redirectUrl || '/dashboard')
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsAccepting(false)
    }
  }

  const roleDescription =
    invitation.role === 'editor'
      ? 'Editor - You can create, edit, and manage content'
      : 'Viewer - You can view content and reports'

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You've Been Invited!</h1>
        <p className="text-gray-600">
          <strong>{invitation.inviterName}</strong> has invited you to join{' '}
          <strong>{invitation.organizationName}</strong> on Infin8Content.
        </p>
      </div>

      <div className="bg-gray-50 rounded-md p-4 space-y-2">
        <div>
          <span className="text-sm font-medium text-gray-500">Email:</span>
          <span className="ml-2 text-sm text-gray-900">{invitation.email}</span>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500">Role:</span>
          <span className="ml-2 text-sm text-gray-900 capitalize">{invitation.role}</span>
          <p className="text-xs text-gray-500 mt-1">{roleDescription}</p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500">Organization:</span>
          <span className="ml-2 text-sm text-gray-900">{invitation.organizationName}</span>
        </div>
      </div>

      {error && (
        <div
          className="text-sm flex items-center gap-1 text-red-600 bg-red-50 p-3 rounded-md border border-red-200"
          role="alert"
          aria-live="polite"
        >
          <span aria-hidden="true">⚠</span> {error}
        </div>
      )}

      {!isAuthenticated ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            To accept this invitation, you'll need to create an account or log in.
          </p>
          <div className="flex gap-3">
            <a
              href={`/register?invitation_token=${invitation.token}`}
              className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Create Account
            </a>
            <a
              href={`/login?invitation_token=${invitation.token}&redirect=/accept-invitation?token=${invitation.token}`}
              className="flex-1 flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Log In
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleAcceptInvitation}
            disabled={isAccepting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAccepting ? 'Accepting Invitation...' : 'Accept Invitation'}
          </button>
        </div>
      )}
    </div>
  )
}

