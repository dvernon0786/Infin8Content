/**
 * Payment Page Component Tests
 * 
 * Server Component tests for payment page redirect logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import PaymentPage from './page'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Mock getCurrentUser helper
vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: vi.fn(),
}))

// Mock the form component
vi.mock('./payment-form', () => ({
  default: () => <div>PaymentForm</div>,
}))

describe('PaymentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect to login if user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null)

    await PaymentPage({ searchParams: Promise.resolve({}) })

    expect(redirect).toHaveBeenCalledWith('/login')
  })

  it('should redirect to create-organization if user has no organization', async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      user: { id: 'auth-1', email: 'test@example.com' },
      id: 'user-1',
      email: 'test@example.com',
      first_name: 'Test',
      role: 'owner',
      org_id: null,
      organizations: null,
    })

    await PaymentPage({ searchParams: Promise.resolve({}) })

    expect(redirect).toHaveBeenCalledWith('/create-organization')
  })

  it('should redirect to dashboard if payment status is active', async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      user: { id: 'auth-1', email: 'test@example.com' },
      id: 'user-1',
      email: 'test@example.com',
      first_name: 'Test',
      role: 'owner',
      org_id: 'org-1',
      organizations: {
        id: 'org-1',
        name: 'Test Org',
        plan: 'starter',
        white_label_settings: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        payment_status: 'active',
      } as any,
    })

    await PaymentPage({ searchParams: Promise.resolve({}) })

    expect(redirect).toHaveBeenCalledWith('/dashboard')
  })

  it('should render payment form if payment status is pending', async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      user: { id: 'auth-1', email: 'test@example.com' },
      id: 'user-1',
      email: 'test@example.com',
      first_name: 'Test',
      role: 'owner',
      org_id: 'org-1',
      organizations: {
        id: 'org-1',
        name: 'Test Org',
        plan: 'starter',
        white_label_settings: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        payment_status: 'pending_payment',
      } as any,
    })

    const result = await PaymentPage({ searchParams: Promise.resolve({}) })
    const { container } = await import('@testing-library/react').then((m) =>
      m.render(result as any)
    )

    expect(container.textContent).toContain('PaymentForm')
    expect(redirect).not.toHaveBeenCalled()
  })

  it('should render payment form if payment status is not set', async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      user: { id: 'auth-1', email: 'test@example.com' },
      id: 'user-1',
      email: 'test@example.com',
      first_name: 'Test',
      role: 'owner',
      org_id: 'org-1',
      organizations: {
        id: 'org-1',
        name: 'Test Org',
        plan: 'starter',
        white_label_settings: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as any,
    })

    const result = await PaymentPage({ searchParams: Promise.resolve({}) })
    const { container } = await import('@testing-library/react').then((m) =>
      m.render(result as any)
    )

    expect(container.textContent).toContain('PaymentForm')
    expect(redirect).not.toHaveBeenCalled()
  })
})

