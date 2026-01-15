"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMobileLayout } from './use-mobile-layout'
import { mobilePerformanceMonitor, PerformanceMetrics } from '../lib/mobile/performance-monitor'
import { networkOptimizer } from '../lib/mobile/network-optimizer'
import { touchOptimizer } from '../lib/mobile/touch-optimizer'

export const useMobilePerformance = () => {
  const { isMobile } = useMobileLayout()
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    touchResponseTime: 0,
    pageLoadTime: 0,
    animationFrameRate: 60,
    memoryUsage: 0,
    networkSpeed: 'unknown',
    devicePerformance: 'medium'
  })

  // Start monitoring on mobile devices
  useEffect(() => {
    if (isMobile) {
      mobilePerformanceMonitor.startMonitoring()
      
      // Update metrics periodically
      const interval = setInterval(() => {
        const currentMetrics = mobilePerformanceMonitor.getCurrentMetrics()
        setMetrics(currentMetrics)
      }, 1000) // Update every second

      return () => {
        clearInterval(interval)
        mobilePerformanceMonitor.stopMonitoring()
      }
    }
  }, [isMobile])

  // Touch response measurement
  const measureTouchResponse = useCallback((startTime: number, target: string) => {
    if (isMobile) {
      mobilePerformanceMonitor.measureTouchResponse(startTime, target)
    }
  }, [isMobile])

  // Animation performance measurement
  const measureAnimationPerformance = useCallback(() => {
    if (isMobile) {
      mobilePerformanceMonitor.measureAnimationPerformance()
    }
  }, [isMobile])

  // Network optimization
  const getNetworkConfig = useCallback(() => {
    return networkOptimizer.getOptimizationConfig()
  }, [])

  const getImageQuality = useCallback(() => {
    return networkOptimizer.getImageQuality()
  }, [])

  const getLoadingStrategy = useCallback(() => {
    return networkOptimizer.getLoadingStrategy()
  }, [])

  // Touch optimization
  const optimizeTouchTargets = useCallback(() => {
    if (isMobile) {
      touchOptimizer.optimizeTouchTargets()
    }
  }, [isMobile])

  const addTouchFeedback = useCallback((element: Element) => {
    if (isMobile) {
      touchOptimizer.addTouchFeedback(element)
    }
  }, [isMobile])

  // Performance optimization utilities
  const optimizeForMobile = useCallback(() => {
    if (!isMobile) return

    const networkConfig = getNetworkConfig()
    const devicePerformance = metrics.devicePerformance

    // Add performance classes to body
    document.body.classList.toggle('low-performance', devicePerformance === 'low')
    document.body.classList.toggle('reduce-motion', networkConfig.adaptiveQuality && devicePerformance !== 'high')
    document.body.classList.toggle('low-quality', getImageQuality() === 'low')

    // Optimize touch targets
    optimizeTouchTargets()

    // Optimize images
    const images = document.querySelectorAll('img:not([loading])')
    images.forEach(img => {
      if (networkConfig.enableLazyLoading) {
        img.setAttribute('loading', 'lazy')
      }
    })
  }, [isMobile, metrics.devicePerformance, getNetworkConfig, getImageQuality, optimizeTouchTargets])

  // Apply optimizations when metrics or network changes
  useEffect(() => {
    optimizeForMobile()
  }, [optimizeForMobile])

  // Subscribe to network changes
  useEffect(() => {
    if (!isMobile) return

    const unsubscribe = networkOptimizer.subscribe((network) => {
      setMetrics((prev: PerformanceMetrics) => ({ ...prev, networkSpeed: network.effectiveType }))
    })

    return unsubscribe
  }, [isMobile])

  // Get performance suggestions
  const performanceSuggestions = useMemo(() => {
    if (!isMobile) return []
    return mobilePerformanceMonitor.getOptimizationSuggestions()
  }, [isMobile, metrics])

  return {
    metrics,
    measureTouchResponse,
    measureAnimationPerformance,
    optimizeForMobile,
    getNetworkConfig,
    getImageQuality,
    getLoadingStrategy,
    optimizeTouchTargets,
    addTouchFeedback,
    performanceSuggestions,
    isPerformanceOptimized: metrics.touchResponseTime < 200 && 
                           metrics.pageLoadTime < 3000 && 
                           metrics.animationFrameRate >= 55
  }
}
