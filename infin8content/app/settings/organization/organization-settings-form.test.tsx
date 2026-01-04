/**
 * Organization Settings Form Component Tests
 * 
 * Component tests for the organization settings form UI, form validation, and user interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrganizationSettingsForm from './organization-settings-form'

// Mock fetch for API calls
global.fetch = vi.fn()

const mockOrganization = {
  id: 'org-1',
  name: 'Test Organization',
  plan: 'starter',
  white_label_settings: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('OrganizationSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Rendering', () => {
    it('should render organization settings form with name field', () => {
      render(<OrganizationSettingsForm organization={mockOrganization} />)

      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    })

    it('should pre-fill form with organization name', () => {
      render(<OrganizationSettingsForm organization={mockOrganization} />)

      const nameInput = screen.getByLabelText(/organization name/i) as HTMLInputElement
      expect(nameInput.value).toBe('Test Organization')
    })
  })

  describe('Form Validation', () => {
    it('should validate organization name minimum length on blur', async () => {
      const user = userEvent.setup()
      render(<OrganizationSettingsForm organization={mockOrganization} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'A')
      await user.tab() // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/organization name must be at least 2 characters/i)).toBeInTheDocument()
      })
    })

    it('should validate organization name maximum length on blur', async () => {
      const user = userEvent.setup()
      render(<OrganizationSettingsForm organization={mockOrganization} />)

      const nameInput = screen.getByLabelText(/organization name/i) as HTMLInputElement
      // Remove maxLength attribute temporarily to test validation
      nameInput.removeAttribute('maxLength')
      // Clear and type 101 characters (exceeds max)
      await user.clear(nameInput)
      await user.type(nameInput, 'A'.repeat(101))
      await user.tab() // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/organization name must be less than 100 characters/i)).toBeInTheDocument()
      })
    })

    it('should clear error when valid name is entered', async () => {
      const user = userEvent.setup()
      render(<OrganizationSettingsForm organization={mockOrganization} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'A')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/organization name must be at least 2 characters/i)).toBeInTheDocument()
      })

      await user.clear(nameInput)
      await user.type(nameInput, 'Valid Org Name')
      await user.tab()

      await waitFor(() => {
        expect(screen.queryByText(/organization name must be at least 2 characters/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid organization name', async () => {
      const user = userEvent.setup()
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          organization: {
            ...mockOrganization,
            name: 'Updated Organization',
          },
        }),
      } as Response)

      // Mock window.location.reload
      const originalReload = window.location.reload
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...window.location, reload: vi.fn() },
      })

      render(<OrganizationSettingsForm organization={mockOrganization} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Organization')
      await user.click(screen.getByRole('button', { name: /save changes/i }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/organizations/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Updated Organization',
          }),
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/organization updated successfully/i)).toBeInTheDocument()
      })

      // Restore original reload
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...window.location, reload: originalReload },
      })
    })

    it('should display error message on failed organization update', async () => {
      const user = userEvent.setup()
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'An organization with this name already exists',
        }),
      } as Response)

      render(<OrganizationSettingsForm organization={mockOrganization} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Existing Org')
      await user.click(screen.getByRole('button', { name: /save changes/i }))

      await waitFor(() => {
        expect(screen.getByText(/already exists/i)).toBeInTheDocument()
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(fetch).mockReturnValueOnce(promise as any)

      render(<OrganizationSettingsForm organization={mockOrganization} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Org')
      await user.click(screen.getByRole('button', { name: /save changes/i }))

      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument()
      })
      expect(screen.getByRole('button')).toBeDisabled()

      resolvePromise!({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
    })

    it('should prevent duplicate submissions', async () => {
      const user = userEvent.setup()
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(fetch).mockReturnValueOnce(promise as any)

      render(<OrganizationSettingsForm organization={mockOrganization} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Org')
      
      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(submitButton)
      await user.click(submitButton) // Try to submit again

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1) // Only one API call
      })

      resolvePromise!({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
    })

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup()
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      render(<OrganizationSettingsForm organization={mockOrganization} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Org')
      await user.click(screen.getByRole('button', { name: /save changes/i }))

      await waitFor(() => {
        expect(screen.getByText(/error occurred/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      render(<OrganizationSettingsForm organization={mockOrganization} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      expect(nameInput).toHaveAttribute('id')
    })

    it('should have ARIA attributes for error messages', async () => {
      const user = userEvent.setup()
      render(<OrganizationSettingsForm organization={mockOrganization} />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'A')
      await user.tab()

      await waitFor(() => {
        const errorMessage = screen.getByText(/organization name must be at least 2 characters/i)
        expect(errorMessage).toBeInTheDocument()
        expect(nameInput).toHaveAttribute('aria-invalid', 'true')
      })
    })
  })
})

