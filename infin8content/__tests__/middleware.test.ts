import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { checkOnboardingStatus } from '@/lib/guards/onboarding-guard'

// Mock the dependencies
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn()
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn()
}))

vi.mock('@/lib/guards/onboarding-guard', () => ({
  checkOnboardingStatus: vi.fn()
}))

vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: vi.fn()
}))

vi.mock('@/lib/utils/payment-status', () => ({
  getPaymentAccessStatus: vi.fn(),
  checkGracePeriodExpired: vi.fn()
}))

// Import middleware after mocking
let middleware: (request: NextRequest) => Promise<NextResponse>

describe('Onboarding Guard Middleware Integration', () => {
  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn()
  }

  const mockServiceSupabase = {
    from: vi.fn()
  }

  const mockResponse = {
    cookies: {
      getAll: vi.fn(),
      setAll: vi.fn()
    }
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(createServerClient).mockReturnValue(mockSupabaseClient)
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceSupabase)
    vi.mocked(checkOnboardingStatus).mockResolvedValue(true) // Default: onboarding completed
    
    // Import and mock updateSession
    const { updateSession } = await import('@/lib/supabase/middleware')
    vi.mocked(updateSession).mockResolvedValue(NextResponse.next())
    
    // Import middleware after all mocks are set up
    const middlewareModule = await import('../app/middleware')
    middleware = middlewareModule.middleware
  })

  describe('protected routes with authenticated user', () => {
    it('should allow access when onboarding is completed', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET'
      })

      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      // Mock user record with OTP verified and org_id
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { 
                id: 'user-record-123',
                otp_verified: true, 
                org_id: 'org-123' 
              },
              error: null
            })
          })
        })
      })

      // Mock organization with active payment
      mockServiceSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { 
                id: 'org-123',
                payment_status: 'active',
                onboarding_completed: true
              },
              error: null
            })
          })
        })
      })

      // Mock onboarding check to return true
      vi.mocked(checkOnboardingStatus).mockResolvedValue(true)

      const response = await middleware(request)

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled()
      expect(checkOnboardingStatus).toHaveBeenCalledWith('org-123')
    })

    it('should redirect to onboarding when onboarding is incomplete', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET'
      })

      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      // Mock user record with OTP verified and org_id
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { 
                id: 'user-record-123',
                otp_verified: true, 
                org_id: 'org-123' 
              },
              error: null
            })
          })
        })
      })

      // Mock organization with active payment but incomplete onboarding
      mockServiceSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { 
                id: 'org-123',
                payment_status: 'active',
                onboarding_completed: false
              },
              error: null
            })
          })
        })
      })

      // Mock onboarding check to return false
      vi.mocked(checkOnboardingStatus).mockResolvedValue(false)

      const response = await middleware(request)

      expect(response.status).toBe(307) // NextResponse.redirect uses 307 by default
      expect(response.headers.get('location')).toBe('http://localhost:3000/onboarding/business')
      expect(checkOnboardingStatus).toHaveBeenCalledWith('org-123')
    })

    it('should allow access to onboarding routes without onboarding check', async () => {
      const request = new NextRequest('http://localhost:3000/onboarding/business', {
        method: 'GET'
      })

      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      // Mock user record with OTP verified and org_id
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { 
                id: 'user-record-123',
                otp_verified: true, 
                org_id: 'org-123' 
              },
              error: null
            })
          })
        })
      })

      // Mock organization with active payment
      mockServiceSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { 
                id: 'org-123',
                payment_status: 'active',
                onboarding_completed: false // Incomplete onboarding should be ok for onboarding routes
              },
              error: null
            })
          })
        })
      })

      const response = await middleware(request)

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
      // Onboarding check should not be called for onboarding routes
      expect(checkOnboardingStatus).not.toHaveBeenCalled()
    })

    it('should allow access to billing routes without onboarding check', async () => {
      const request = new NextRequest('http://localhost:3000/billing', {
        method: 'GET'
      })

      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      // Mock user record with OTP verified and org_id
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { 
                id: 'user-record-123',
                otp_verified: true, 
                org_id: 'org-123' 
              },
              error: null
            })
          })
        })
      })

      const response = await middleware(request)

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
      // Onboarding check should not be called for billing routes
      expect(checkOnboardingStatus).not.toHaveBeenCalled()
    })
  })

  describe('route protection patterns', () => {
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/articles',
      '/articles',
      '/keywords',
      '/intent/workflows/123',
      '/intent/analysis'
    ]

    protectedRoutes.forEach(route => {
      it(`should check onboarding for protected route: ${route}`, async () => {
        const request = new NextRequest(`http://localhost:3000${route}`, {
          method: 'GET'
        })

        // Mock authenticated user with org
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null
        })

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { 
                  id: 'user-record-123',
                  otp_verified: true, 
                  org_id: 'org-123' 
                },
                error: null
              })
            })
          })
        })

        // Mock organization
        mockServiceSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { 
                  id: 'org-123',
                  payment_status: 'active'
                },
                error: null
              })
            })
          })
        })

        await middleware(request)

        expect(checkOnboardingStatus).toHaveBeenCalledWith('org-123')
      })
    })
  })

  describe('allowed routes without onboarding check', () => {
    const allowedRoutes = [
      '/onboarding/business',
      '/onboarding/complete',
      '/billing',
      '/settings/profile',
      '/logout'
    ]

    allowedRoutes.forEach(route => {
      it(`should not check onboarding for allowed route: ${route}`, async () => {
        const request = new NextRequest(`http://localhost:3000${route}`, {
          method: 'GET'
        })

        // Mock authenticated user
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null
        })

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { 
                  id: 'user-record-123',
                  otp_verified: true, 
                  org_id: 'org-123' 
                },
                error: null
              })
            })
          })
        })

        await middleware(request)

        expect(checkOnboardingStatus).not.toHaveBeenCalled()
      })
    })
  })

  describe('regression tests - existing authentication flows', () => {
    it('should still redirect unauthenticated users to login', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET'
      })

      // Mock unauthenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      })

      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?expired=true')
      expect(checkOnboardingStatus).not.toHaveBeenCalled()
    })

    it('should still redirect users with unverified OTP to verify-email', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET'
      })

      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      // Mock user record with unverified OTP
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { 
                id: 'user-record-123',
                otp_verified: false, 
                org_id: 'org-123' 
              },
              error: null
            })
          })
        })
      })

      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/verify-email?email=test%40example.com')
      expect(checkOnboardingStatus).not.toHaveBeenCalled()
    })

    it('should still allow access to public routes without authentication', async () => {
      const publicRoutes = ['/login', '/register', '/verify-email']

      for (const route of publicRoutes) {
        const request = new NextRequest(`http://localhost:3000${route}`, {
          method: 'GET'
        })

        // Mock unauthenticated user
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: 'No session' }
        })

        const response = await middleware(request)

        expect(response.status).toBe(200)
        expect(checkOnboardingStatus).not.toHaveBeenCalled()
      }
    })

    it('should still bypass onboarding check for users without org_id', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET'
      })

      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      // Mock user record without org_id
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { 
                id: 'user-record-123',
                otp_verified: true, 
                org_id: null 
              },
              error: null
            })
          })
        })
      })

      const response = await middleware(request)

      expect(response.status).toBe(200)
      expect(checkOnboardingStatus).not.toHaveBeenCalled()
    })
  })

  describe('performance optimization - request-scoped caching', () => {
    it('should not call checkOnboardingStatus multiple times for same request', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET'
      })

      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      // Mock user record with OTP verified and org_id
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { 
                id: 'user-record-123',
                otp_verified: true, 
                org_id: 'org-123' 
              },
              error: null
            })
          })
        })
      })

      // Mock organization
      mockServiceSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { 
                id: 'org-123',
                payment_status: 'active'
              },
              error: null
            })
          })
        })
      })

      await middleware(request)

      // Should only call checkOnboardingStatus once per request
      expect(checkOnboardingStatus).toHaveBeenCalledTimes(1)
    })
  })
})
