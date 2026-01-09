'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateOrganizationForm() {
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<{ name?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Form validation - validate on blur
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
    if (!validateName(name)) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        credentials: 'include',
      })

      const data = await response.json()
      if (!response.ok) {
        setErrors({ name: data.error || 'Failed to create organization' })
        return
      }

      router.push(data.redirectTo || '/dashboard')
    } catch (error) {
      setErrors({ name: 'An error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Form UI - match Story 1.3/1.4 styling exactly
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center text-gray-900">Create Organization</h1>
        <p className="text-center text-gray-600 text-sm">
          Create your organization to get started with Infin8Content
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
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
            {isSubmitting ? 'Creating Organization...' : 'Create Organization'}
          </button>
        </form>
      </div>
    </div>
  )
}

