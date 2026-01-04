/**
 * Verify Email (OTP) Page Component Tests
 * 
 * Component tests for the OTP verification page UI, form validation, and user interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useSearchParams } from 'next/navigation'
import VerifyOTPPage from './page'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock window.alert
global.alert = vi.fn()

describe('VerifyOTPPage', () => {
  const mockPush = vi.fn()
  const mockRouter = {
    push: mockPush,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn().mockReturnValue('test@example.com'),
    } as any)
    global.fetch = vi.fn()
  })

  describe('Form Rendering', () => {
    it('should render OTP verification form with code input', () => {
      render(<VerifyOTPPage />)

      expect(screen.getByText(/verify your email/i)).toBeInTheDocument()
      expect(screen.getByText(/6-digit verification code/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /verify email/i })).toBeInTheDocument()
    })

    it('should display email address from URL parameter', () => {
      render(<VerifyOTPPage />)

      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument()
    })

    it('should render resend code button', () => {
      render(<VerifyOTPPage />)

      expect(screen.getByText(/didn't receive the code/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument()
    })

    it('should render "Back to Registration" link', () => {
      render(<VerifyOTPPage />)

      expect(screen.getByText(/back to registration/i)).toBeInTheDocument()
    })
  })

  describe('OTP Input Validation', () => {
    it('should only accept numeric input', async () => {
      const user = userEvent.setup()
      render(<VerifyOTPPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
      })

      const otpInput = screen.getByLabelText(/verification code/i)
      await user.type(otpInput, 'abc123')

      expect(otpInput).toHaveValue('123')
    })

    it('should limit input to 6 digits', async () => {
      const user = userEvent.setup()
      render(<VerifyOTPPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
      })

      const otpInput = screen.getByLabelText(/verification code/i)
      await user.type(otpInput, '1234567890')

      expect(otpInput).toHaveValue('123456')
    })

    it('should disable submit button when code is not 6 digits', async () => {
      render(<VerifyOTPPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /verify email/i })).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /verify email/i })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when code is 6 digits', async () => {
      const user = userEvent.setup()
      render(<VerifyOTPPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
      })

      const otpInput = screen.getByLabelText(/verification code/i)
      const submitButton = screen.getByRole('button', { name: /verify email/i })

      expect(submitButton).toBeDisabled()

      await user.type(otpInput, '123456')

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe('OTP Verification', () => {
    it('should verify OTP code and show success message', async () => {
      const user = userEvent.setup()
      render(<VerifyOTPPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
      })

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Email verified successfully.',
        }),
      } as Response)

      const otpInput = screen.getByLabelText(/verification code/i)
      const submitButton = screen.getByRole('button', { name: /verify email/i })

      await user.type(otpInput, '123456')
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            code: '123456',
          }),
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/email verified/i)).toBeInTheDocument()
        expect(screen.getByText(/redirecting to dashboard/i)).toBeInTheDocument()
      })
    })

    it('should redirect to dashboard after successful verification', async () => {
      const user = userEvent.setup()
      
      render(<VerifyOTPPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
      })

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Email verified successfully.',
        }),
      } as Response)

      const otpInput = screen.getByLabelText(/verification code/i)
      const submitButton = screen.getByRole('button', { name: /verify email/i })

      await user.type(otpInput, '123456')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email verified/i)).toBeInTheDocument()
      }, { timeout: 3000 })

      // Wait for redirect (setTimeout in component)
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      }, { timeout: 3000 })
    })

    it('should display error message on verification failure', async () => {
      const user = userEvent.setup()
      render(<VerifyOTPPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
      })

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'Invalid or expired verification code.',
        }),
      } as Response)

      const otpInput = screen.getByLabelText(/verification code/i)
      const submitButton = screen.getByRole('button', { name: /verify email/i })

      await user.type(otpInput, '000000')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid or expired/i)).toBeInTheDocument()
      })
    })

    it('should show loading state during verification', async () => {
      const user = userEvent.setup()
      render(<VerifyOTPPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
      })

      let resolveFetch: (value: Response) => void
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve
      })

      vi.mocked(global.fetch).mockReturnValue(fetchPromise)

      const otpInput = screen.getByLabelText(/verification code/i)
      const submitButton = screen.getByRole('button', { name: /verify email/i })

      await user.type(otpInput, '123456')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/verifying/i)).toBeInTheDocument()
      })
      expect(submitButton).toBeDisabled()

      // Resolve the fetch to complete the test
      resolveFetch!({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
    })

    it('should handle missing email parameter', async () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn().mockReturnValue(null),
      } as any)

      const user = userEvent.setup()
      render(<VerifyOTPPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
      })

      const otpInput = screen.getByLabelText(/verification code/i)
      const submitButton = screen.getByRole('button', { name: /verify email/i })

      await user.type(otpInput, '123456')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email address is required/i)).toBeInTheDocument()
      })
    })
  })

  describe('Resend OTP', () => {
    it('should resend OTP code when resend button is clicked', async () => {
      const user = userEvent.setup()
      render(<VerifyOTPPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument()
      })

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          message: 'Verification code has been sent to your email.',
        }),
      } as Response)

      const resendButton = screen.getByRole('button', { name: /resend/i })
      await user.click(resendButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/resend-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
          }),
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/verification code has been sent/i)).toBeInTheDocument()
      })
    })

    it('should show loading state during resend', async () => {
      const user = userEvent.setup()
      render(<VerifyOTPPage />)

      vi.mocked(global.fetch).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ message: 'Code sent' }),
                } as Response),
              100
            )
          )
      )

      const resendButton = screen.getByRole('button', { name: /resend/i })
      await user.click(resendButton)

      expect(screen.getByText(/sending/i)).toBeInTheDocument()
      expect(resendButton).toBeDisabled()
    })

    it('should display error message on resend failure', async () => {
      const user = userEvent.setup()
      render(<VerifyOTPPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument()
      })

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'Failed to send verification code.',
        }),
      } as Response)

      const resendButton = screen.getByRole('button', { name: /resend/i })
      await user.click(resendButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to send verification code/i)).toBeInTheDocument()
      })
    })

    it('should handle network errors during resend', async () => {
      const user = userEvent.setup()
      render(<VerifyOTPPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument()
      })

      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

      const resendButton = screen.getByRole('button', { name: /resend/i })
      await user.click(resendButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to resend code/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and error associations', async () => {
      const user = userEvent.setup()
      render(<VerifyOTPPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
      })

      const otpInput = screen.getByLabelText(/verification code/i)
      expect(otpInput).toHaveAttribute('aria-invalid', 'false')
      expect(otpInput).not.toHaveAttribute('aria-describedby')

      // Type a code and then submit with an invalid response to trigger error
      await user.type(otpInput, '123456')
      
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'Invalid or expired verification code.',
        }),
      } as Response)

      const submitButton = screen.getByRole('button', { name: /verify email/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(otpInput).toHaveAttribute('aria-invalid', 'true')
        expect(otpInput).toHaveAttribute('aria-describedby', 'otp-error')
      })
    })

    it('should support keyboard navigation', async () => {
      render(<VerifyOTPPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
      })

      const otpInput = screen.getByLabelText(/verification code/i)
      const submitButton = screen.getByRole('button', { name: /verify email/i })

      // Verify elements are focusable
      expect(otpInput).toBeInTheDocument()
      expect(submitButton).toBeInTheDocument()
      
      // Verify input can be focused
      otpInput.focus()
      expect(document.activeElement).toBe(otpInput)
    })
  })
})

