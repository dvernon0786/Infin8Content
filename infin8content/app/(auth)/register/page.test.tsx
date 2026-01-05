/**
 * Registration Page Component Tests
 * 
 * Component tests for the registration page UI, form validation, and user interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import RegisterPage from './page'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock fetch for API calls
global.fetch = vi.fn()

describe('RegisterPage', () => {
  const mockPush = vi.fn()
  const mockRouter = {
    push: mockPush,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)
    global.fetch = vi.fn()
  })

  describe('Form Rendering', () => {
    it('should render registration form with email and password fields', () => {
      render(<RegisterPage />)

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password \*/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('should render confirm password field', () => {
      render(<RegisterPage />)

      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })

    it('should render "Sign in" link', () => {
      render(<RegisterPage />)

      expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
      expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate email format on blur', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid-email')
      await user.tab() // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })
    })

    it('should validate password minimum length on blur', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)

      const passwordInput = screen.getByLabelText(/^password \*/i)
      await user.type(passwordInput, 'short')
      await user.tab() // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it('should validate confirm password matches on blur', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)

      const passwordInput = screen.getByLabelText(/^password \*/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'different123')
      await user.tab() // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('should clear confirm password error when passwords match', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)

      const passwordInput = screen.getByLabelText(/^password \*/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'different123')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })

      await user.clear(confirmPasswordInput)
      await user.type(confirmPasswordInput, 'password123')
      await user.tab()

      await waitFor(() => {
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument()
      })
    })

    it('should clear validation errors when input is corrected', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })

      await user.clear(emailInput)
      await user.type(emailInput, 'valid@example.com')
      await user.tab()

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data and redirect to verification page', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          user: { id: 'user-id', email: 'test@example.com' },
          message: 'Account created. Please check your email for the verification code.',
        }),
      } as Response)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password \*/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/verify-email?email=test%40example.com')
      })
    })

    it('should display error message on registration failure', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'Unable to create account. Please try again.',
        }),
      } as Response)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password \*/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/unable to create account/i)).toBeInTheDocument()
      })
    })

    it('should prevent submission with invalid data', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password \*/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(emailInput, 'invalid-email')
      await user.type(passwordInput, 'short')
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled()
      })
    })

    it('should prevent submission when passwords do not match', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password \*/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'different123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled()
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)

      vi.mocked(global.fetch).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true, user: {} }),
                } as Response),
              100
            )
          )
      )

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password \*/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      expect(screen.getByText(/creating account/i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('should handle network errors', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)

      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password \*/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/an error occurred/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and error associations', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)

      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveAttribute('aria-invalid', 'false')
      expect(emailInput).not.toHaveAttribute('aria-describedby')

      await user.type(emailInput, 'invalid')
      await user.tab()

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error')
        expect(screen.getByText(/please enter a valid email address/i)).toHaveAttribute('id', 'email-error')
      })
    })

    it('should have proper ARIA attributes for confirm password field', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)

      const passwordInput = screen.getByLabelText(/^password \*/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      expect(confirmPasswordInput).toHaveAttribute('aria-invalid', 'false')
      expect(confirmPasswordInput).not.toHaveAttribute('aria-describedby')

      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'different123')
      await user.tab()

      await waitFor(() => {
        expect(confirmPasswordInput).toHaveAttribute('aria-invalid', 'true')
        expect(confirmPasswordInput).toHaveAttribute('aria-describedby', 'confirmPassword-error')
        expect(screen.getByText(/passwords do not match/i)).toHaveAttribute('id', 'confirmPassword-error')
      })
    })

    it('should support keyboard navigation', async () => {
      render(<RegisterPage />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password \*/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      emailInput.focus()
      expect(emailInput).toHaveFocus()

      // Tab to password
      await userEvent.tab()
      expect(passwordInput).toHaveFocus()

      // Tab to confirm password
      await userEvent.tab()
      expect(confirmPasswordInput).toHaveFocus()

      // Tab to submit button
      await userEvent.tab()
      expect(submitButton).toHaveFocus()
    })
  })
})

