/**
 * Registration API Route Tests
 * 
 * Unit tests for POST /api/auth/register endpoint
 * Tests cover validation, authentication, OTP generation, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { createClient } from '@/lib/supabase/server'
import { validateBrevoEnv } from '@/lib/supabase/env'
import { generateOTP, storeOTPCode } from '@/lib/services/otp'
import { sendOTPEmail } from '@/lib/services/brevo'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/supabase/env')
vi.mock('@/lib/services/otp')
vi.mock('@/lib/services/brevo')

describe('POST /api/auth/register', () => {
  let mockSupabase: any
  let mockRequest: Request

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock Supabase client
    mockSupabase = {
      auth: {
        signUp: vi.fn(),
      },
      from: vi.fn(),
    }
    
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(validateBrevoEnv).mockReturnValue('mock-api-key')
    vi.mocked(generateOTP).mockReturnValue('123456')
    vi.mocked(storeOTPCode).mockResolvedValue(undefined)
    vi.mocked(sendOTPEmail).mockResolvedValue(undefined)
  })

  describe('Request Validation', () => {
    it('should validate email format', async () => {
      mockRequest = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'password123',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid email address')
    })

    it('should validate password minimum length', async () => {
      mockRequest = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'short',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('at least 8 characters')
    })

    it('should validate email and password are present', async () => {
      mockRequest = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })

  describe('Brevo Environment Validation', () => {
    it('should validate BREVO_API_KEY before proceeding', async () => {
      vi.mocked(validateBrevoEnv).mockImplementation(() => {
        throw new Error('BREVO_API_KEY is not set')
      })

      mockRequest = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })
  })

  describe('User Registration', () => {
    it('should create user in Supabase Auth and users table', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockUserRecord = {
        id: 'user-id',
        email: 'test@example.com',
        auth_user_id: 'auth-user-id',
        role: 'owner',
        org_id: null,
        otp_verified: false,
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      const mockInsert = vi.fn().mockResolvedValue({
        data: mockUserRecord,
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserRecord,
              error: null,
            }),
          }),
        }),
      })

      mockRequest = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user).toEqual(mockAuthUser)
      expect(data.message).toContain('verification code')
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: undefined,
          data: {
            email_verified: false,
          },
        },
      })
      expect(generateOTP).toHaveBeenCalled()
      expect(storeOTPCode).toHaveBeenCalledWith('user-id', 'test@example.com', '123456')
      expect(sendOTPEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        otpCode: '123456',
      })
    })

    it('should handle Supabase Auth signup errors', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already exists' },
      })

      mockRequest = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Unable to create account')
    })

    it('should handle missing email in auth user', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: null,
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      mockRequest = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('email is missing')
    })

    it('should handle database insert failures', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      })

      mockRequest = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Account creation failed')
    })

    it('should handle OTP email send failures gracefully', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockUserRecord = {
        id: 'user-id',
        email: 'test@example.com',
        auth_user_id: 'auth-user-id',
        role: 'owner',
        org_id: null,
        otp_verified: false,
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserRecord,
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(sendOTPEmail).mockRejectedValue(new Error('Brevo API error'))

      mockRequest = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.message).toContain('verification email failed to send')
    })
  })

  describe('Error Handling', () => {
    it('should handle Zod validation errors', async () => {
      mockRequest = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid',
          password: '123',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should handle internal server errors', async () => {
      vi.mocked(createClient).mockRejectedValue(new Error('Database connection failed'))

      mockRequest = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
