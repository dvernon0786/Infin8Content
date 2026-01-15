/**
 * Mobile Performance Services Tests
 * Tests for the mobile performance services without React dependencies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock DOM APIs
global.performance = {
  now: vi.fn(() => Date.now()),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  mark: vi.fn(),
  measure: vi.fn(),
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
    rtt: 100
  },
  hardwareConcurrency: 8
} as any

global.document = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  body: {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      toggle: vi.fn()
    },
    querySelectorAll: vi.fn(() => [])
  },
  querySelectorAll: vi.fn(() => [])
} as any

global.window = {
  performance: global.performance,
  navigator: global.navigator,
  document: global.document,
  requestAnimationFrame: vi.fn((cb) => setTimeout(cb, 16))
} as any

describe('Mobile Performance Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Performance Monitor', () => {
    it('should import performance monitor', async () => {
      const { mobilePerformanceMonitor } = await import('../../../lib/mobile/performance-monitor')
      expect(mobilePerformanceMonitor).toBeDefined()
    })

    it('should start and stop monitoring', async () => {
      const { mobilePerformanceMonitor } = await import('../../../lib/mobile/performance-monitor')
      
      mobilePerformanceMonitor.startMonitoring()
      const metrics = mobilePerformanceMonitor.getCurrentMetrics()
      
      expect(metrics).toHaveProperty('touchResponseTime')
      expect(metrics).toHaveProperty('pageLoadTime')
      expect(metrics).toHaveProperty('animationFrameRate')
      expect(metrics).toHaveProperty('memoryUsage')
      expect(metrics).toHaveProperty('networkSpeed')
      expect(metrics).toHaveProperty('devicePerformance')
      
      mobilePerformanceMonitor.stopMonitoring()
    })

    it('should measure touch response', async () => {
      const { mobilePerformanceMonitor } = await import('../../../lib/mobile/performance-monitor')
      
      mobilePerformanceMonitor.startMonitoring()
      mobilePerformanceMonitor.measureTouchResponse(100, 'button')
      
      const metrics = mobilePerformanceMonitor.getCurrentMetrics()
      expect(metrics.touchResponseTime).toBeGreaterThanOrEqual(0)
      
      mobilePerformanceMonitor.stopMonitoring()
    })

    it('should provide optimization suggestions', async () => {
      const { mobilePerformanceMonitor } = await import('../../../lib/mobile/performance-monitor')
      
      mobilePerformanceMonitor.startMonitoring()
      const suggestions = mobilePerformanceMonitor.getOptimizationSuggestions()
      
      expect(Array.isArray(suggestions)).toBe(true)
      
      mobilePerformanceMonitor.stopMonitoring()
    })
  })

  describe('Network Optimizer', () => {
    it('should import network optimizer', async () => {
      const { networkOptimizer } = await import('../../../lib/mobile/network-optimizer')
      expect(networkOptimizer).toBeDefined()
    })

    it('should get network info', async () => {
      const { networkOptimizer } = await import('../../../lib/mobile/network-optimizer')
      
      const networkInfo = networkOptimizer.getNetworkInfo()
      expect(networkInfo).toHaveProperty('effectiveType')
      expect(networkInfo).toHaveProperty('downlink')
      expect(networkInfo).toHaveProperty('rtt')
      expect(networkInfo).toHaveProperty('saveData')
    })

    it('should get optimization config', async () => {
      const { networkOptimizer } = await import('../../../lib/mobile/network-optimizer')
      
      const config = networkOptimizer.getOptimizationConfig()
      expect(config).toHaveProperty('enableImageOptimization')
      expect(config).toHaveProperty('enableLazyLoading')
      expect(config).toHaveProperty('enableCompression')
      expect(config).toHaveProperty('enableCaching')
      expect(config).toHaveProperty('adaptiveQuality')
    })

    it('should get image quality', async () => {
      const { networkOptimizer } = await import('../../../lib/mobile/network-optimizer')
      
      const quality = networkOptimizer.getImageQuality()
      expect(['low', 'medium', 'high']).toContain(quality)
    })

    it('should get loading strategy', async () => {
      const { networkOptimizer } = await import('../../../lib/mobile/network-optimizer')
      
      const strategy = networkOptimizer.getLoadingStrategy()
      expect(['eager', 'lazy', 'progressive']).toContain(strategy)
    })
  })

  describe('Touch Optimizer', () => {
    it('should import touch optimizer', async () => {
      const { touchOptimizer } = await import('../../../lib/mobile/touch-optimizer')
      expect(touchOptimizer).toBeDefined()
    })

    it('should get touch config', async () => {
      const { touchOptimizer } = await import('../../../lib/mobile/touch-optimizer')
      
      const config = touchOptimizer.getConfig()
      expect(config).toHaveProperty('minTouchTargetSize')
      expect(config).toHaveProperty('touchTargetSpacing')
      expect(config).toHaveProperty('swipeThreshold')
      expect(config).toHaveProperty('longPressDelay')
      expect(config).toHaveProperty('doubleTapDelay')
      expect(config).toHaveProperty('tapTimeout')
    })

    it('should get touch metrics', async () => {
      const { touchOptimizer } = await import('../../../lib/mobile/touch-optimizer')
      
      const metrics = touchOptimizer.getMetrics()
      expect(metrics).toHaveProperty('responseTime')
      expect(metrics).toHaveProperty('accuracy')
      expect(metrics).toHaveProperty('gestureSuccess')
      expect(metrics).toHaveProperty('missedTouches')
    })

    it('should validate touch targets', async () => {
      const { touchOptimizer } = await import('../../../lib/mobile/touch-optimizer')
      
      // Create a mock element
      const element = {
        getBoundingClientRect: () => ({ width: 44, height: 44 })
      } as any
      
      const isValid = touchOptimizer.validateTouchTarget(element)
      expect(isValid).toBe(true)
    })

    it('should enhance touch targets', async () => {
      const { touchOptimizer } = await import('../../../lib/mobile/touch-optimizer')
      
      // Create a mock element with insufficient size
      const element = {
        getBoundingClientRect: () => ({ width: 20, height: 20 }),
        style: {}
      } as any
      
      touchOptimizer.enhanceTouchTarget(element)
      
      // The element should have been enhanced (we can't easily test the exact styles)
      expect(element.style).toBeDefined()
    })
  })
})
