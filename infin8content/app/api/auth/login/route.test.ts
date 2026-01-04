/**
 * Login API Route Tests
 * 
 * Unit tests for POST /api/auth/login endpoint
 * Tests cover validation, authentication, OTP verification, and redirect logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { createClient } from '@/lib/supabase/server'
import { validateSupabaseEnv } from '@/lib/supabase/env'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/supabase/env')

describe('POST /api/auth/login', () => {
  let mockSupabase: any
  let mockRequest: Request

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock Supabase client
    mockSupabase = {
      auth: {
        signInWithPassword: vi.fn(),
      },
      from: vi.fn(),
    }
    
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(validateSupabaseEnv).mockReturnValue(undefined)
  })

  describe('Request Validation', () => {
    it('should validate email format', async () => {
      mockRequest = new Request('http://localhost/api/auth/login', {
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

    it('should validate password is required', async () => {
      mockRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: '',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Password is required')
    })

    it('should validate email and password are present', async () => {
      mockRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })

  describe('Authentication', () => {
    it('should authenticate user with valid credentials', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockUserRecord = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'user',
        org_id: 'org-id',
        otp_verified: true,
      }

      const mockOrg = {
        id: 'org-id',
        name: 'Test Org',
        plan: 'pro',
      }

      // Mock successful authentication
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser, session: {} },
        error: null,
      })

      // Mock users table query
      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUserRecord,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      // Mock organizations table query
      const mockOrgsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockOrg,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsQuery)

      mockRequest = new Request('http://localhost/api/auth/login', {
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
      expect(data.user.email).toBe('test@example.com')
      expect(data.redirectTo).toBe('/dashboard')
    })

    it('should return generic error for invalid credentials', async () => {
      // Mock failed authentication
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      })

      mockRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid email or password')
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'wrongpassword',
      })
    })

    it('should return generic error when no user is returned', async () => {
      // Mock authentication with no user
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      })

      mockRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid email or password')
    })
  })

  describe('OTP Verification', () => {
    it('should redirect to verification page if OTP not verified', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockUserRecord = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'user',
        org_id: null,
        otp_verified: false,
      }

      // Mock successful authentication
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser, session: {} },
        error: null,
      })

      // Mock users table query
      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUserRecord,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      mockRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Email not verified')
      expect(data.redirectTo).toContain('/verify-email')
      expect(data.redirectTo).toContain(encodeURIComponent('test@example.com'))
    })
  })

  describe('Redirect Logic', () => {
    it('should redirect to create-organization if no org_id', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockUserRecord = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'user',
        org_id: null,
        otp_verified: true,
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser, session: {} },
        error: null,
      })

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUserRecord,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      mockRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.redirectTo).toBe('/create-organization')
    })

    it('should redirect to dashboard if organization exists', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockUserRecord = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'user',
        org_id: 'org-id',
        otp_verified: true,
      }

      const mockOrg = {
        id: 'org-id',
        name: 'Test Org',
        plan: 'pro',
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser, session: {} },
        error: null,
      })

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUserRecord,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      const mockOrgsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockOrg,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsQuery)

      mockRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.redirectTo).toBe('/dashboard')
    })

    it('should redirect to create-organization if org_id exists but organization not found', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockUserRecord = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'user',
        org_id: 'orphaned-org-id',
        otp_verified: true,
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser, session: {} },
        error: null,
      })

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUserRecord,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      const mockOrgsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Organization not found' },
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsQuery)

      mockRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.redirectTo).toBe('/create-organization')
    })
  })

  describe('Error Handling', () => {
    it('should handle user record query failure', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser, session: {} },
        error: null,
      })

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      mockRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Unable to load user information')
    })

    it('should handle JSON parse errors', async () => {
      mockRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: 'invalid json',
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})

