'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDiagnostic } from '@/components/layout-diagnostic'

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '448px', width: '100%', padding: '32px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', margin: '0 16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', color: '#111827', marginBottom: '8px' }}>Create Organization</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginBottom: '32px' }}>
          Create your organization to get started with Infin8Content
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label htmlFor="name" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
              Organization Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ 
                display: 'block', 
                width: '100%', 
                padding: '12px', 
                fontSize: '16px', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                outline: 'none',
                transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
              }}
              onFocus={(e) => {
                const target = e.target as HTMLInputElement
                target.style.borderColor = '#3b82f6'
                target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                const target = e.target as HTMLInputElement
                target.style.borderColor = '#d1d5db'
                target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                validateName(name)
              }}
              required
              minLength={2}
              maxLength={100}
              disabled={isSubmitting}
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" style={{ marginTop: '4px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626' }}>
                <span aria-hidden="true">⚠</span> {errors.name}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '6px',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              fontSize: '14px',
              fontWeight: '500',
              color: 'white',
              backgroundColor: isSubmitting ? '#9ca3af' : '#3b82f6',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease-in-out'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                const target = e.target as HTMLButtonElement
                target.style.backgroundColor = '#2563eb'
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                const target = e.target as HTMLButtonElement
                target.style.backgroundColor = '#3b82f6'
              }
            }}
          >
            {isSubmitting ? 'Creating Organization...' : 'Create Organization'}
          </button>
        </form>
      </div>
      <LayoutDiagnostic />
    </div>
  )
}

