/**
 * Login Page Component Tests
 * 
 * Component tests for the login page UI, form validation, and user interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useSearchParams } from 'next/navigation'
import LoginPage from './page'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

// Mock fetch for API calls
global.fetch = vi.fn()

describe('LoginPage', () => {
  const mockPush = vi.fn()
  const mockRouter = {
    push: mockPush,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    } as any)
  })

  describe('Form Rendering', () => {
    it('should render login form with email and password fields', () => {
      render(<LoginPage />)

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should render "Forgot password?" link', () => {
      render(<LoginPage />)

      expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
    })

    it('should render "Register" link', () => {
      render(<LoginPage />)

      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
      expect(screen.getByText(/register/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate email format on blur', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid-email')
      await user.tab() // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })
    })

    it('should validate password is required on blur', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const passwordInput = screen.getByLabelText(/password/i)
      await user.click(passwordInput)
      await user.tab() // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })

    it('should clear email error when valid email is entered', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })

      await user.clear(emailInput)
      await user.type(emailInput, 'test@example.com')
      await user.tab()

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid credentials', async () => {
      const user = userEvent.setup()
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { id: '1', email: 'test@example.com', role: 'user' },
          redirectTo: '/dashboard',
        }),
      } as Response)

      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should display error message on failed login', async () => {
      const user = userEvent.setup()
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Invalid email or password',
        }),
      } as Response)

      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(fetch).mockReturnValueOnce(promise as any)

      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument()
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

      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
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

      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/an error occurred/i)).toBeInTheDocument()
      })
    })
  })

  describe('Session Expiration', () => {
    it('should display expiration message when expired=true query param is present', () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn().mockReturnValue('true'),
      } as any)

      render(<LoginPage />)

      expect(screen.getByText(/your session has expired/i)).toBeInTheDocument()
    })

    it('should not display expiration message when expired param is not present', () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn().mockReturnValue(null),
      } as any)

      render(<LoginPage />)

      expect(screen.queryByText(/your session has expired/i)).not.toBeInTheDocument()
    })
  })

  describe('Redirect Handling', () => {
    it('should redirect to verify-email when email not verified', async () => {
      const user = userEvent.setup()
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Email not verified',
          redirectTo: '/verify-email?email=test@example.com',
        }),
      } as Response)

      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/verify-email?email=test@example.com')
      })
    })

    it('should redirect to create-organization when no organization', async () => {
      const user = userEvent.setup()
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          redirectTo: '/create-organization',
        }),
      } as Response)

      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/create-organization')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)

      expect(emailInput).toHaveAttribute('id')
      expect(passwordInput).toHaveAttribute('id')
    })

    it('should have ARIA attributes for error messages', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid')
      await user.tab()

      await waitFor(() => {
        const errorMessage = screen.getByText(/please enter a valid email address/i)
        expect(errorMessage).toHaveAttribute('id', 'email-error')
        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error')
      })
    })
  })
})

