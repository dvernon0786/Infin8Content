'use client'

import { useState, useEffect } from 'react'

interface TeamMember {
  id: string
  email: string
  role: string
  createdAt: string
}

interface PendingInvitation {
  id: string
  email: string
  role: string
  expiresAt: string
  createdAt: string
}

export default function TeamMembersList() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchTeamMembers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/team/members')
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load team members')
        return
      }

      setMembers(data.members || [])
      setPendingInvitations(data.pendingInvitations || [])
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamMembers()

    // Listen for refresh event from invite form
    const handleRefresh = () => {
      fetchTeamMembers()
    }
    window.addEventListener('team-members-refresh', handleRefresh)

    return () => {
      window.removeEventListener('team-members-refresh', handleRefresh)
    }
  }, [])

  const handleRoleChange = async (userId: string, newRole: 'editor' | 'viewer') => {
    try {
      const response = await fetch('/api/team/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update role')
        return
      }

      setSuccessMessage('Role updated successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
      fetchTeamMembers()
    } catch (error) {
      setError('An error occurred. Please try again.')
    }
  }

  const handleRemoveMember = async (userId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the team?`)) {
      return
    }

    try {
      const response = await fetch('/api/team/remove-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to remove member')
        return
      }

      setSuccessMessage('Member removed successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
      fetchTeamMembers()
    } catch (error) {
      setError('An error occurred. Please try again.')
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch('/api/team/resend-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to resend invitation')
        return
      }

      setSuccessMessage('Invitation resent successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
      fetchTeamMembers()
    } catch (error) {
      setError('An error occurred. Please try again.')
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return
    }

    try {
      const response = await fetch('/api/team/cancel-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to cancel invitation')
        return
      }

      setSuccessMessage('Invitation cancelled successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
      fetchTeamMembers()
    } catch (error) {
      setError('An error occurred. Please try again.')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-blue-100 text-blue-800'
      case 'editor':
        return 'bg-green-100 text-green-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return <div className="text-center text-gray-600 py-8">Loading team members...</div>
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div
          className="text-sm flex items-center gap-1 text-green-600 bg-green-50 p-3 rounded-md border border-green-200"
          role="alert"
          aria-live="polite"
        >
          <span aria-hidden="true">✓</span> {successMessage}
        </div>
      )}

      {error && (
        <div
          className="text-sm flex items-center gap-1 text-red-600 bg-red-50 p-3 rounded-md border border-red-200"
          role="alert"
          aria-live="polite"
        >
          <span aria-hidden="true">⚠</span> {error}
        </div>
      )}

      {/* Active Members */}
      <div>
        <h3 className="text-md font-medium text-gray-900 mb-3">Active Members</h3>
        {members.length === 0 ? (
          <p className="text-sm text-gray-500">No team members yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {member.email}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}
                      >
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <span aria-hidden="true">✓</span> Active
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {member.role !== 'owner' && (
                        <div className="flex gap-2">
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.id, e.target.value as 'editor' | 'viewer')
                            }
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                            disabled={member.role === 'owner'}
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(member.id, member.email)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">Pending Invitations</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingInvitations.map((invitation) => {
                  const expiresAt = new Date(invitation.expiresAt)
                  const isExpired = expiresAt < new Date()
                  return (
                    <tr key={invitation.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {invitation.email}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(invitation.role)}`}
                        >
                          {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <span aria-hidden="true">⏰</span> Pending
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {isExpired ? (
                          <span className="text-red-600">Expired</span>
                        ) : (
                          expiresAt.toLocaleDateString()
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResendInvitation(invitation.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            Resend
                          </button>
                          <button
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

