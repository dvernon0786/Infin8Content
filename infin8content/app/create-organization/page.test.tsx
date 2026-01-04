/**
 * Create Organization Page Component Tests
 * 
 * Server Component tests for organization creation page redirect logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import CreateOrganizationPage from './page'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Mock getCurrentUser helper
vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: vi.fn(),
}))

// Mock the form component
vi.mock('./create-organization-form', () => ({
  default: () => <div>CreateOrganizationForm</div>,
}))

describe('CreateOrganizationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect to dashboard if user already has organization', async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      user: { id: 'auth-1', email: 'test@example.com' },
      id: 'user-1',
      email: 'test@example.com',
      role: 'owner',
      org_id: 'org-1',
      organizations: {
        id: 'org-1',
        name: 'Existing Org',
        plan: 'starter',
        white_label_settings: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    })

    await CreateOrganizationPage()

    expect(redirect).toHaveBeenCalledWith('/dashboard')
  })

  it('should render form if user has no organization', async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      user: { id: 'auth-1', email: 'test@example.com' },
      id: 'user-1',
      email: 'test@example.com',
      role: 'owner',
      org_id: null,
      organizations: null,
    })

    const result = await CreateOrganizationPage()
    const { container } = await import('@testing-library/react').then((m) =>
      m.render(result as any)
    )

    expect(container.textContent).toContain('CreateOrganizationForm')
    expect(redirect).not.toHaveBeenCalled()
  })

  it('should render form if user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null)

    const result = await CreateOrganizationPage()
    const { container } = await import('@testing-library/react').then((m) =>
      m.render(result as any)
    )

    expect(container.textContent).toContain('CreateOrganizationForm')
    expect(redirect).not.toHaveBeenCalled()
  })
})

