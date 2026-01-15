import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TopNavigation } from '@/components/dashboard/top-navigation'
import { usePathname, useRouter } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar'

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: () => ({
        push: mockPush,
        refresh: mockRefresh,
        back: vi.fn(),
        forward: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    Link: ({ children, href, ...props }: any) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

// Mock fetch for logout
global.fetch = vi.fn()

// Mock responsive navigation hook
const mockResponsiveNav = {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
}

vi.mock('@/hooks/use-responsive-navigation', () => ({
    useResponsiveNavigation: () => mockResponsiveNav,
    ResponsiveNavigationProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('TopNavigation', () => {
    const mockUser = {
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: undefined,
    }

    beforeEach(() => {
        vi.mocked(usePathname).mockReturnValue('/dashboard')
        vi.clearAllMocks()
    })

    const renderWithProvider = (component: React.ReactElement, isMobile = false) => {
        mockResponsiveNav.isMobile = isMobile
        mockResponsiveNav.isTablet = !isMobile && Math.random() > 0.5
        mockResponsiveNav.isDesktop = !isMobile

        return render(
            <SidebarProvider>
                {component}
            </SidebarProvider>
        )
    }

    it('renders full branding on desktop', () => {
        renderWithProvider(<TopNavigation {...mockUser} />, false)

        expect(screen.getByText('Infin8Content')).toBeInTheDocument()
        expect(screen.queryByText('I8C')).not.toBeInTheDocument()
    })

    it('renders abbreviated branding on mobile', () => {
        renderWithProvider(<TopNavigation {...mockUser} />, true)

        expect(screen.getByText('I8C')).toBeInTheDocument()
        expect(screen.queryByText('Infin8Content')).not.toBeInTheDocument()
    })

    it('shows notification bell on desktop', () => {
        renderWithProvider(<TopNavigation {...mockUser} />, false)

        expect(screen.getByLabelText('View notifications')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument() // Badge count
    })

    it('hides notification bell on mobile', () => {
        renderWithProvider(<TopNavigation {...mockUser} />, true)

        expect(screen.queryByLabelText('View notifications')).not.toBeInTheDocument()
    })

    it('shows create article button when not on generate page', () => {
        vi.mocked(usePathname).mockReturnValue('/dashboard/articles')

        renderWithProvider(<TopNavigation {...mockUser} />, false)

        expect(screen.getByText('Create Article')).toBeInTheDocument()
    })

    it('hides create article button on generate page', () => {
        vi.mocked(usePathname).mockReturnValue('/dashboard/articles/generate')

        renderWithProvider(<TopNavigation {...mockUser} />, false)

        expect(screen.queryByText('Create Article')).not.toBeInTheDocument()
    })

    it('shows mobile search toggle on mobile', () => {
        renderWithProvider(<TopNavigation {...mockUser} />, true)

        expect(screen.getByLabelText('Toggle search')).toBeInTheDocument()
    })

    it('toggles search input on mobile', async () => {
        const user = userEvent.setup()
        renderWithProvider(<TopNavigation {...mockUser} />, true)

        const searchToggle = screen.getByLabelText('Toggle search')
        
        // Initially search should be hidden
        expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()

        // Click to open search
        await user.click(searchToggle)
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()

        // Click to close search
        await user.click(searchToggle)
        expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()
    })

    it('shows search input on desktop by default', () => {
        renderWithProvider(<TopNavigation {...mockUser} />, false)

        expect(screen.getByPlaceholderText('Search articles...')).toBeInTheDocument()
    })

    it('renders user menu with correct information', () => {
        renderWithProvider(<TopNavigation {...mockUser} />, false)

        // Check user menu trigger
        const userAvatar = screen.getByRole('button', { name: /test@example.com/i })
        expect(userAvatar).toBeInTheDocument()

        // Open dropdown
        fireEvent.click(userAvatar)

        // Check dropdown content
        expect(screen.getByText('Test User')).toBeInTheDocument()
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
        expect(screen.getByText('Profile')).toBeInTheDocument()
        expect(screen.getByText('Log out')).toBeInTheDocument()
    })

    it('shows initials when no avatar provided', () => {
        renderWithProvider(<TopNavigation {...mockUser} />, false)

        const userAvatar = screen.getByRole('button', { name: /test@example.com/i })
        expect(userAvatar).toHaveTextContent('TU') // Test User initials
    })

    it('handles logout correctly', async () => {
        const user = userEvent.setup()
        const mockFetch = vi.mocked(fetch)
        mockFetch.mockResolvedValueOnce({
            ok: true,
        } as Response)

        renderWithProvider(<TopNavigation {...mockUser} />, false)

        // Open user menu
        const userAvatar = screen.getByRole('button', { name: /test@example.com/i })
        await user.click(userAvatar)

        // Click logout
        const logoutButton = screen.getByText('Log out')
        await user.click(logoutButton)

        // Verify logout API call
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        // Verify redirect
        expect(mockPush).toHaveBeenCalledWith('/login')
        expect(mockRefresh).toHaveBeenCalled()
    })

    it('handles logout error gracefully', async () => {
        const user = userEvent.setup()
        const mockFetch = vi.mocked(fetch)
        mockFetch.mockRejectedValueOnce(new Error('Network error'))

        renderWithProvider(<TopNavigation {...mockUser} />, false)

        // Open user menu and logout
        const userAvatar = screen.getByRole('button', { name: /test@example.com/i })
        await user.click(userAvatar)
        
        const logoutButton = screen.getByText('Log out')
        await user.click(logoutButton)

        // Should still redirect even on error
        expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('applies mobile-specific styling', () => {
        renderWithProvider(<TopNavigation {...mockUser} />, true)

        const header = screen.getByRole('banner')
        expect(header).toHaveClass('px-3') // Mobile padding
    })

    it('applies desktop-specific styling', () => {
        renderWithProvider(<TopNavigation {...mockUser} />, false)

        const header = screen.getByRole('banner')
        expect(header).toHaveClass('px-4') // Desktop padding
    })
})
