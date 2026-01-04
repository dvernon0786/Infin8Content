/**
 * Organization Settings Page Component Tests
 * 
 * Server Component tests for organization settings page redirect logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import OrganizationSettingsPage from './page'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))

// Mock getCurrentUser helper
vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: vi.fn(),
}))

// Mock the form component
vi.mock('./organization-settings-form', () => ({
  default: () => <div>OrganizationSettingsForm</div>,
}))

describe('OrganizationSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect to create-organization if user has no organization', async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      user: { id: 'auth-1', email: 'test@example.com' },
      id: 'user-1',
      email: 'test@example.com',
      role: 'owner',
      org_id: null,
      organizations: null,
    })

    try {
      await OrganizationSettingsPage()
    } catch (error) {
      // Expected: redirect throws an error
    }

    expect(redirect).toHaveBeenCalledWith('/create-organization')
  })

  it('should redirect to create-organization if user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null)

    try {
      await OrganizationSettingsPage()
    } catch (error) {
      // Expected: redirect throws an error
    }

    expect(redirect).toHaveBeenCalledWith('/create-organization')
  })

  it('should render organization not found message if organization data missing', async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      user: { id: 'auth-1', email: 'test@example.com' },
      id: 'user-1',
      email: 'test@example.com',
      role: 'owner',
      org_id: 'org-1',
      organizations: null, // Organization data missing
    })

    const result = await OrganizationSettingsPage()
    const { container } = await import('@testing-library/react').then((m) =>
      m.render(result as any)
    )

    expect(container.textContent).toContain('Organization not found')
    expect(redirect).not.toHaveBeenCalled()
  })

  it('should render organization settings page with form if user has organization', async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      user: { id: 'auth-1', email: 'test@example.com' },
      id: 'user-1',
      email: 'test@example.com',
      role: 'owner',
      org_id: 'org-1',
      organizations: {
        id: 'org-1',
        name: 'Test Organization',
        plan: 'starter',
        white_label_settings: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    })

    const result = await OrganizationSettingsPage()
    const { container } = await import('@testing-library/react').then((m) =>
      m.render(result as any)
    )

    expect(container.textContent).toContain('Organization Settings')
    expect(container.textContent).toContain('OrganizationSettingsForm')
    expect(redirect).not.toHaveBeenCalled()
  })
})

