'use client'

import { useState } from 'react'

interface InviteTeamMemberFormProps {}

export default function InviteTeamMemberForm({}: InviteTeamMemberFormProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [errors, setErrors] = useState<{ email?: string; role?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrors((prev) => ({ ...prev, email: 'Invalid email address' }))
      return false
    }
    setErrors((prev) => ({ ...prev, email: undefined }))
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      return
    }

    setIsSubmitting(true)
    setSuccessMessage(null)
    setErrors({})

    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ email: data.error || 'Failed to send invitation' })
        return
      }

      // Show success message
      setSuccessMessage(`Invitation sent to ${email}`)

      // Reset form after successful submission
      setEmail('')
      setRole('editor')

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)

      // Refresh team members list (triggered by parent component)
      window.dispatchEvent(new Event('team-members-refresh'))
    } catch (error) {
      setErrors({ email: 'An error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {successMessage && (
        <div
          className="text-sm flex items-center gap-1 text-green-600 bg-green-50 p-3 rounded-md border border-green-200"
          role="alert"
          aria-live="polite"
        >
          <span aria-hidden="true">✓</span> {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-900">
            Email Address *
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => validateEmail(email)}
            className="mt-1 block w-full px-3 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={isSubmitting}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm flex items-center gap-1 text-red-600">
              <span aria-hidden="true">⚠</span> {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-900">
            Role *
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
            className="mt-1 block w-full px-3 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={isSubmitting}
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {role === 'editor'
              ? 'Can create, edit, and manage content'
              : 'Can view content and reports'}
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
      </button>
    </form>
  )
}

