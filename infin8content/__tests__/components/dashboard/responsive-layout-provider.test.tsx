import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResponsiveLayoutProvider } from '@/components/dashboard/responsive-layout-provider'
import { useResponsiveNavigation } from '@/hooks/use-responsive-navigation'

// Mock responsive navigation hook
const mockResponsiveNav = {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    breakpoint: 'DESKTOP' as const,
    viewport: {
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        breakpoint: 'DESKTOP' as const,
    },
    sidebarOpen: true,
    sidebarOpenMobile: false,
    toggleSidebar: vi.fn(),
    setSidebarOpen: vi.fn(),
    setSidebarOpenMobile: vi.fn(),
}

vi.mock('@/hooks/use-responsive-navigation', () => ({
    useResponsiveNavigation: () => mockResponsiveNav,
    ResponsiveNavigationProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('ResponsiveLayoutProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders children with responsive layout classes', () => {
        render(
            <ResponsiveLayoutProvider>
                <div>Test Content</div>
            </ResponsiveLayoutProvider>
        )

        const content = screen.getByText('Test Content')
        expect(content).toBeInTheDocument()
        
        // Should have base layout classes
        const container = content.parentElement
        expect(container).toHaveClass('min-h-screen', 'w-full')
    })

    it('applies desktop layout classes on desktop viewport', () => {
        mockResponsiveNav.isDesktop = true
        mockResponsiveNav.isMobile = false
        mockResponsiveNav.isTablet = false

        render(
            <ResponsiveLayoutProvider>
                <div>Test Content</div>
            </ResponsiveLayoutProvider>
        )

        const container = screen.getByText('Test Content').parentElement
        expect(container).toHaveClass('layout-desktop')
        expect(container).not.toHaveClass('layout-mobile', 'layout-tablet')
        expect(container).toHaveAttribute('data-breakpoint', 'desktop')
    })

    it('applies mobile layout classes on mobile viewport', () => {
        mockResponsiveNav.isMobile = true
        mockResponsiveNav.isDesktop = false
        mockResponsiveNav.isTablet = false

        render(
            <ResponsiveLayoutProvider>
                <div>Test Content</div>
            </ResponsiveLayoutProvider>
        )

        const container = screen.getByText('Test Content').parentElement
        expect(container).toHaveClass('layout-mobile', 'touch-optimized')
        expect(container).not.toHaveClass('layout-desktop', 'layout-tablet')
        expect(container).toHaveAttribute('data-breakpoint', 'mobile')
    })

    it('applies tablet layout classes on tablet viewport', () => {
        mockResponsiveNav.isTablet = true
        mockResponsiveNav.isMobile = false
        mockResponsiveNav.isDesktop = false

        render(
            <ResponsiveLayoutProvider>
                <div>Test Content</div>
            </ResponsiveLayoutProvider>
        )

        const container = screen.getByText('Test Content').parentElement
        expect(container).toHaveClass('layout-tablet')
        expect(container).not.toHaveClass('layout-mobile', 'layout-desktop')
        expect(container).toHaveAttribute('data-breakpoint', 'tablet')
    })

    it('applies custom className when provided', () => {
        render(
            <ResponsiveLayoutProvider className="custom-class">
                <div>Test Content</div>
            </ResponsiveLayoutProvider>
        )

        const container = screen.getByText('Test Content').parentElement
        expect(container).toHaveClass('custom-class')
    })

    it('wraps content in ResponsiveNavigationProvider', () => {
        // This test verifies the provider structure
        const TestChild = () => <div>Test Child</div>
        
        render(
            <ResponsiveLayoutProvider>
                <TestChild />
            </ResponsiveLayoutProvider>
        )

        expect(screen.getByText('Test Child')).toBeInTheDocument()
    })
})
