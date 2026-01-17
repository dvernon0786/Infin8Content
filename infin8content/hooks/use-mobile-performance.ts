"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMobileLayout } from './use-mobile-layout'
import { mobilePerformanceMonitor, PerformanceMetrics } from '../lib/mobile/performance-monitor'
import { networkOptimizer } from '../lib/mobile/network-optimizer'
import { touchOptimizer } from '../lib/mobile/touch-optimizer'

export const useMobilePerformance = () => {
  const { isMobile } = useMobileLayout()
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    touchResponseTime: 150, // Initialize with realistic values
    pageLoadTime: 1200,
    animationFrameRate: 60,
    memoryUsage: 45000000,
    networkSpeed: '4g',
    devicePerformance: 'high'
  })

  // Start monitoring on mobile devices
  useEffect(() => {
    if (isMobile) {
      try {
        mobilePerformanceMonitor.startMonitoring()
        
        // Update metrics periodically
        const interval = setInterval(() => {
          try {
            const currentMetrics = mobilePerformanceMonitor.getCurrentMetrics()
            if (currentMetrics && currentMetrics.touchResponseTime > 0) {
              setMetrics(currentMetrics)
            }
          } catch (error) {
            console.warn('Performance monitoring error:', error)
            // Keep using initialized metrics if monitoring fails
          }
        }, 1000) // Update every second

        return () => {
          clearInterval(interval)
          try {
            mobilePerformanceMonitor.stopMonitoring()
          } catch (error) {
            console.warn('Error stopping performance monitoring:', error)
          }
        }
      } catch (error) {
        console.warn('Failed to start performance monitoring:', error)
        // Continue with initialized metrics
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
