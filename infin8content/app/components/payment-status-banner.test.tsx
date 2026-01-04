/**
 * Payment Status Banner Integration Tests
 * 
 * Integration tests for payment status banner component
 * Story 1.9: Account Suspension and Reactivation Workflow
 * 
 * Tests cover:
 * - Grace period banner display and countdown
 * - Suspended account banner display
 * - Retry Payment button functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import PaymentStatusBanner from './payment-status-banner'
import type { Database } from '@/lib/supabase/database.types'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

type Organization = Database['public']['Tables']['organizations']['Row']

describe('Payment Status Banner Integration Tests', () => {
  let mockRouter: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockRouter = {
      push: vi.fn(),
    }
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)
  })

  describe('Grace Period Banner', () => {
    it('should display grace period banner with days remaining', () => {
      // Given: Organization is in grace period with 5 days remaining
      const gracePeriodStart = new Date()
      gracePeriodStart.setDate(gracePeriodStart.getDate() - 2) // 2 days ago

      const organization: Organization = {
        id: 'org-id',
        name: 'Test Org',
        plan: 'starter',
        payment_status: 'past_due',
        grace_period_started_at: gracePeriodStart.toISOString(),
        suspended_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Organization

      // When: Component renders
      render(<PaymentStatusBanner organization={organization} />)

      // Then: Grace period banner should be displayed
      expect(screen.getByText(/Payment Failed - Action Required/i)).toBeInTheDocument()
      expect(screen.getByText(/days remaining/i)).toBeInTheDocument()
    })

    it('should display prominent Retry Payment button', () => {
      // Given: Organization is in grace period
      const gracePeriodStart = new Date()
      gracePeriodStart.setDate(gracePeriodStart.getDate() - 2)

      const organization: Organization = {
        id: 'org-id',
        name: 'Test Org',
        plan: 'starter',
        payment_status: 'past_due',
        grace_period_started_at: gracePeriodStart.toISOString(),
        suspended_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Organization

      // When: Component renders
      render(<PaymentStatusBanner organization={organization} />)

      // Then: Retry Payment button should be present and clickable
      const retryButton = screen.getByRole('button', { name: /Retry Payment/i })
      expect(retryButton).toBeInTheDocument()
      expect(retryButton).toHaveClass('bg-yellow-600') // Prominent styling
    })

    it('should navigate to payment page when Retry Payment button is clicked', () => {
      // Given: Organization is in grace period
      const gracePeriodStart = new Date()
      gracePeriodStart.setDate(gracePeriodStart.getDate() - 2)

      const organization: Organization = {
        id: 'org-id',
        name: 'Test Org',
        plan: 'starter',
        payment_status: 'past_due',
        grace_period_started_at: gracePeriodStart.toISOString(),
        suspended_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Organization

      render(<PaymentStatusBanner organization={organization} />)

      // When: User clicks Retry Payment button
      const retryButton = screen.getByRole('button', { name: /Retry Payment/i })
      retryButton.click()

      // Then: Router should navigate to payment page
      expect(mockRouter.push).toHaveBeenCalledWith('/payment')
    })
  })

  describe('Suspended Account Banner', () => {
    it('should display suspended account banner', () => {
      // Given: Organization is suspended
      const organization: Organization = {
        id: 'org-id',
        name: 'Test Org',
        plan: 'starter',
        payment_status: 'suspended',
        grace_period_started_at: null,
        suspended_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Organization

      // When: Component renders
      render(<PaymentStatusBanner organization={organization} />)

      // Then: Suspended banner should be displayed
      expect(screen.getByText(/Account Suspended - Payment Required/i)).toBeInTheDocument()
      expect(screen.getByText(/Your account has been suspended/i)).toBeInTheDocument()
    })
  })

  describe('Active Account', () => {
    it('should not display banner for active accounts', () => {
      // Given: Organization has active payment
      const organization: Organization = {
        id: 'org-id',
        name: 'Test Org',
        plan: 'starter',
        payment_status: 'active',
        grace_period_started_at: null,
        suspended_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Organization

      // When: Component renders
      const { container } = render(<PaymentStatusBanner organization={organization} />)

      // Then: Banner should not be displayed
      expect(container.firstChild).toBeNull()
    })
  })
})

