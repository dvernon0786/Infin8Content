import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SidebarNavigation } from '@/components/dashboard/sidebar-navigation'
import { usePathname } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar'

// Mock next/navigation
vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    Link: ({ children, href, ...props }: any) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

// Mock responsive navigation hook
const mockResponsiveNav = {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    sidebarOpenMobile: false,
    setSidebarOpenMobile: vi.fn(),
}

vi.mock('@/hooks/use-responsive-navigation', () => ({
    useResponsiveNavigation: () => mockResponsiveNav,
    ResponsiveNavigationProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('SidebarNavigation', () => {
    beforeEach(() => {
        vi.mocked(usePathname).mockReturnValue('/dashboard')
    })

    const renderWithProvider = (component: React.ReactElement) => {
        return render(
            <SidebarProvider>
                {component}
            </SidebarProvider>
        )
    }

    it('renders full branding on desktop', () => {
        mockResponsiveNav.isMobile = false
        mockResponsiveNav.isDesktop = true

        renderWithProvider(<SidebarNavigation />)

        expect(screen.getByText('Infin8Content')).toBeInTheDocument()
        expect(screen.queryByText('I8C')).not.toBeInTheDocument()
    })

    it('renders abbreviated branding on mobile', () => {
        mockResponsiveNav.isMobile = true
        mockResponsiveNav.isDesktop = false

        renderWithProvider(<SidebarNavigation />)

        expect(screen.getByText('I8C')).toBeInTheDocument()
        expect(screen.queryByText('Infin8Content')).not.toBeInTheDocument()
    })

    it('shows close button on mobile', () => {
        mockResponsiveNav.isMobile = true

        renderWithProvider(<SidebarNavigation />)

        const closeButton = screen.getByLabelText('Close sidebar')
        expect(closeButton).toBeInTheDocument()
    })

    it('hides close button on desktop', () => {
        mockResponsiveNav.isMobile = false

        renderWithProvider(<SidebarNavigation />)

        expect(screen.queryByLabelText('Close sidebar')).not.toBeInTheDocument()
    })

    it('shows tablet badge on tablet', () => {
        mockResponsiveNav.isTablet = true
        mockResponsiveNav.isMobile = false

        renderWithProvider(<SidebarNavigation />)

        expect(screen.getByText('Tablet')).toBeInTheDocument()
    })

    it('renders all navigation items', () => {
        renderWithProvider(<SidebarNavigation />)

        const expectedItems = ['Research', 'Write', 'Publish', 'Articles', 'Track', 'Settings']
        expectedItems.forEach(item => {
            expect(screen.getByText(item)).toBeInTheDocument()
        })
    })

    it('highlights active navigation item', () => {
        vi.mocked(usePathname).mockReturnValue('/dashboard/articles')

        renderWithProvider(<SidebarNavigation />)

        const articlesLink = screen.getByText('Articles').closest('a')
        expect(articlesLink).toHaveAttribute('data-active', 'true')
    })

    it('shows notifications section on mobile only', () => {
        mockResponsiveNav.isMobile = true

        renderWithProvider(<SidebarNavigation />)

        expect(screen.getByText('Notifications')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument() // Badge count
    })

    it('hides notifications section on desktop', () => {
        mockResponsiveNav.isMobile = false

        renderWithProvider(<SidebarNavigation />)

        expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
    })

    it('closes mobile sidebar when navigation item is clicked', () => {
        mockResponsiveNav.isMobile = true

        renderWithProvider(<SidebarNavigation />)

        const researchLink = screen.getByText('Research').closest('a')
        fireEvent.click(researchLink!)

        expect(mockResponsiveNav.setSidebarOpenMobile).toHaveBeenCalledWith(false)
    })

    it('applies touch-optimized styles on mobile', () => {
        mockResponsiveNav.isMobile = true

        renderWithProvider(<SidebarNavigation />)

        // Check that navigation links have touch-optimized styles
        const navigationLinks = screen.getAllByRole('link').filter(link => 
            link.getAttribute('aria-label')?.startsWith('Navigate to')
        )
        navigationLinks.forEach(link => {
            expect(link).toHaveClass('min-h-[44px]')
        })
    })

    it('hides application label on mobile', () => {
        mockResponsiveNav.isMobile = true

        renderWithProvider(<SidebarNavigation />)

        expect(screen.getByText('Application')).toHaveClass('sr-only')
    })
})
