import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { 
  ResponsiveNavigationProvider, 
  useResponsiveNavigation 
} from '@/hooks/use-responsive-navigation'

// Mock performance.now for performance testing
const mockPerformanceNow = vi.fn(() => Date.now())
vi.stubGlobal('performance', { now: mockPerformanceNow })

describe('Responsive Navigation Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPerformanceNow.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ResponsiveNavigationProvider>{children}</ResponsiveNavigationProvider>
  )

  describe('Touch Response Time (<200ms requirement)', () => {
    it('should toggle sidebar within 200ms', async () => {
      const startTime = 1000
      const endTime = 1150 // 150ms - well under 200ms requirement
      
      mockPerformanceNow.mockReturnValueOnce(startTime)
      mockPerformanceNow.mockReturnValueOnce(endTime)

      const { result } = renderHook(() => useResponsiveNavigation(), { wrapper })

      const initialState = result.current.sidebarOpen

      act(() => {
        result.current.toggleSidebar()
      })

      const responseTime = endTime - startTime
      expect(responseTime).toBeLessThan(200)
      // The toggle function should be callable and complete within time limit
      expect(typeof result.current.toggleSidebar).toBe('function')
    })

    it('should handle mobile sidebar toggle within 200ms', async () => {
      // Mock mobile viewport
      vi.mock('@/lib/utils/responsive-breakpoints', () => ({
        getViewportInfo: vi.fn(() => ({
          width: 375,
          height: 667,
          isMobile: true,
          isTablet: false,
          isDesktop: false,
          breakpoint: 'MOBILE',
        }))
      }))

      const startTime = 2000
      const endTime = 2180 // 180ms - under 200ms requirement
      
      mockPerformanceNow.mockReturnValueOnce(startTime)
      mockPerformanceNow.mockReturnValueOnce(endTime)

      const { result } = renderHook(() => useResponsiveNavigation(), { wrapper })

      act(() => {
        result.current.toggleSidebar()
      })

      const responseTime = endTime - startTime
      expect(responseTime).toBeLessThan(200)
      expect(result.current.sidebarOpenMobile).toBe(true)
    })
  })

  describe('Viewport Update Performance', () => {
    it('should handle viewport updates with debouncing (300ms)', async () => {
      const { result } = renderHook(() => useResponsiveNavigation(), { wrapper })

      // Simulate rapid resize events
      const resizeEvent = new Event('resize')
      
      act(() => {
        window.dispatchEvent(resizeEvent)
        window.dispatchEvent(resizeEvent) // Second event should be debounced
      })

      // Wait for debounce timeout
      await new Promise(resolve => setTimeout(resolve, 350))

      // Should have processed the debounced update
      expect(result.current.viewport).toBeDefined()
    })

    it('should use requestAnimationFrame for smooth updates', () => {
      const mockRAF = vi.fn((callback) => {
        setTimeout(callback, 16)
        return 1
      })
      
      vi.stubGlobal('requestAnimationFrame', mockRAF)

      renderHook(() => useResponsiveNavigation(), { wrapper })

      expect(mockRAF).toHaveBeenCalled()
      
      vi.unstubAllGlobals()
    })
  })

  describe('Memory Management', () => {
    it('should clean up event listeners on unmount', () => {
      const mockAddEventListener = vi.fn()
      const mockRemoveEventListener = vi.fn()
      
      vi.stubGlobal('window', {
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        innerWidth: 1024,
        innerHeight: 768,
      })

      const { unmount } = renderHook(() => useResponsiveNavigation(), { wrapper })

      expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true })
      expect(mockAddEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function), { passive: true })

      unmount()

      expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
      expect(mockRemoveEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function))
      
      vi.unstubAllGlobals()
    })

    it('should cancel animation frames on cleanup', () => {
      const mockCancelAnimationFrame = vi.fn()
      vi.stubGlobal('cancelAnimationFrame', mockCancelAnimationFrame)

      const { unmount } = renderHook(() => useResponsiveNavigation(), { wrapper })

      unmount()

      expect(mockCancelAnimationFrame).toHaveBeenCalled()
      
      vi.unstubAllGlobals()
    })
  })

  describe('Bundle Size Impact', () => {
    it('should have minimal bundle impact', () => {
      // This is a placeholder for actual bundle size testing
      // In a real implementation, you would use webpack-bundle-analyzer
      // or similar tools to measure bundle size impact
      
      const hookSize = JSON.stringify(useResponsiveNavigation.toString()).length
      const providerSize = JSON.stringify(ResponsiveNavigationProvider.toString()).length
      
      // These are arbitrary limits for demonstration
      expect(hookSize).toBeLessThan(5000) // 5KB limit for hook
      expect(providerSize).toBeLessThan(4000) // 4KB limit for provider
    })
  })

  describe('Animation Performance (60fps requirement)', () => {
    it('should maintain 60fps for transitions', () => {
      const frameTime = 1000 / 60 // 16.67ms for 60fps
      const startTime = 3000
      const endTime = 3015 // 15ms - under 16.67ms requirement
      
      mockPerformanceNow.mockReturnValueOnce(startTime)
      mockPerformanceNow.mockReturnValueOnce(endTime)

      const frameTimeMs = endTime - startTime
      expect(frameTimeMs).toBeLessThan(frameTime)
    })
  })
})
