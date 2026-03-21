import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { redirect } from 'next/navigation'
import PaymentSuccessPage from './page'

// Mock dependencies
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/stripe/server', () => ({
  stripe: {
    checkout: {
      sessions: {
        retrieve: vi.fn(),
      },
    },
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('./payment-success-client', () => ({
  default: ({ status, plan }: { status: string; plan?: string }) => (
    <div data-testid="payment-success-client">
      Status: {status}, Plan: {plan || 'none'}
    </div>
  ),
}))

import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

describe('PaymentSuccessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect to login if user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)

    await PaymentSuccessPage({
      searchParams: Promise.resolve({ session_id: 'cs_test_123' }),
    })

    expect(redirect).toHaveBeenCalledWith('/login')
  })

  it('should show error if session_id is missing', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: 'auth-1', email: 'test@example.com' },
      id: 'user-id',
      email: 'test@example.com',
      first_name: 'Test',
      role: 'owner',
      org_id: 'org-id',
      organizations: {
        id: 'org-id',
        name: 'Test Org',
        payment_status: 'pending_payment',
      },
    })

    const result = await PaymentSuccessPage({
      searchParams: Promise.resolve({}),
    })

    const { container } = render(result)
    expect(container.textContent).toContain('Invalid Session')
    expect(container.textContent).toContain('No payment session found')
  })

  it('should show error if Stripe session is not found', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: 'auth-1', email: 'test@example.com' },
      id: 'user-id',
      email: 'test@example.com',
      first_name: 'Test',
      role: 'owner',
      org_id: 'org-id',
      organizations: {
        id: 'org-id',
        name: 'Test Org',
        payment_status: 'pending_payment',
      },
    })

    vi.mocked(stripe.checkout.sessions.retrieve).mockRejectedValue(
      new Error('Session not found')
    )

    const result = await PaymentSuccessPage({
      searchParams: Promise.resolve({ session_id: 'cs_test_123' }),
    })

    const { container } = render(result)
    expect(container.textContent).toContain('Session Not Found')
  })

  it('should show success message and redirect if payment_status is active', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: 'auth-1', email: 'test@example.com' },
      id: 'user-id',
      email: 'test@example.com',
      first_name: 'Test',
      role: 'owner',
      org_id: 'org-id',
      organizations: {
        id: 'org-id',
        name: 'Test Org',
        payment_status: 'active',
        plan: 'pro',
      },
    })

    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
      id: 'cs_test_123',
      payment_status: 'paid',
      status: 'complete',
      customer: 'cus_test',
      subscription: 'sub_test',
      metadata: {
        org_id: 'org-id',
        plan: 'pro',
      },
    } as any)

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'org-id',
          payment_status: 'active',
          plan: 'pro',
        },
        error: null,
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const result = await PaymentSuccessPage({
      searchParams: Promise.resolve({ session_id: 'cs_test_123' }),
    })

    const { container } = render(result)
    expect(screen.getByTestId('payment-success-client')).toBeInTheDocument()
    expect(container.textContent).toContain('Status: active')
    expect(container.textContent).toContain('Plan: pro')
  })

  it('should show processing message if payment_status is pending_payment but session is paid', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: 'auth-1', email: 'test@example.com' },
      id: 'user-id',
      email: 'test@example.com',
      first_name: 'Test',
      role: 'owner',
      org_id: 'org-id',
      organizations: {
        id: 'org-id',
        name: 'Test Org',
        payment_status: 'pending_payment',
        plan: 'starter',
      },
    })

    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
      id: 'cs_test_123',
      payment_status: 'paid',
      status: 'complete',
      customer: 'cus_test',
      subscription: 'sub_test',
      metadata: {
        org_id: 'org-id',
        plan: 'starter',
      },
    } as any)

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'org-id',
          payment_status: 'pending_payment',
          plan: 'starter',
        },
        error: null,
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const result = await PaymentSuccessPage({
      searchParams: Promise.resolve({ session_id: 'cs_test_123' }),
    })

    const { container } = render(result)
    expect(screen.getByTestId('payment-success-client')).toBeInTheDocument()
    expect(container.textContent).toContain('Status: pending')
  })

  it('should show error if session payment_status is not paid', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: 'auth-1', email: 'test@example.com' },
      id: 'user-id',
      email: 'test@example.com',
      first_name: 'Test',
      role: 'owner',
      org_id: 'org-id',
      organizations: {
        id: 'org-id',
        name: 'Test Org',
        payment_status: 'pending_payment',
      },
    })

    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
      id: 'cs_test_123',
      payment_status: 'unpaid',
      status: 'open',
    } as any)

    const result = await PaymentSuccessPage({
      searchParams: Promise.resolve({ session_id: 'cs_test_123' }),
    })

    const { container } = render(result)
    expect(container.textContent).toContain('Payment Not Confirmed')
  })
})

