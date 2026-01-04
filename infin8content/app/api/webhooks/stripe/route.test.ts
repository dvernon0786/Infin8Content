/**
 * Stripe Webhook Handler Tests
 * 
 * Unit tests for POST /api/webhooks/stripe endpoint
 * Tests cover signature verification, idempotency, event handling, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { createClient } from '@/lib/supabase/server'
import { validateStripeEnv } from '@/lib/stripe/env'
import { stripe } from '@/lib/stripe/server'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/stripe/env')
vi.mock('@/lib/stripe/retry', () => ({
  retryWithBackoff: (fn: () => Promise<any>) => fn(), // Execute function immediately without retry in tests
}))

// Mock Stripe module - need to define mock inside factory function
vi.mock('@/lib/stripe/server', () => {
  const mockStripeInstance = {
    webhooks: {
      constructEvent: vi.fn(),
    },
    checkout: {
      sessions: {
        retrieve: vi.fn(),
      },
    },
  }
  return {
    stripe: mockStripeInstance,
  }
})

describe('POST /api/webhooks/stripe', () => {
  let mockSupabase: any
  let mockRequest: Request
  let mockStripeInstance: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(),
    }
    
    // Mock Stripe webhook instance
    mockStripeInstance = {
      webhooks: {
        constructEvent: vi.fn(),
      },
      checkout: {
        sessions: {
          retrieve: vi.fn(),
        },
      },
    }
    
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(validateStripeEnv).mockReturnValue({
      STRIPE_SECRET_KEY: 'sk_test_123',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
      STRIPE_WEBHOOK_SECRET: 'whsec_123',
    })
    
    // Reset Stripe mocks
    vi.mocked(stripe.webhooks.constructEvent).mockReset()
  })

  describe('Request Validation', () => {
    it('should return 400 if stripe-signature header is missing', async () => {
      mockRequest = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: 'test body',
      })

      const response = await POST(mockRequest)
      const text = await response.text()

      expect(response.status).toBe(400)
      expect(text).toBe('No signature')
    })

    it('should return 400 if webhook signature verification fails', async () => {
      vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      mockRequest = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'invalid_signature',
        },
        body: 'test body',
      })

      const response = await POST(mockRequest)
      const text = await response.text()

      expect(response.status).toBe(400)
      expect(text).toContain('Invalid signature')
    })
  })

  describe('Idempotency', () => {
    it('should return 200 immediately if event already processed', async () => {
      const mockEvent = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_test_123',
            subscription: 'sub_test_123',
            metadata: {
              org_id: 'org-123',
              user_id: 'user-123',
              plan: 'starter',
              billing_frequency: 'monthly',
            },
          },
        },
      }

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

      // Mock idempotency check - event already exists
      const mockWebhookEventsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'existing-id', stripe_event_id: 'evt_test_123' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockWebhookEventsQuery)

      mockRequest = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      expect(mockSupabase.from).toHaveBeenCalledWith('stripe_webhook_events')
    })
  })

  describe('checkout.session.completed Event', () => {
    it('should process checkout.session.completed event and update organization', async () => {
      const mockEvent = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_test_123',
            subscription: 'sub_test_123',
            metadata: {
              org_id: 'org-123',
              user_id: 'user-123',
              plan: 'pro',
              billing_frequency: 'annual',
            },
          },
        },
      }

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

      // Mock idempotency check - event not processed yet
      const mockWebhookEventsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // Not found
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockWebhookEventsQuery)

      // Mock organization check (exists)
      const mockOrgCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'org-123',
            name: 'Test Org',
            payment_status: 'pending_payment',
          },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgCheck)

      // Mock organization update
      const mockOrgsUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsUpdate)

      // Mock webhook event storage
      const mockWebhookInsert = {
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockWebhookInsert)

      mockRequest = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      expect(mockOrgsUpdate.update).toHaveBeenCalledWith({
        plan: 'pro',
        stripe_customer_id: 'cus_test_123',
        stripe_subscription_id: 'sub_test_123',
        payment_status: 'active',
        payment_confirmed_at: expect.any(String),
      })
      expect(mockWebhookInsert.insert).toHaveBeenCalled()
    })
  })

  describe('Other Event Types', () => {
    it('should handle customer.subscription.updated event', async () => {
      const mockEvent = {
        id: 'evt_test_456',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_123',
            customer: 'cus_test_123',
            status: 'active',
          },
        },
      }

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

      // Mock idempotency check
      const mockWebhookEventsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockWebhookEventsQuery)

      // Mock organization query (for finding org by subscription)
      const mockOrgsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'org-123' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsQuery)

      // Mock webhook event storage
      const mockWebhookInsert = {
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockWebhookInsert)

      mockRequest = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      expect(mockWebhookInsert.insert).toHaveBeenCalled()
    })

    it('should handle customer.subscription.deleted event', async () => {
      const mockEvent = {
        id: 'evt_test_789',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test_123',
            customer: 'cus_test_123',
          },
        },
      }

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

      const mockWebhookEventsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockWebhookEventsQuery)

      // Mock organization query (for finding org by subscription)
      const mockOrgsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'org-123' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsQuery)

      const mockWebhookInsert = {
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockWebhookInsert)

      mockRequest = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
    })

    it('should handle invoice.payment_failed event', async () => {
      const mockEvent = {
        id: 'evt_test_101',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_test_123',
            customer: 'cus_test_123',
            subscription: 'sub_test_123',
          },
        },
      }

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

      const mockWebhookEventsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockWebhookEventsQuery)

      // Mock organization query (for finding org by subscription)
      const mockOrgsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'org-123' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsQuery)

      const mockWebhookInsert = {
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockWebhookInsert)

      mockRequest = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
    })

    it('should handle invoice.payment_succeeded event', async () => {
      const mockEvent = {
        id: 'evt_test_102',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test_123',
            customer: 'cus_test_123',
            subscription: 'sub_test_123',
          },
        },
      }

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

      const mockWebhookEventsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockWebhookEventsQuery)

      // Mock organization query (for finding org by subscription)
      const mockOrgsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'org-123' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsQuery)

      const mockWebhookInsert = {
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockWebhookInsert)

      mockRequest = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
    })

    it('should return 200 for unhandled event types and log them', async () => {
      const mockEvent = {
        id: 'evt_test_999',
        type: 'unknown.event.type',
        data: {
          object: {},
        },
      }

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

      const mockWebhookEventsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockWebhookEventsQuery)

      // Mock organization query (for finding org by subscription)
      const mockOrgsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'org-123' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsQuery)

      const mockWebhookInsert = {
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockWebhookInsert)

      mockRequest = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockEvent = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_test_123',
            subscription: 'sub_test_123',
            metadata: {
              org_id: 'org-123',
              user_id: 'user-123',
              plan: 'starter',
              billing_frequency: 'monthly',
            },
          },
        },
      }

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

      const mockWebhookEventsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockWebhookEventsQuery)

      // Mock organization update failure
      const mockOrgsUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Database error' },
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsUpdate)

      mockRequest = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(mockRequest)

      // Should still return 200 to Stripe (don't retry on our errors)
      // But log the error
      expect(response.status).toBe(200)
    })
  })
})

