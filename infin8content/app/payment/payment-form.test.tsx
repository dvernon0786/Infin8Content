/**
 * Payment Form Component Tests
 * 
 * Client Component tests for payment form plan selection and checkout
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useSearchParams } from 'next/navigation'
import PaymentForm from './payment-form'

// Mock Next.js navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

// Mock fetch
global.fetch = vi.fn()

describe('PaymentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    } as any)
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    } as any)
    window.location.href = ''
  })

  it('should render payment form with plan selection', () => {
    render(<PaymentForm />)
    
    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument()
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Agency')).toBeInTheDocument()
  })

  it('should display monthly and annual billing toggle', () => {
    render(<PaymentForm />)
    
    expect(screen.getByText('Monthly')).toBeInTheDocument()
    expect(screen.getByText('Annual')).toBeInTheDocument()
  })

  it('should show feature comparison table', () => {
    render(<PaymentForm />)
    
    expect(screen.getByText('Feature Comparison')).toBeInTheDocument()
    expect(screen.getByText('Articles/month')).toBeInTheDocument()
    expect(screen.getByText('Keyword researches/month')).toBeInTheDocument()
  })

  it('should allow selecting different plans', async () => {
    const user = userEvent.setup()
    const { container } = render(<PaymentForm />)
    
    // Initially, Starter should be selected
    expect(screen.getByText(/Subscribe to Starter Plan/i)).toBeInTheDocument()
    
    // Find the Pro plan card by looking for the h3 with "pro" text
    const proPlanHeading = Array.from(container.querySelectorAll('h3')).find((h3) => 
      h3.textContent?.toLowerCase().trim() === 'pro'
    )
    
    expect(proPlanHeading).toBeTruthy()
    
    if (proPlanHeading) {
      const proPlanCard = proPlanHeading.closest('div[role="button"]')
      expect(proPlanCard).toBeTruthy()
      
      if (proPlanCard) {
        await user.click(proPlanCard as HTMLElement)
        
        // Wait for state update and check that the subscribe button text includes "Pro"
        await waitFor(() => {
          const subscribeButton = screen.getByRole('button', { name: /subscribe/i })
          expect(subscribeButton.textContent).toMatch(/pro/i)
        })
      }
    }
  })

  it('should toggle between monthly and annual billing', () => {
    render(<PaymentForm />)
    
    const monthlyButton = screen.getByText('Monthly')
    const annualButton = screen.getByText('Annual')
    
    // Default should be annual
    expect(annualButton).toHaveClass('bg-blue-600')
    
    fireEvent.click(monthlyButton)
    expect(monthlyButton).toHaveClass('bg-blue-600')
    expect(annualButton).not.toHaveClass('bg-blue-600')
  })

  it('should display warning message when payment is canceled', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn((key: string) => key === 'canceled' ? 'true' : null),
    } as any)
    
    render(<PaymentForm />)
    
    expect(screen.getByText(/Payment Canceled/i)).toBeInTheDocument()
    expect(screen.getByText(/Your payment was canceled/i)).toBeInTheDocument()
    expect(screen.getByText(/Retry Payment/i)).toBeInTheDocument()
  })

  it('should display error message when payment fails with card_declined', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn((key: string) => key === 'error' ? 'card_declined' : null),
    } as any)
    
    render(<PaymentForm />)
    
    expect(screen.getByText(/Card Declined/i)).toBeInTheDocument()
    expect(screen.getByText(/Your card was declined/i)).toBeInTheDocument()
    expect(screen.getByText(/Retry Payment/i)).toBeInTheDocument()
  })
  
  it('should display error message when payment fails with insufficient_funds', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn((key: string) => key === 'error' ? 'insufficient_funds' : null),
    } as any)
    
    render(<PaymentForm />)
    
    expect(screen.getByText(/Insufficient Funds/i)).toBeInTheDocument()
    expect(screen.getByText(/Your account does not have sufficient funds/i)).toBeInTheDocument()
  })
  
  it('should display suspended message when suspended query param is present', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn((key: string) => key === 'suspended' ? 'true' : null),
    } as any)
    
    render(<PaymentForm />)
    
    expect(screen.getByText(/Account Suspended/i)).toBeInTheDocument()
    expect(screen.getByText(/Your account has been suspended/i)).toBeInTheDocument()
  })

  it('should create checkout session on subscribe', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/test' }),
    } as Response)
    
    // Mock window.location.href assignment
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })
    
    render(<PaymentForm />)
    
    const subscribeButton = screen.getByText(/Subscribe to Starter Plan/i)
    fireEvent.click(subscribeButton)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/payment/create-checkout-session',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: 'starter',
            billingFrequency: 'annual',
          }),
        })
      )
    })
  })

  it('should display error when checkout session creation fails', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to create session' }),
    } as Response)
    
    render(<PaymentForm />)
    
    const subscribeButton = screen.getByText(/Subscribe to Starter Plan/i)
    fireEvent.click(subscribeButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to create session/i)).toBeInTheDocument()
    })
  })

  it('should disable subscribe button while submitting', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/test' }),
      } as Response), 100))
    )
    
    render(<PaymentForm />)
    
    const subscribeButton = screen.getByText(/Subscribe to Starter Plan/i)
    fireEvent.click(subscribeButton)
    
    expect(subscribeButton).toBeDisabled()
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })
})

