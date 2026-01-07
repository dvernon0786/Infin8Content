import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'
import { getCurrentUser } from '@/lib/supabase/get-current-user'

// Mock getCurrentUser
vi.mock('@/lib/supabase/get-current-user', () => ({
    getCurrentUser: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}))

describe('Dashboard Page Component Tests - Story 1.12', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should render welcome message with first name when available', async () => {
        // Given: User is authenticated with organization and first_name
        const mockUser = {
            id: 'user-id',
            email: 'john.doe@example.com',
            first_name: 'John',
            role: 'owner',
            org_id: 'org-id',
            organizations: {
                id: 'org-id',
                name: 'Test Organization',
                plan: 'pro',
                payment_status: 'active',
            },
        }

        vi.mocked(getCurrentUser).mockResolvedValue(mockUser as never)

        // When: Component renders
        const component = await DashboardPage()
        render(component)

        // Then: Welcome message displays first name
        expect(screen.getByText(/Welcome back, John/i)).toBeInTheDocument()
    })

    it('should render welcome message with email prefix when first_name is null', async () => {
        // Given: User is authenticated with organization but no first_name
        const mockUser = {
            id: 'user-id',
            email: 'john.doe@example.com',
            first_name: null,
            role: 'owner',
            org_id: 'org-id',
            organizations: {
                id: 'org-id',
                name: 'Test Organization',
                plan: 'pro',
                payment_status: 'active',
            },
        }

        vi.mocked(getCurrentUser).mockResolvedValue(mockUser as never)

        // When: Component renders
        const component = await DashboardPage()
        render(component)

        // Then: Welcome message displays email prefix as fallback
        expect(screen.getByText(/Welcome back, john\.doe/i)).toBeInTheDocument()
    })

    it('should display organization name', async () => {
        // Given: User with organization
        const mockUser = {
            id: 'user-id',
            email: 'test@example.com',
            first_name: null,
            role: 'owner',
            org_id: 'org-id',
            organizations: {
                id: 'org-id',
                name: 'Acme Corp',
                plan: 'starter',
                payment_status: 'active',
            },
        }

        vi.mocked(getCurrentUser).mockResolvedValue(mockUser as never)

        // When: Component renders
        const component = await DashboardPage()
        render(component)

        // Then: Organization name is displayed
        expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })

    it('should display plan tier badge', async () => {
        // Given: User with pro plan
        const mockUser = {
            id: 'user-id',
            email: 'test@example.com',
            first_name: null,
            role: 'owner',
            org_id: 'org-id',
            organizations: {
                id: 'org-id',
                name: 'Test Org',
                plan: 'pro',
                payment_status: 'active',
            },
        }

        vi.mocked(getCurrentUser).mockResolvedValue(mockUser as never)

        // When: Component renders
        const component = await DashboardPage()
        render(component)

        // Then: Plan badge displays PRO
        expect(screen.getByText('PRO')).toBeInTheDocument()
    })

    it('should handle missing user gracefully', async () => {
        // Given: getCurrentUser returns null
        vi.mocked(getCurrentUser).mockResolvedValue(null)

        // When: Component renders
        const component = await DashboardPage()
        render(component)

        // Then: Error message is displayed
        expect(screen.getByText(/Unable to load user data/i)).toBeInTheDocument()
    })

    it('should handle missing organization gracefully', async () => {
        // Given: User without organization
        const mockUser = {
            id: 'user-id',
            email: 'test@example.com',
            first_name: null,
            role: 'owner',
            org_id: null,
            organizations: null,
        }

        vi.mocked(getCurrentUser).mockResolvedValue(mockUser as never)

        // When: Component renders
        const component = await DashboardPage()
        render(component)

        // Then: Organization error message is displayed
        expect(screen.getByText(/Organization not found/i)).toBeInTheDocument()
    })

    it('should display payment status', async () => {
        // Given: User with active payment status
        const mockUser = {
            id: 'user-id',
            email: 'test@example.com',
            first_name: null,
            role: 'owner',
            org_id: 'org-id',
            organizations: {
                id: 'org-id',
                name: 'Test Org',
                plan: 'starter',
                payment_status: 'active',
            },
        }

        vi.mocked(getCurrentUser).mockResolvedValue(mockUser as never)

        // When: Component renders
        const component = await DashboardPage()
        render(component)

        // Then: Status is displayed
        expect(screen.getByText(/Status: active/i)).toBeInTheDocument()
    })

    it('should format payment status with underscores replaced', async () => {
        // Given: User with pending_payment status
        const mockUser = {
            id: 'user-id',
            email: 'test@example.com',
            first_name: null,
            role: 'owner',
            org_id: 'org-id',
            organizations: {
                id: 'org-id',
                name: 'Test Org',
                plan: 'starter',
                payment_status: 'pending_payment',
            },
        }

        vi.mocked(getCurrentUser).mockResolvedValue(mockUser as never)

        // When: Component renders
        const component = await DashboardPage()
        render(component)

        // Then: Status displays with space instead of underscore
        expect(screen.getByText(/Status: pending payment/i)).toBeInTheDocument()
    })
})

