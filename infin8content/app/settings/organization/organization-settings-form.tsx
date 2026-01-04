'use client'

import { useState } from 'react'
import type { Database } from '@/lib/supabase/database.types'

type Organization = Database['public']['Tables']['organizations']['Row']

interface Props {
  organization: Organization
}

export default function OrganizationSettingsForm({ organization }: Props) {
  const [name, setName] = useState(organization.name)
  const [errors, setErrors] = useState<{ name?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const validateName = (name: string) => {
    if (name.length < 2) {
      setErrors((prev) => ({ ...prev, name: 'Organization name must be at least 2 characters' }))
      return false
    }
    if (name.length > 100) {
      setErrors((prev) => ({ ...prev, name: 'Organization name must be less than 100 characters' }))
      return false
    }
    setErrors((prev) => ({ ...prev, name: undefined }))
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateName(name)) {
      return
    }

    setIsSubmitting(true)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/organizations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ name: data.error || 'Failed to update organization' })
        return
      }

      // Show success message using toast notification pattern
      setSuccessMessage('Organization updated successfully')
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
      
      // Reload page to show updated name
      window.location.reload()
    } catch (error) {
      setErrors({ name: 'An error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMessage && (
        <div
          className="text-sm flex items-center gap-1 text-green-600 bg-green-50 p-3 rounded-md border border-green-200"
          role="alert"
          aria-live="polite"
        >
          <span aria-hidden="true">✓</span> {successMessage}
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-900">
          Organization Name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => validateName(name)}
          className="mt-1 block w-full px-3 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
          minLength={2}
          maxLength={100}
          disabled={isSubmitting}
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm flex items-center gap-1 text-red-600">
            <span aria-hidden="true">⚠</span> {errors.name}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}

