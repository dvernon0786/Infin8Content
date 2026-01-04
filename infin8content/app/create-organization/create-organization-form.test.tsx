/**
 * Organization Creation Form Component Tests
 * 
 * Component tests for the organization creation form UI, form validation, and user interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import CreateOrganizationForm from './create-organization-form'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock fetch for API calls
global.fetch = vi.fn()

describe('CreateOrganizationForm', () => {
  const mockPush = vi.fn()
  const mockRouter = {
    push: mockPush,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)
  })

  describe('Form Rendering', () => {
    it('should render organization creation form with name field', () => {
      render(<CreateOrganizationForm />)

      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create organization/i })).toBeInTheDocument()
    })

    it('should render form title and description', () => {
      render(<CreateOrganizationForm />)

      expect(screen.getByRole('heading', { name: /create organization/i })).toBeInTheDocument()
      expect(screen.getByText(/create your organization to get started/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate organization name minimum length on blur', async () => {
      const user = userEvent.setup()
      render(<CreateOrganizationForm />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'A')
      await user.tab() // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/organization name must be at least 2 characters/i)).toBeInTheDocument()
      })
    })

    it('should validate organization name maximum length on blur', async () => {
      const user = userEvent.setup()
      const { container } = render(<CreateOrganizationForm />)

      const nameInput = screen.getByLabelText(/organization name/i) as HTMLInputElement
      // Type exactly 100 characters (valid)
      const validName = 'A'.repeat(100)
      await user.type(nameInput, validName)
      await user.tab() // Trigger blur

      // Should not show error for 100 characters
      await waitFor(() => {
        expect(screen.queryByText(/organization name must be less than 100 characters/i)).not.toBeInTheDocument()
      })

      // Test validation logic: programmatically set value to 101 characters
      // This simulates what would happen if maxlength wasn't enforced
      const longName = 'A'.repeat(101)
      // Use fireEvent to directly set the value and trigger onChange
      const { fireEvent } = await import('@testing-library/react')
      fireEvent.change(nameInput, { target: { value: longName } })
      fireEvent.blur(nameInput)

      await waitFor(() => {
        expect(screen.getByText(/organization name must be less than 100 characters/i)).toBeInTheDocument()
      })
    })

    it('should clear error when valid name is entered', async () => {
      const user = userEvent.setup()
      render(<CreateOrganizationForm />)

      const nameInput = screen.getByLabelText(/organization name/i)
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
            id: 'org-1',
            name: 'Test Organization',
            plan: 'starter',
            created_at: '2024-01-01T00:00:00Z',
          },
          redirectTo: '/dashboard',
        }),
      } as Response)

      render(<CreateOrganizationForm />)

      await user.type(screen.getByLabelText(/organization name/i), 'Test Organization')
      await user.click(screen.getByRole('button', { name: /create organization/i }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/organizations/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Organization',
          }),
        })
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should display error message on failed organization creation', async () => {
      const user = userEvent.setup()
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'An organization with this name already exists',
        }),
      } as Response)

      render(<CreateOrganizationForm />)

      await user.type(screen.getByLabelText(/organization name/i), 'Existing Org')
      await user.click(screen.getByRole('button', { name: /create organization/i }))

      await waitFor(() => {
        expect(screen.getByText(/an organization with this name already exists/i)).toBeInTheDocument()
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(fetch).mockReturnValueOnce(promise as any)

      render(<CreateOrganizationForm />)

      await user.type(screen.getByLabelText(/organization name/i), 'Test Org')
      await user.click(screen.getByRole('button', { name: /create organization/i }))

      await waitFor(() => {
        expect(screen.getByText(/creating organization/i)).toBeInTheDocument()
        expect(screen.getByRole('button')).toBeDisabled()
      })

      resolvePromise!({
        ok: true,
        json: async () => ({ success: true, redirectTo: '/dashboard' }),
      } as Response)
    })

    it('should prevent duplicate submissions', async () => {
      const user = userEvent.setup()
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(fetch).mockReturnValueOnce(promise as any)

      render(<CreateOrganizationForm />)

      await user.type(screen.getByLabelText(/organization name/i), 'Test Org')
      
      const submitButton = screen.getByRole('button', { name: /create organization/i })
      await user.click(submitButton)
      await user.click(submitButton) // Try to submit again

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1) // Only one API call
      })

      resolvePromise!({
        ok: true,
        json: async () => ({ success: true, redirectTo: '/dashboard' }),
      } as Response)
    })

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup()
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      render(<CreateOrganizationForm />)

      await user.type(screen.getByLabelText(/organization name/i), 'Test Org')
      await user.click(screen.getByRole('button', { name: /create organization/i }))

      await waitFor(() => {
        expect(screen.getByText(/an error occurred/i)).toBeInTheDocument()
      })
    })

    it('should not submit form with invalid name', async () => {
      const user = userEvent.setup()
      render(<CreateOrganizationForm />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'A') // Too short
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/organization name must be at least 2 characters/i)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /create organization/i }))

      await waitFor(() => {
        expect(fetch).not.toHaveBeenCalled()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      render(<CreateOrganizationForm />)

      const nameInput = screen.getByLabelText(/organization name/i)
      expect(nameInput).toHaveAttribute('id')
    })

    it('should have ARIA attributes for error messages', async () => {
      const user = userEvent.setup()
      render(<CreateOrganizationForm />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'A')
      await user.tab()

      await waitFor(() => {
        const errorMessage = screen.getByText(/organization name must be at least 2 characters/i)
        expect(errorMessage).toBeInTheDocument()
        expect(nameInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<CreateOrganizationForm />)

      const nameInput = screen.getByLabelText(/organization name/i)
      await user.tab()
      expect(nameInput).toHaveFocus()

      await user.tab()
      const submitButton = screen.getByRole('button', { name: /create organization/i })
      expect(submitButton).toHaveFocus()
    })
  })
})

