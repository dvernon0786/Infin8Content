import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SidebarNavigation } from '@/components/dashboard/sidebar-navigation'
import { usePathname } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar'

// Mock next/navigation
vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    Link: vi.fn(({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    )),
}))

describe('Sidebar Navigation Component Tests - Story 1.12', () => {
    const mockUsePathname = vi.mocked(usePathname)

    beforeEach(() => {
        vi.clearAllMocks()
    })

    const renderWithProvider = (component: React.ReactElement) => {
        return render(
            <SidebarProvider>
                {component}
            </SidebarProvider>
        )
    }

    it('should render all navigation items', () => {
        // Given: Default pathname
        mockUsePathname.mockReturnValue('/dashboard')

        // When: Component renders
        renderWithProvider(<SidebarNavigation />)

        // Then: All navigation items are displayed
        expect(screen.getByText('Research')).toBeInTheDocument()
        expect(screen.getByText('Write')).toBeInTheDocument()
        expect(screen.getByText('Publish')).toBeInTheDocument()
        expect(screen.getByText('Track')).toBeInTheDocument()
        expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('should highlight active navigation item', () => {
        // Given: User is on research page
        mockUsePathname.mockReturnValue('/dashboard/research/keywords')

        // When: Component renders
        renderWithProvider(<SidebarNavigation />)

        // Then: Research item is active (has data-active attribute in Shadcn sidebar)
        const researchLink = screen.getByLabelText('Navigate to Research')
        expect(researchLink).toHaveAttribute('data-active', 'true')
    })

    it('should not highlight inactive navigation items', () => {
        // Given: User is on research page
        mockUsePathname.mockReturnValue('/dashboard/research')

        // When: Component renders
        renderWithProvider(<SidebarNavigation />)

        // Then: Write item is not active
        const writeLink = screen.getByLabelText('Navigate to Write')
        expect(writeLink).toHaveAttribute('data-active', 'false')
    })

    it('should have correct navigation URLs', () => {
        // Given: Default pathname
        mockUsePathname.mockReturnValue('/dashboard')

        // When: Component renders
        renderWithProvider(<SidebarNavigation />)

        // Then: Links have correct href attributes
        expect(screen.getByLabelText('Navigate to Research')).toHaveAttribute('href', '/dashboard/research')
        expect(screen.getByLabelText('Navigate to Write')).toHaveAttribute('href', '/dashboard/write')
        expect(screen.getByLabelText('Navigate to Publish')).toHaveAttribute('href', '/dashboard/publish')
        expect(screen.getByLabelText('Navigate to Track')).toHaveAttribute('href', '/dashboard/track')
        expect(screen.getByLabelText('Navigate to Settings')).toHaveAttribute('href', '/dashboard/settings')
    })

    it('should have accessibility attributes', () => {
        // Given: Default pathname
        mockUsePathname.mockReturnValue('/dashboard')

        // When: Component renders
        renderWithProvider(<SidebarNavigation />)

        // Then: All links have proper accessibility labels
        expect(screen.getByLabelText('Navigate to Research')).toBeInTheDocument()
        expect(screen.getByLabelText('Navigate to Write')).toBeInTheDocument()
        expect(screen.getByLabelText('Navigate to Publish')).toBeInTheDocument()
        expect(screen.getByLabelText('Navigate to Track')).toBeInTheDocument()
        expect(screen.getByLabelText('Navigate to Settings')).toBeInTheDocument()

        // Icons should be hidden from screen readers (SVG elements with aria-hidden)
        const icons = document.querySelectorAll('svg[aria-hidden="true"]')
        expect(icons.length).toBeGreaterThan(0)
        icons.forEach(icon => {
            expect(icon).toHaveAttribute('aria-hidden', 'true')
        })
    })

    it('should handle dashboard root as active for research subpages', () => {
        // Given: User is on research subpage
        mockUsePathname.mockReturnValue('/dashboard/research/keywords')

        // When: Component renders
        renderWithProvider(<SidebarNavigation />)

        // Then: Research item is active
        const researchLink = screen.getByLabelText('Navigate to Research')
        expect(researchLink).toHaveAttribute('data-active', 'true')
    })

    it('should handle dashboard root as active for write subpages', () => {
        // Given: User is on write subpage
        mockUsePathname.mockReturnValue('/dashboard/write/articles')

        // When: Component renders
        renderWithProvider(<SidebarNavigation />)

        // Then: Write item is active
        const writeLink = screen.getByLabelText('Navigate to Write')
        expect(writeLink).toHaveAttribute('data-active', 'true')
    })

    it('should have proper ARIA structure', () => {
        // Given: Default pathname
        mockUsePathname.mockReturnValue('/dashboard')

        // When: Component renders
        renderWithProvider(<SidebarNavigation />)

        // Then: Application group label is present
        expect(screen.getByText('Application')).toBeInTheDocument()
        
        // Sidebar content is present (using data-sidebar attribute)
        const sidebarContent = document.querySelector('[data-sidebar="content"]')
        expect(sidebarContent).toBeInTheDocument()
    })
})
