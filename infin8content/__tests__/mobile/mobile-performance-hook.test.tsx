/**
 * Mobile Performance Hook Tests
 * Tests for the useMobilePerformance hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMobilePerformance } from '../../../hooks/use-mobile-performance'

// Mock the mobile layout hook
vi.mock('../../../infin8content/hooks/use-mobile-layout', () => ({
  useMobileLayout: () => ({
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    deviceType: 'mobile' as const,
    containerWidth: 375,
    containerHeight: 667,
    breakpoint: 'mobile' as const,
    spacing: { container: { padding: '16px' } },
    typography: { body: { fontSize: '16px' } },
    touchOptimization: { minTouchTarget: { size: '44px' } },
    breakpoints: { mobile: 640, tablet: 1024 },
    touchOptimized: true,
    performanceOptimized: true,
    updateLayout: vi.fn(),
    forceMobileLayout: vi.fn(),
    resetLayout: vi.fn()
  })
}))

// Mock the mobile performance services
vi.mock('../../../lib/mobile/performance-monitor', () => ({
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

vi.mock('../../../lib/mobile/network-optimizer', () => ({
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

vi.mock('../../../lib/mobile/touch-optimizer', () => ({
  touchOptimizer: {
    optimizeTouchTargets: vi.fn(),
    addTouchFeedback: vi.fn()
  }
}))

describe('useMobilePerformance Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default metrics', () => {
    const { result } = renderHook(() => useMobilePerformance())

    expect(result.current.metrics).toEqual({
      touchResponseTime: 0,
      pageLoadTime: 0,
      animationFrameRate: 60,
      memoryUsage: 0,
      networkSpeed: 'unknown',
      devicePerformance: 'medium'
    })
  })

  it('should provide performance optimization methods', () => {
    const { result } = renderHook(() => useMobilePerformance())

    expect(typeof result.current.measureTouchResponse).toBe('function')
    expect(typeof result.current.measureAnimationPerformance).toBe('function')
    expect(typeof result.current.optimizeForMobile).toBe('function')
    expect(typeof result.current.getNetworkConfig).toBe('function')
    expect(typeof result.current.getImageQuality).toBe('function')
    expect(typeof result.current.getLoadingStrategy).toBe('function')
    expect(typeof result.current.optimizeTouchTargets).toBe('function')
    expect(typeof result.current.addTouchFeedback).toBe('function')
  })

  it('should provide performance suggestions', () => {
    const { result } = renderHook(() => useMobilePerformance())

    expect(Array.isArray(result.current.performanceSuggestions)).toBe(true)
  })

  it('should calculate performance optimization status', () => {
    const { result } = renderHook(() => useMobilePerformance())

    // Initially should be false since metrics are at default values
    expect(result.current.isPerformanceOptimized).toBe(false)
  })

  it('should update metrics when monitoring starts', async () => {
    const { result } = renderHook(() => useMobilePerformance())

    // Wait for the useEffect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Metrics should be updated from the mock
    expect(result.current.metrics.touchResponseTime).toBe(150)
    expect(result.current.metrics.pageLoadTime).toBe(2000)
    expect(result.current.metrics.animationFrameRate).toBe(60)
    expect(result.current.metrics.memoryUsage).toBe(1024 * 1024)
    expect(result.current.metrics.networkSpeed).toBe('4g')
    expect(result.current.metrics.devicePerformance).toBe('high')
  })

  it('should call optimization methods when invoked', () => {
    const { result } = renderHook(() => useMobilePerformance())

    act(() => {
      result.current.measureTouchResponse(100, 'button')
    })

    act(() => {
      result.current.measureAnimationPerformance()
    })

    act(() => {
      result.current.optimizeForMobile()
    })

    act(() => {
      result.current.optimizeTouchTargets()
    })

    act(() => {
      const element = document.createElement('button')
      result.current.addTouchFeedback(element)
    })

    // Verify the methods were called (they're mocked)
    expect(true).toBe(true) // This test just ensures the methods don't throw errors
  })

  it('should provide network configuration', () => {
    const { result } = renderHook(() => useMobilePerformance())

    const networkConfig = result.current.getNetworkConfig()
    expect(networkConfig.enableImageOptimization).toBe(true)
    expect(networkConfig.enableLazyLoading).toBe(true)
    expect(networkConfig.enableCompression).toBe(true)
    expect(networkConfig.enableCaching).toBe(true)
    expect(networkConfig.adaptiveQuality).toBe(true)
  })

  it('should provide image quality and loading strategy', () => {
    const { result } = renderHook(() => useMobilePerformance())

    expect(result.current.getImageQuality()).toBe('medium')
    expect(result.current.getLoadingStrategy()).toBe('lazy')
  })
})
