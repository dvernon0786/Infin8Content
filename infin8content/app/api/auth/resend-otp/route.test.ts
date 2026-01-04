/**
 * Resend OTP API Route Tests
 * 
 * Unit tests for POST /api/auth/resend-otp endpoint
 * Tests cover validation, user lookup, and OTP resend logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { createClient } from '@/lib/supabase/server'
import { generateOTP, storeOTPCode } from '@/lib/services/otp'
import { sendOTPEmail } from '@/lib/services/brevo'
import { checkOTPResendRateLimit } from '@/lib/utils/rate-limit'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/otp')
vi.mock('@/lib/services/brevo')
vi.mock('@/lib/utils/rate-limit')

describe('POST /api/auth/resend-otp', () => {
  let mockSupabase: any
  let mockRequest: Request

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(),
    }
    
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(generateOTP).mockReturnValue('654321')
    vi.mocked(storeOTPCode).mockResolvedValue(undefined)
    vi.mocked(sendOTPEmail).mockResolvedValue(undefined)
    // Mock rate limiting to allow by default
    vi.mocked(checkOTPResendRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 3,
      resetAt: new Date(Date.now() + 10 * 60 * 1000),
    })
  })

  describe('Request Validation', () => {
    it('should validate email format', async () => {
      mockRequest = new Request('http://localhost/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid email address')
    })

    it('should validate email is present', async () => {
      mockRequest = new Request('http://localhost/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })

  describe('User Lookup', () => {
    it('should return generic message if user not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'User not found' },
            }),
          }),
        }),
      })

      mockRequest = new Request('http://localhost/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('If an account exists')
    })

    it('should not resend if user is already verified', async () => {
      const mockUser = {
        id: 'user-id',
        otp_verified: true,
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      })

      mockRequest = new Request('http://localhost/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('already verified')
      expect(generateOTP).not.toHaveBeenCalled()
      expect(sendOTPEmail).not.toHaveBeenCalled()
    })
  })

  describe('Rate Limiting', () => {
    it('should reject request if rate limit exceeded', async () => {
      const mockUser = {
        id: 'user-id',
        otp_verified: false,
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(checkOTPResendRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 5 * 60 * 1000),
      })

      mockRequest = new Request('http://localhost/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain('Too many resend attempts')
      expect(data.rateLimit).toBeDefined()
      expect(generateOTP).not.toHaveBeenCalled()
      expect(sendOTPEmail).not.toHaveBeenCalled()
    })
  })

  describe('OTP Resend', () => {
    it('should generate and send new OTP code for unverified user', async () => {
      const mockUser = {
        id: 'user-id',
        otp_verified: false,
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      })

      mockRequest = new Request('http://localhost/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('Verification code has been sent')
      expect(generateOTP).toHaveBeenCalled()
      expect(storeOTPCode).toHaveBeenCalledWith('user-id', 'test@example.com', '654321')
      expect(sendOTPEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        otpCode: '654321',
      })
    })

    it('should handle OTP email send failures', async () => {
      const mockUser = {
        id: 'user-id',
        otp_verified: false,
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(sendOTPEmail).mockRejectedValue(new Error('Brevo API error'))

      mockRequest = new Request('http://localhost/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to send verification code')
    })
  })

  describe('Error Handling', () => {
    it('should handle Zod validation errors', async () => {
      mockRequest = new Request('http://localhost/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should handle internal server errors', async () => {
      vi.mocked(createClient).mockRejectedValue(new Error('Database connection failed'))

      mockRequest = new Request('http://localhost/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})

