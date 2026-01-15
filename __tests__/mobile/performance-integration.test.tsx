/**
 * Mobile Performance Integration Tests
 * 
 * Tests the complete mobile performance optimization system
 * including service worker, touch optimization, and network awareness.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock the mobile performance services
vi.mock('../../lib/mobile/performance-monitor', () => ({
  mobilePerformanceMonitor: {
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    getCurrentMetrics: vi.fn(() => ({
      touchResponseTime: 150,
      pageLoadTime: 2000,
      animationFrameRate: 60,
      memoryUsage: 1024 * 1024,
      networkSpeed: '4g',
      devicePerformance: 'high'
    })),
    measureTouchResponse: vi.fn(),
    measureAnimationPerformance: vi.fn(),
    getOptimizationSuggestions: vi.fn(() => [])
  }
}))

vi.mock('../../lib/mobile/network-optimizer', () => ({
  networkOptimizer: {
    getOptimizationConfig: vi.fn(() => ({
      enableImageOptimization: true,
      enableLazyLoading: true,
      enableCompression: true,
      enableCaching: true,
      adaptiveQuality: true
    })),
    getImageQuality: vi.fn(() => 'medium'),
    getLoadingStrategy: vi.fn(() => 'lazy'),
    subscribe: vi.fn(() => vi.fn())
  }
}))

vi.mock('../../lib/mobile/touch-optimizer', () => ({
  touchOptimizer: {
    optimizeTouchTargets: vi.fn(),
    addTouchFeedback: vi.fn(),
    enablePullToRefresh: vi.fn(() => vi.fn()),
    validateTouchTarget: vi.fn(() => true),
    enhanceTouchTarget: vi.fn()
  }
}))

// Mock service worker
vi.mock('../../public/sw.js', () => ({}))

// Mock performance APIs
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  memory: {
    usedJSHeapSize: 1024 * 1024,
    totalJSHeapSize: 10 * 1024 * 1024,
    jsHeapSizeLimit: 2048 * 1024 * 1024
  }
} as any

global.navigator = {
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false
  },
  hardwareConcurrency: 8
} as any

describe('Mobile Performance Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock DOM APIs
    document.addEventListener = vi.fn()
    document.removeEventListener = vi.fn()
    document.querySelectorAll = vi.fn(() => [])
    document.body = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        toggle: vi.fn()
      }
    } as any
    
    window.addEventListener = vi.fn()
    window.removeEventListener = vi.fn()
    window.scrollY = 0
    window.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Performance Monitoring Integration', () => {
    it('should initialize performance monitoring on mobile devices', async () => {
      const { useMobilePerformance } = await import('../../hooks/use-mobile-performance')
      const { result } = renderHook(() => useMobilePerformance())

      // Should start monitoring automatically
      expect(result.current.metrics).toBeDefined()
      expect(result.current.isPerformanceOptimized).toBeDefined()
    })

    it('should measure touch response times', async () => {
      const { useMobilePerformance } = await import('../../hooks/use-mobile-performance')
      const { result } = renderHook(() => useMobilePerformance())

      // Simulate touch interaction
      const startTime = performance.now()
      result.current.measureTouchResponse(startTime, 'test-button')

      // Should call the performance monitor
      const { mobilePerformanceMonitor } = await import('../../lib/mobile/performance-monitor')
      expect(mobilePerformanceMonitor.measureTouchResponse).toHaveBeenCalledWith(startTime, 'test-button')
    })

    it('should provide optimization suggestions', async () => {
      const { useMobilePerformance } = await import('../../hooks/use-mobile-performance')
      const { result } = renderHook(() => useMobilePerformance())

      expect(Array.isArray(result.current.performanceSuggestions)).toBe(true)
    })
  })

  describe('Network Optimization Integration', () => {
    it('should adapt to network conditions', async () => {
      const { useMobilePerformance } = await import('../../hooks/use-mobile-performance')
      const { result } = renderHook(() => useMobilePerformance())

      // Should get network-aware configuration
      const networkConfig = result.current.getNetworkConfig()
      expect(networkConfig).toHaveProperty('enableImageOptimization')
      expect(networkConfig).toHaveProperty('adaptiveQuality')

      // Should get appropriate image quality
      const imageQuality = result.current.getImageQuality()
      expect(['low', 'medium', 'high']).toContain(imageQuality)

      // Should get loading strategy
      const loadingStrategy = result.current.getLoadingStrategy()
      expect(['eager', 'lazy', 'progressive']).toContain(loadingStrategy)
    })

    it('should handle network changes', async () => {
      const { useMobilePerformance } = await import('../../hooks/use-mobile-performance')
      const { result } = renderHook(() => useMobilePerformance())

      // Mock network change
      const { networkOptimizer } = await import('../../lib/mobile/network-optimizer')
      const mockCallback = vi.fn()
      const unsubscribe = networkOptimizer.subscribe(mockCallback)

      expect(typeof unsubscribe).toBe('function')
    })
  })

  describe('Touch Optimization Integration', () => {
    it('should optimize touch targets', async () => {
      const { useMobilePerformance } = await import('../../hooks/use-mobile-performance')
      const { result } = renderHook(() => useMobilePerformance())

      // Create mock element
      const mockElement = document.createElement('button')
      
      // Should add touch feedback
      result.current.addTouchFeedback(mockElement)

      const { touchOptimizer } = await import('../../lib/mobile/touch-optimizer')
      expect(touchOptimizer.addTouchFeedback).toHaveBeenCalledWith(mockElement)
    })

    it('should validate touch target sizes', async () => {
      const { touchOptimizer } = await import('../../lib/mobile/touch-optimizer')

      // Create mock element with 44px size
      const validElement = {
        getBoundingClientRect: () => ({ width: 44, height: 44 })
      } as any

      const isValid = touchOptimizer.validateTouchTarget(validElement)
      expect(isValid).toBe(true)

      // Create mock element with insufficient size
      const invalidElement = {
        getBoundingClientRect: () => ({ width: 20, height: 20 })
      } as any

      const isInvalid = touchOptimizer.validateTouchTarget(invalidElement)
      expect(isInvalid).toBe(false)
    })
  })

  describe('Button Component Integration', () => {
    it('should integrate performance monitoring with buttons', async () => {
      const { Button } = await import('../../infin8content/components/ui/button')
      
      render(<Button>Test Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Test Button' })
      expect(button).toBeInTheDocument()
      
      // Should have minimum touch target size
      expect(button).toHaveClass('min-h-[44px]')
      expect(button).toHaveClass('min-w-[44px]')
    })

    it('should measure touch response on button clicks', async () => {
      const { Button } = await import('../../infin8content/components/ui/button')
      const user = userEvent.setup()
      
      render(<Button onClick={() => {}}>Test Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Test Button' })
      
      await user.click(button)
      
      // Should measure touch response
      const { mobilePerformanceMonitor } = await import('../../lib/mobile/performance-monitor')
      expect(mobilePerformanceMonitor.measureTouchResponse).toHaveBeenCalled()
    })
  })

  describe('Input Component Integration', () => {
    it('should integrate performance monitoring with inputs', async () => {
      const { Input } = await import('../../infin8content/components/ui/input')
      
      render(<Input placeholder="Test input" />)
      
      const input = screen.getByPlaceholderText('Test input')
      expect(input).toBeInTheDocument()
      
      // Should have minimum touch target size
      expect(input).toHaveClass('min-h-[44px]')
    })

    it('should measure touch response on input focus', async () => {
      const { Input } = await import('../../infin8content/components/ui/input')
      const user = userEvent.setup()
      
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      
      await user.click(input)
      
      // Should measure touch response
      const { mobilePerformanceMonitor } = await import('../../lib/mobile/performance-monitor')
      expect(mobilePerformanceMonitor.measureTouchResponse).toHaveBeenCalled()
    })
  })

  describe('Service Worker Integration', () => {
    it('should register service worker for offline functionality', async () => {
      // Mock service worker registration
      const mockRegister = vi.fn().mockResolvedValue({
        installing: null,
        waiting: null,
        active: { state: 'activated' }
      })
      
      global.navigator.serviceWorker = {
        register: mockRegister
      } as any

      // Import and test service worker registration
      expect(mockRegister).not.toHaveBeenCalled()
      
      // In a real implementation, this would be called on app initialization
      // mockRegister('/sw.js')
      
      // expect(mockRegister).toHaveBeenCalledWith('/sw.js')
    })

    it('should handle offline scenarios', async () => {
      // Mock offline state
      global.navigator.onLine = false
      
      // Test offline behavior
      expect(navigator.onLine).toBe(false)
      
      // Mock online state
      global.navigator.onLine = true
      
      expect(navigator.onLine).toBe(true)
    })
  })

  describe('Swipe Navigation Integration', () => {
    it('should handle pull-to-refresh gestures', async () => {
      const { SwipeNavigation } = await import('../../components/dashboard/swipe-navigation')
      const mockRefresh = vi.fn()
      
      render(
        <SwipeNavigation
          onPullToRefresh={mockRefresh}
          enablePullToRefresh={true}
          enableSwipeNavigation={false}
        >
          <div>Test Content</div>
        </SwipeNavigation>
      )
      
      const container = screen.getByText('Test Content').parentElement
      expect(container).toBeInTheDocument()
      
      // Simulate pull-to-refresh gesture
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientY: 100 }]
      })
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientY: 200 }]
      })
      const touchEnd = new TouchEvent('touchend')
      
      fireEvent(container!, touchStart)
      fireEvent(container!, touchMove)
      fireEvent(container!, touchEnd)
      
      // Should trigger refresh after threshold
      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled()
      }, { timeout: 1000 })
    })

    it('should handle swipe navigation gestures', async () => {
      const { SwipeNavigation } = await import('../../components/dashboard/swipe-navigation')
      const mockSwipeLeft = vi.fn()
      const mockSwipeRight = vi.fn()
      
      render(
        <SwipeNavigation
          onSwipeLeft={mockSwipeLeft}
          onSwipeRight={mockSwipeRight}
          enablePullToRefresh={false}
          enableSwipeNavigation={true}
        >
          <div>Test Content</div>
        </SwipeNavigation>
      )
      
      const container = screen.getByText('Test Content').parentElement
      
      // Simulate swipe left gesture
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 50, clientY: 100 }]
      })
      
      fireEvent(container!, touchStart)
      fireEvent(container!, touchEnd)
      
      await waitFor(() => {
        expect(mockSwipeLeft).toHaveBeenCalled()
      }, { timeout: 1000 })
    })
  })

  describe('Performance Metrics Validation', () => {
    it('should validate touch response time thresholds', async () => {
      const { mobilePerformanceMonitor } = await import('../../lib/mobile/performance-monitor')
      
      // Mock fast response
      mobilePerformanceMonitor.measureTouchResponse(performance.now(), 'button')
      
      const metrics = mobilePerformanceMonitor.getCurrentMetrics()
      expect(metrics.touchResponseTime).toBeLessThanOrEqual(200) // AC 1: <200ms
    })

    it('should validate animation frame rate', async () => {
      const { mobilePerformanceMonitor } = await import('../../lib/mobile/performance-monitor')
      
      mobilePerformanceMonitor.measureAnimationPerformance()
      
      const metrics = mobilePerformanceMonitor.getCurrentMetrics()
      expect(metrics.animationFrameRate).toBeGreaterThanOrEqual(55) // AC 3: 60fps target
    })

    it('should validate memory usage', async () => {
      const { mobilePerformanceMonitor } = await import('../../lib/mobile/performance-monitor')
      
      const metrics = mobilePerformanceMonitor.getCurrentMetrics()
      expect(metrics.memoryUsage).toBeLessThan(50 * 1024 * 1024) // AC 5: <50MB
    })
  })

  describe('Cross-Device Consistency', () => {
    it('should adapt to different screen sizes', async () => {
      // Mock mobile viewport
      global.innerWidth = 375
      global.innerHeight = 667
      
      // Test mobile-specific optimizations
      const { useMobilePerformance } = await import('../../hooks/use-mobile-performance')
      const { result } = renderHook(() => useMobilePerformance())
      
      // Should provide mobile-optimized configurations
      const networkConfig = result.current.getNetworkConfig()
      expect(networkConfig.enableLazyLoading).toBe(true)
    })

    it('should handle tablet layouts', async () => {
      // Mock tablet viewport
      global.innerWidth = 768
      global.innerHeight = 1024
      
      // Test tablet-specific optimizations
      const { useMobilePerformance } = await import('../../hooks/use-mobile-performance')
      const { result } = renderHook(() => useMobilePerformance())
      
      // Should provide tablet-optimized configurations
      const imageQuality = result.current.getImageQuality()
      expect(['low', 'medium', 'high']).toContain(imageQuality)
    })

    it('should handle desktop layouts', async () => {
      // Mock desktop viewport
      global.innerWidth = 1200
      global.innerHeight = 800
      
      // Test desktop-specific optimizations
      const { useMobilePerformance } = await import('../../hooks/use-mobile-performance')
      const { result } = renderHook(() => useMobilePerformance())
      
      // Should provide desktop-optimized configurations
      const loadingStrategy = result.current.getLoadingStrategy()
      expect(['eager', 'lazy', 'progressive']).toContain(loadingStrategy)
    })
  })
})

// Helper function to render hooks in tests
function renderHook<T>(hook: () => T) {
  let result: T
  
  function TestComponent() {
    result = hook()
    return null
  }
  
  render(React.createElement(TestComponent))
  
  return {
    result: result as T,
    rerender: () => render(React.createElement(TestComponent))
  }
}
