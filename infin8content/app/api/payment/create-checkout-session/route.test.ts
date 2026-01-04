/**
 * Create Checkout Session API Route Tests
 * 
 * Unit tests for POST /api/payment/create-checkout-session endpoint
 * Tests cover validation, Stripe customer creation/retrieval, checkout session creation, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { createClient } from '@/lib/supabase/server'
import { validateStripeEnv } from '@/lib/stripe/env'
import { getPriceId } from '@/lib/stripe/prices'
import { stripe } from '@/lib/stripe/server'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/stripe/env')
vi.mock('@/lib/stripe/prices')

// Mock Stripe module - need to define mock inside factory function
vi.mock('@/lib/stripe/server', () => {
  const mockStripeInstance = {
    customers: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  }
  return {
    stripe: mockStripeInstance,
  }
})

describe('POST /api/payment/create-checkout-session', () => {
  let mockSupabase: any
  let mockRequest: Request

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    }
    
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(validateStripeEnv).mockReturnValue({
      STRIPE_SECRET_KEY: 'sk_test_123',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
      STRIPE_WEBHOOK_SECRET: 'whsec_123',
    })
    // Use a valid-length Stripe price ID (27+ characters)
    vi.mocked(getPriceId).mockReturnValue('price_1ABC123def456GHI789jkl012')
    
    // Reset Stripe mocks using the imported mocked stripe
    vi.mocked(stripe.customers.create).mockReset()
    vi.mocked(stripe.customers.retrieve).mockReset()
    vi.mocked(stripe.checkout.sessions.create).mockReset()
    
    // Set environment variable for app URL
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  })

  describe('Request Validation', () => {
    it('should validate plan enum', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-id', org_id: 'org-id', role: 'owner' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      mockRequest = new Request('http://localhost/api/payment/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'invalid-plan',
          billingFrequency: 'monthly',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should validate billingFrequency enum', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-id', org_id: 'org-id', role: 'owner' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      mockRequest = new Request('http://localhost/api/payment/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'starter',
          billingFrequency: 'invalid-frequency',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })

  describe('Authentication and Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      mockRequest = new Request('http://localhost/api/payment/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'starter',
          billingFrequency: 'monthly',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 400 if user has no organization', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-id', org_id: null, role: 'owner' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      mockRequest = new Request('http://localhost/api/payment/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'starter',
          billingFrequency: 'monthly',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('organization')
    })
  })

  describe('Stripe Customer Management', () => {
    it('should use existing Stripe customer if organization has stripe_customer_id', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockOrganization = {
        id: 'org-id',
        name: 'Test Org',
        plan: 'starter',
        stripe_customer_id: 'cus_existing',
        payment_status: 'pending_payment',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-id', org_id: 'org-id', role: 'owner' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      const mockOrgsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockOrganization,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsQuery)

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      })

      mockRequest = new Request('http://localhost/api/payment/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'starter',
          billingFrequency: 'monthly',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.url).toBe('https://checkout.stripe.com/test')
      expect(stripe.customers.create).not.toHaveBeenCalled()
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing',
        })
      )
    })

    it('should create new Stripe customer if organization has no stripe_customer_id', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockOrganization = {
        id: 'org-id',
        name: 'Test Org',
        plan: 'starter',
        stripe_customer_id: null,
        payment_status: 'pending_payment',
      }

      const mockNewCustomer = {
        id: 'cus_new_123',
        email: 'test@example.com',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-id', org_id: 'org-id', role: 'owner' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      const mockOrgsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockOrganization,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsQuery)

      vi.mocked(stripe.customers.create).mockResolvedValue(mockNewCustomer)

      const mockOrgsUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsUpdate)

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      })

      mockRequest = new Request('http://localhost/api/payment/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'starter',
          billingFrequency: 'monthly',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.url).toBe('https://checkout.stripe.com/test')
      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: {
          org_id: 'org-id',
          user_id: 'user-id',
        },
      })
      expect(mockOrgsUpdate.update).toHaveBeenCalledWith({
        stripe_customer_id: 'cus_new_123',
      })
    })
  })

  describe('Checkout Session Creation', () => {
    it('should create checkout session with correct parameters', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockOrganization = {
        id: 'org-id',
        name: 'Test Org',
        plan: 'starter',
        stripe_customer_id: 'cus_existing',
        payment_status: 'pending_payment',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-id', org_id: 'org-id', role: 'owner' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      const mockOrgsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockOrganization,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsQuery)

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      })

      mockRequest = new Request('http://localhost/api/payment/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'pro',
          billingFrequency: 'annual',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.url).toBe('https://checkout.stripe.com/test')
      expect(getPriceId).toHaveBeenCalledWith('pro', 'annual')
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_existing',
        mode: 'subscription',
        line_items: [
          {
            price: 'price_1ABC123def456GHI789jkl012',
            quantity: 1,
          },
        ],
        success_url: 'http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:3000/payment?canceled=true',
        metadata: {
          org_id: 'org-id',
          user_id: 'user-id',
          plan: 'pro',
          billing_frequency: 'annual',
        },
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle Stripe API errors', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockOrganization = {
        id: 'org-id',
        name: 'Test Org',
        plan: 'starter',
        stripe_customer_id: 'cus_existing',
        payment_status: 'pending_payment',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-id', org_id: 'org-id', role: 'owner' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      const mockOrgsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockOrganization,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsQuery)

      vi.mocked(stripe.checkout.sessions.create).mockRejectedValue(
        new Error('Stripe API error')
      )

      mockRequest = new Request('http://localhost/api/payment/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'starter',
          billingFrequency: 'monthly',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })

    it('should handle JSON parse errors', async () => {
      mockRequest = new Request('http://localhost/api/payment/create-checkout-session', {
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

