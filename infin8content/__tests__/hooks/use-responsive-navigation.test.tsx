import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { 
  ResponsiveNavigationProvider, 
  useResponsiveNavigation 
} from '@/hooks/use-responsive-navigation'
import { getViewportInfo } from '@/lib/utils/responsive-breakpoints'

// Mock window and requestAnimationFrame
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}

const mockRequestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16) // Simulate next frame
  return 1
})

const mockCancelAnimationFrame = vi.fn()

describe('useResponsiveNavigation', () => {
  beforeEach(() => {
    vi.stubGlobal('window', mockWindow)
    vi.stubGlobal('requestAnimationFrame', mockRequestAnimationFrame)
    vi.stubGlobal('cancelAnimationFrame', mockCancelAnimationFrame)
    
    // Mock getViewportInfo to return consistent values
    vi.mock('@/lib/utils/responsive-breakpoints', () => ({
      getViewportInfo: vi.fn(() => ({
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        breakpoint: 'DESKTOP',
      }))
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ResponsiveNavigationProvider>{children}</ResponsiveNavigationProvider>
  )

  it('should provide responsive navigation context', () => {
    const { result } = renderHook(() => useResponsiveNavigation(), { wrapper })

    expect(result.current.isDesktop).toBe(true)
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.breakpoint).toBe('DESKTOP')
    expect(result.current.sidebarOpen).toBe(true) // defaultOpen
    expect(result.current.sidebarOpenMobile).toBe(false)
  })

  it('should toggle sidebar on desktop', () => {
    const { result } = renderHook(() => useResponsiveNavigation(), { wrapper })

    act(() => {
      result.current.toggleSidebar()
    })

    expect(result.current.sidebarOpen).toBe(false)
  })

  it('should toggle mobile sidebar on mobile', () => {
    // Mock mobile viewport
    vi.mocked(getViewportInfo).mockReturnValue({
      width: 375,
      height: 667,
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      breakpoint: 'MOBILE',
    })

    const { result } = renderHook(() => useResponsiveNavigation(), { wrapper })

    act(() => {
      result.current.toggleSidebar()
    })

    expect(result.current.sidebarOpenMobile).toBe(true)
    expect(result.current.sidebarOpen).toBe(true) // Desktop sidebar unchanged
  })

  it('should allow manual sidebar state control', () => {
    const { result } = renderHook(() => useResponsiveNavigation(), { wrapper })

    act(() => {
      result.current.setSidebarOpen(false)
    })

    expect(result.current.sidebarOpen).toBe(false)

    act(() => {
      result.current.setSidebarOpen(true)
    })

    expect(result.current.sidebarOpen).toBe(true)
  })

  it('should allow manual mobile sidebar state control', () => {
    const { result } = renderHook(() => useResponsiveNavigation(), { wrapper })

    act(() => {
      result.current.setSidebarOpenMobile(true)
    })

    expect(result.current.sidebarOpenMobile).toBe(true)

    act(() => {
      result.current.setSidebarOpenMobile(false)
    })

    expect(result.current.sidebarOpenMobile).toBe(false)
  })

  it('should auto-close mobile sidebar when switching to desktop', async () => {
    // Start with mobile viewport
    vi.mocked(getViewportInfo).mockReturnValue({
      width: 375,
      height: 667,
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      breakpoint: 'MOBILE',
    })

    const { result } = renderHook(() => useResponsiveNavigation(), { wrapper })

    // Open mobile sidebar
    act(() => {
      result.current.setSidebarOpenMobile(true)
    })

    expect(result.current.sidebarOpenMobile).toBe(true)

    // Switch to desktop viewport
    vi.mocked(getViewportInfo).mockReturnValue({
      width: 1024,
      height: 768,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      breakpoint: 'DESKTOP',
    })

    act(() => {
      // Simulate resize event
      window.dispatchEvent(new Event('resize'))
    })

    // Wait for debounced update
    await new Promise(resolve => setTimeout(resolve, 350))

    expect(result.current.sidebarOpenMobile).toBe(false)
  })

  it('should handle controlled sidebar state', () => {
    const onOpenChange = vi.fn()

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ResponsiveNavigationProvider open={true} onOpenChange={onOpenChange}>
        {children}
      </ResponsiveNavigationProvider>
    )

    const { result } = renderHook(() => useResponsiveNavigation(), { wrapper })

    act(() => {
      result.current.toggleSidebar()
    })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useResponsiveNavigation())
    }).toThrow(
      'useResponsiveNavigation must be used within a ResponsiveNavigationProvider'
    )
  })

  it('should set up event listeners on mount', () => {
    renderHook(() => useResponsiveNavigation(), { wrapper })

    expect(mockWindow.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true })
    expect(mockWindow.addEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function), { passive: true })
  })

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useResponsiveNavigation(), { wrapper })

    unmount()

    expect(mockWindow.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(mockWindow.removeEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function))
  })
})
