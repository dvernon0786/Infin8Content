
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/app/middleware'
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

describe('Dashboard Access Control Integration Tests - Story 1.12', () => {
    type MockSupabaseClient = {
        auth: {
            getUser: ReturnType<typeof vi.fn>;
        };
        from: ReturnType<typeof vi.fn>;
    }

    let mockRequest: NextRequest
    let mockSupabase: MockSupabaseClient
    let mockResponse: { cookies: { getAll: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> }; headers: { get: ReturnType<typeof vi.fn> } }

    beforeEach(async () => {
        vi.clearAllMocks()

        // Mock Supabase client
        mockSupabase = {
            auth: {
                getUser: vi.fn(),
            },
            from: vi.fn(),
        }

        // Mock createServerClient
        vi.mocked(createServerClient).mockReturnValue(mockSupabase as ReturnType<typeof createServerClient>)

        // Mock updateSession
        mockResponse = {
            cookies: {
                getAll: vi.fn().mockReturnValue([]),
                set: vi.fn(),
            },
            headers: {
                get: vi.fn().mockReturnValue(null),
            },
        }

        const { updateSession } = await import('@/lib/supabase/middleware')
        vi.mocked(updateSession).mockResolvedValue(mockResponse as never)

        const { validateSupabaseEnv } = await import('@/lib/supabase/env')
        vi.mocked(validateSupabaseEnv).mockReturnValue(undefined)

        // Mock environment variables
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    })

    it('should redirect unauthenticated users to login', async () => {
        // Given: User is NOT authenticated
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: new Error('Auth session missing'),
        })

        mockRequest = new NextRequest('http://localhost:3000/dashboard', {
            method: 'GET',
        })

        // When: Middleware processes request
        const response = await middleware(mockRequest)

        // Then: Redirect to login
        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toContain('/login')
    })

    it('should redirect users with unverified email to verify-email', async () => {
        // Given: User is authenticated but OTP not verified
        const mockUser = { id: 'auth-user-id', email: 'test@example.com' }
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        })

        // Mock users table returning unverified user
        const mockUsersQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { id: 'user-id', otp_verified: false, org_id: null },
                error: null,
            }),
        }
        mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

        mockRequest = new NextRequest('http://localhost:3000/dashboard', {
            method: 'GET',
        })

        // When: Middleware checks OTP status
        const response = await middleware(mockRequest)

        // Then: Redirect to verify email
        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toContain('/verify-email')
    })

    it('should redirect unpaid users (pending_payment) to /payment', async () => {
        // Given: User is authenticated, verified, but payment is pending
        const mockUser = { id: 'auth-user-id', email: 'test@example.com' }
        const mockUserRecord = {
            id: 'user-id',
            email: 'test@example.com',
            role: 'owner',
            org_id: 'org-id',
            otp_verified: true,
        }
        const mockOrg = {
            id: 'org-id',
            payment_status: 'pending_payment', // PENDING PAYMENT
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
            .mockReturnValueOnce(mockUsersQuery) // users
            .mockReturnValueOnce(mockOrgsQuery) // orgs

        mockRequest = new NextRequest('http://localhost:3000/dashboard', {
            method: 'GET',
        })

        // When
        const response = await middleware(mockRequest)

        // Then
        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toContain('/payment')
    })

    it('should allow access for paid (active) users', async () => {
        // Given: User is authenticated, verified, and payment is active
        const mockUser = { id: 'auth-user-id', email: 'test@example.com' }
        const mockUserRecord = {
            id: 'user-id',
            email: 'test@example.com',
            role: 'owner',
            org_id: 'org-id',
            otp_verified: true,
        }
        const mockOrg = {
            id: 'org-id',
            payment_status: 'active', // ACTIVE
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

        // When
        const response = await middleware(mockRequest)

        // Then: No redirect, response allows access (status undefined or 200 in mock context, generally not 307)
        expect(response.status).not.toBe(307)
        expect(response.headers.get('location')).toBeNull()
    })

    it('should redirect suspended users to /suspended (Cross-check)', async () => {
        // Given: User is authenticated, verified, but suspended
        const mockUser = { id: 'auth-user-id', email: 'test@example.com' }
        const mockUserRecord = {
            id: 'user-id',
            email: 'test@example.com',
            role: 'owner',
            org_id: 'org-id',
            otp_verified: true,
        }
        const mockOrg = {
            id: 'org-id',
            payment_status: 'suspended',
            suspended_at: new Date().toISOString(),
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

        // When
        const response = await middleware(mockRequest)

        // Then
        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toContain('/suspended')
    })
})
