import { render, screen } from '@testing-library/react'
import { SidebarNavigation } from '@/components/dashboard/sidebar-navigation'
import { TopNavigation } from '@/components/dashboard/top-navigation'
import { SidebarProvider } from '@/components/ui/sidebar'
import { vi, describe, it, expect } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard',
    useRouter: () => ({ push: vi.fn() }),
}))

describe('Dashboard Components', () => {
    it('SidebarNavigation renders links', () => {
        render(
            <SidebarProvider>
                <SidebarNavigation />
            </SidebarProvider>
        )
        expect(screen.getByText('Research')).toBeInTheDocument()
        expect(screen.getByText('Write')).toBeInTheDocument()
        expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('TopNavigation renders user info', () => {
        // TopNavigation includes SidebarTrigger which needs SidebarProvider
        render(
            <SidebarProvider>
                <TopNavigation email="test@example.com" name="Test User" />
            </SidebarProvider>
        )
        // Check for avatar fallback
        expect(screen.getByText('TU')).toBeInTheDocument()
    })
})
