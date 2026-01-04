/**
 * OTP Verification API Route Tests
 * 
 * Unit tests for POST /api/auth/verify-otp endpoint
 * Tests cover validation, OTP verification, and user updates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { createClient } from '@/lib/supabase/server'
import { verifyOTPCode } from '@/lib/services/otp'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/otp')

describe('POST /api/auth/verify-otp', () => {
  let mockSupabase: any
  let mockRequest: Request

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(),
    }
    
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('Request Validation', () => {
    it('should validate email format', async () => {
      mockRequest = new Request('http://localhost/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          code: '123456',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid email address')
    })

    it('should validate OTP code is 6 digits', async () => {
      mockRequest = new Request('http://localhost/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          code: '12345',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('6 digits')
    })

    it('should validate email and code are present', async () => {
      mockRequest = new Request('http://localhost/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })

  describe('OTP Verification', () => {
    it('should verify valid OTP code and update user', async () => {
      const mockUser = {
        id: 'user-id',
        auth_user_id: 'auth-user-id',
      }

      vi.mocked(verifyOTPCode).mockResolvedValue({
        valid: true,
        userId: 'user-id',
      })

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

      mockRequest = new Request('http://localhost/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          code: '123456',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('verified successfully')
      expect(verifyOTPCode).toHaveBeenCalledWith('test@example.com', '123456')
    })

    it('should reject invalid OTP code', async () => {
      vi.mocked(verifyOTPCode).mockResolvedValue({
        valid: false,
      })

      mockRequest = new Request('http://localhost/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          code: '000000',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid or expired')
    })

    it('should reject expired OTP code', async () => {
      vi.mocked(verifyOTPCode).mockResolvedValue({
        valid: false,
      })

      mockRequest = new Request('http://localhost/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          code: '123456',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid or expired')
    })

    it('should handle user not found after OTP verification', async () => {
      vi.mocked(verifyOTPCode).mockResolvedValue({
        valid: true,
        userId: 'user-id',
      })

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

      mockRequest = new Request('http://localhost/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          code: '123456',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('User not found')
    })

    it('should handle missing auth_user_id', async () => {
      vi.mocked(verifyOTPCode).mockResolvedValue({
        valid: true,
        userId: 'user-id',
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-id', auth_user_id: null },
              error: null,
            }),
          }),
        }),
      })

      mockRequest = new Request('http://localhost/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          code: '123456',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('User not found')
    })
  })

  describe('Error Handling', () => {
    it('should handle Zod validation errors', async () => {
      mockRequest = new Request('http://localhost/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid',
          code: '123',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should handle internal server errors', async () => {
      vi.mocked(verifyOTPCode).mockRejectedValue(new Error('Database error'))

      mockRequest = new Request('http://localhost/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          code: '123456',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})

