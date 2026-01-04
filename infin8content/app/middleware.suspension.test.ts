/**
 * Middleware Suspension Flow Integration Tests
 * 
 * Integration tests for middleware suspension and reactivation flow
 * Story 1.9: Account Suspension and Reactivation Workflow
 * 
 * Tests cover:
 * - Suspended account redirect to /suspended
 * - Grace period expiration and suspension email sending
 * - Idempotency of suspension email
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from './middleware'
import { sendSuspensionEmail } from '@/lib/services/payment-notifications'
import { createServerClient } from '@supabase/ssr'

// Mock dependencies
vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: vi.fn(),
}))
vi.mock('@/lib/supabase/env', () => ({
  validateSupabaseEnv: vi.fn(),
}))
vi.mock('@/lib/services/payment-notifications', () => ({
  sendSuspensionEmail: vi.fn(),
}))
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

describe('Middleware Suspension Flow Integration Tests', () => {
  let mockRequest: NextRequest
  let mockSupabase: any
  let mockResponse: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    }

    // Mock createServerClient
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    // Mock updateSession to return a response
    mockResponse = {
      cookies: {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
      },
    }

    const { updateSession } = await import('@/lib/supabase/middleware')
    vi.mocked(updateSession).mockResolvedValue(mockResponse as any)

    const { validateSupabaseEnv } = await import('@/lib/supabase/env')
    vi.mocked(validateSupabaseEnv).mockReturnValue(undefined)

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  describe('Suspended Account Redirect', () => {
    it('should redirect suspended users to /suspended page', async () => {
      // Given: User is authenticated and account is suspended
      const mockUser = { id: 'auth-user-id', email: 'test@example.com' }
      const mockUserRecord = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'user',
        org_id: 'org-id',
        otp_verified: true,
      }
      const mockOrg = {
        id: 'org-id',
        payment_status: 'suspended',
        suspended_at: new Date().toISOString(),
        grace_period_started_at: null,
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
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

      const mockOrgsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockOrg,
          error: null,
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(mockUsersQuery) // users query
        .mockReturnValueOnce(mockOrgsQuery) // organizations query

      mockRequest = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
      })

      // When: Middleware processes request
      const response = await middleware(mockRequest)

      // Then: User should be redirected to /suspended
      expect(response.status).toBe(307) // Redirect status
      expect(response.headers.get('location')).toContain('/suspended')
    })

    it('should preserve original destination in redirect parameter', async () => {
      // Given: Suspended user tries to access /dashboard
      const mockUser = { id: 'auth-user-id', email: 'test@example.com' }
      const mockUserRecord = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'user',
        org_id: 'org-id',
        otp_verified: true,
      }
      const mockOrg = {
        id: 'org-id',
        payment_status: 'suspended',
        suspended_at: new Date().toISOString(),
        grace_period_started_at: null,
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
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

      const mockOrgsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockOrg,
          error: null,
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(mockUsersQuery)
        .mockReturnValueOnce(mockOrgsQuery)

      mockRequest = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
      })

      // When: Middleware processes request
      const response = await middleware(mockRequest)

      // Then: Redirect URL should include original destination
      const location = response.headers.get('location')
      expect(location).toContain('/suspended')
      expect(location).toContain('redirect=%2Fdashboard')
    })
  })

  describe('Grace Period Expiration and Suspension', () => {
    it('should suspend account and send email when grace period expires', async () => {
      // Given: Account is in grace period and 7 days have passed
      const gracePeriodStart = new Date()
      gracePeriodStart.setDate(gracePeriodStart.getDate() - 8) // 8 days ago

      const mockUser = { id: 'auth-user-id', email: 'test@example.com' }
      const mockUserRecord = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'user',
        org_id: 'org-id',
        otp_verified: true,
      }
      const mockOrg = {
        id: 'org-id',
        payment_status: 'past_due',
        grace_period_started_at: gracePeriodStart.toISOString(),
        suspended_at: null,
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
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

      const mockOrgsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockOrg,
          error: null,
        }),
      }

      // Mock update query for suspension
      const mockUpdateQuery = {
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }

      // Mock user email query for suspension email
      const mockUserEmailQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { email: 'test@example.com', name: 'Test User' },
          error: null,
        }),
      }

      // Mock query for idempotency check
      const mockIdempotencyQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            suspended_at: new Date().toISOString(), // Just set
          },
          error: null,
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(mockUsersQuery) // users query (OTP check)
        .mockReturnValueOnce(mockOrgsQuery) // organizations query (payment status)
        .mockReturnValueOnce({ update: vi.fn().mockReturnValue(mockUpdateQuery) }) // update suspension
        .mockReturnValueOnce(mockUserEmailQuery) // users query (email)
        .mockReturnValueOnce(mockIdempotencyQuery) // organizations query (idempotency)

      vi.mocked(sendSuspensionEmail).mockResolvedValue(undefined)

      mockRequest = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
      })

      // When: Middleware processes request
      const response = await middleware(mockRequest)

      // Then: Account should be suspended and email sent
      expect(mockSupabase.from).toHaveBeenCalled()
      expect(sendSuspensionEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        userName: 'Test User',
        suspensionDate: expect.any(Date),
      })
      expect(response.headers.get('location')).toContain('/suspended')
    })

    it('should not send duplicate suspension emails (idempotency check)', async () => {
      // Given: Account is already suspended (suspended_at set more than 1 second ago)
      const gracePeriodStart = new Date()
      gracePeriodStart.setDate(gracePeriodStart.getDate() - 8)

      const suspendedAt = new Date()
      suspendedAt.setSeconds(suspendedAt.getSeconds() - 2) // 2 seconds ago

      const mockUser = { id: 'auth-user-id', email: 'test@example.com' }
      const mockUserRecord = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'user',
        org_id: 'org-id',
        otp_verified: true,
      }
      const mockOrg = {
        id: 'org-id',
        payment_status: 'suspended',
        grace_period_started_at: gracePeriodStart.toISOString(),
        suspended_at: suspendedAt.toISOString(),
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
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

      const mockOrgsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockOrg,
          error: null,
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(mockUsersQuery)
        .mockReturnValueOnce(mockOrgsQuery)

      mockRequest = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
      })

      // When: Middleware processes request
      await middleware(mockRequest)

      // Then: Suspension email should NOT be sent (account already suspended)
      expect(sendSuspensionEmail).not.toHaveBeenCalled()
    })
  })

  describe('Grace Period Banner Access', () => {
    it('should allow access during grace period', async () => {
      // Given: Account is in grace period (not expired)
      const gracePeriodStart = new Date()
      gracePeriodStart.setDate(gracePeriodStart.getDate() - 2) // 2 days ago

      const mockUser = { id: 'auth-user-id', email: 'test@example.com' }
      const mockUserRecord = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'user',
        org_id: 'org-id',
        otp_verified: true,
      }
      const mockOrg = {
        id: 'org-id',
        payment_status: 'past_due',
        grace_period_started_at: gracePeriodStart.toISOString(),
        suspended_at: null,
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
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

      const mockOrgsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockOrg,
          error: null,
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(mockUsersQuery)
        .mockReturnValueOnce(mockOrgsQuery)

      mockRequest = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
      })

      // When: Middleware processes request
      const response = await middleware(mockRequest)

      // Then: User should have access (no redirect)
      expect(response.status).not.toBe(307)
      expect(response.headers.get('location')).toBeNull()
    })
  })
})

