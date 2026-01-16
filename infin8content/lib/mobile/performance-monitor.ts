/**
 * Mobile Performance Monitor
 * 
 * Provides comprehensive performance monitoring for mobile devices
 * including touch response, animation performance, memory usage,
 * and network optimization tracking.
 */

export interface PerformanceMetrics {
  touchResponseTime: number
  pageLoadTime: number
  animationFrameRate: number
  memoryUsage: number
  networkSpeed: string
  devicePerformance: 'high' | 'medium' | 'low'
}

export interface TouchMetrics {
  responseTime: number
  timestamp: number
  target: string
}

export interface AnimationMetrics {
  frameRate: number
  duration: number
  timestamp: number
}

export class MobilePerformanceMonitor {
  private touchMetrics: TouchMetrics[] = []
  private animationMetrics: AnimationMetrics[] = []
  private isMonitoring = false
  private observers: PerformanceObserver[] = []
  
  // Performance thresholds
  private readonly TOUCH_RESPONSE_THRESHOLD = 200 // ms
  private readonly PAGE_LOAD_THRESHOLD = 3000 // ms
  private readonly ANIMATION_FRAME_RATE_TARGET = 60 // fps
  private readonly MEMORY_WARNING_THRESHOLD = 50 * 1024 * 1024 // 50MB

  constructor() {
    this.setupPerformanceObservers()
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return
    
    // SSR safety check - only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }
    
    this.isMonitoring = true
    this.measureInitialMetrics()
    this.setupEventListeners()
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false
    this.cleanupEventListeners()
    this.cleanupObservers()
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    const avgTouchResponse = this.getAverageTouchResponse()
    const pageLoadTime = this.getPageLoadTime()
    const avgFrameRate = this.getAverageFrameRate()
    const memoryUsage = this.getMemoryUsage()
    const networkSpeed = this.getNetworkSpeed()
    const devicePerformance = this.getDevicePerformance()

    return {
      touchResponseTime: avgTouchResponse,
      pageLoadTime,
      animationFrameRate: avgFrameRate,
      memoryUsage,
      networkSpeed,
      devicePerformance
    }
  }

  /**
   * Measure touch response time
   */
  measureTouchResponse(startTime: number, target: string): void {
    if (!this.isMonitoring) return

    const endTime = performance.now()
    const responseTime = endTime - startTime

    const touchMetric: TouchMetrics = {
      responseTime,
      timestamp: endTime,
      target
    }

    this.touchMetrics.push(touchMetric)
    
    // Keep only last 10 touch metrics
    if (this.touchMetrics.length > 10) {
      this.touchMetrics.shift()
    }

    // Log slow responses
    if (responseTime > this.TOUCH_RESPONSE_THRESHOLD) {
      console.warn(`Slow touch response detected: ${responseTime.toFixed(2)}ms on ${target}`)
    }
  }

  /**
   * Measure animation performance
   */
  measureAnimationPerformance(): void {
    if (!this.isMonitoring) return

    let frameCount = 0
    let startTime = performance.now()
    let lastFrameTime = startTime

    const measureFrame = (currentTime: number) => {
      if (!this.isMonitoring) return

      frameCount++
      const frameDuration = currentTime - lastFrameTime
      lastFrameTime = currentTime

      // Measure for 1 second
      if (currentTime - startTime >= 1000) {
        const frameRate = frameCount
        const duration = currentTime - startTime

        const animationMetric: AnimationMetrics = {
          frameRate,
          duration,
          timestamp: currentTime
        }

        this.animationMetrics.push(animationMetric)
        
        // Keep only last 5 animation metrics
        if (this.animationMetrics.length > 5) {
          this.animationMetrics.shift()
        }

        // Log poor performance
        if (frameRate < this.ANIMATION_FRAME_RATE_TARGET * 0.8) {
          console.warn(`Low frame rate detected: ${frameRate}fps (target: ${this.ANIMATION_FRAME_RATE_TARGET}fps)`)
        }

        return
      }

      requestAnimationFrame(measureFrame)
    }

    requestAnimationFrame(measureFrame)
  }

  /**
   * Get average touch response time
   */
  private getAverageTouchResponse(): number {
    if (this.touchMetrics.length === 0) return 0
    
    const sum = this.touchMetrics.reduce((total, metric) => total + metric.responseTime, 0)
    return sum / this.touchMetrics.length
  }

  /**
   * Get page load time
   */
  private getPageLoadTime(): number {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (!navigation) return 0
    
    return navigation.loadEventEnd - navigation.loadEventStart
  }

  /**
   * Get average frame rate
   */
  private getAverageFrameRate(): number {
    if (this.animationMetrics.length === 0) return this.ANIMATION_FRAME_RATE_TARGET
    
    const sum = this.animationMetrics.reduce((total, metric) => total + metric.frameRate, 0)
    return sum / this.animationMetrics.length
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    const memory = (performance as any).memory
    if (!memory) return 0
    
    return memory.usedJSHeapSize
  }

  /**
   * Get network speed
   */
  private getNetworkSpeed(): string {
    // SSR safety check - only run on client side
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'unknown'
    }
    
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection
    
    if (!connection) return 'unknown'
    
    return connection.effectiveType || 'unknown'
  }

  /**
   * Get device performance classification
   */
  private getDevicePerformance(): 'high' | 'medium' | 'low' {
    // SSR safety check - only run on client side
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'medium' // Default fallback for server-side
    }
    
    const hardwareConcurrency = navigator.hardwareConcurrency || 4
    const memory = this.getMemoryUsage()
    const networkSpeed = this.getNetworkSpeed()

    // High performance: 8+ cores, good memory, fast network
    if (hardwareConcurrency >= 8 && 
        networkSpeed !== 'slow-2g' && 
        networkSpeed !== '2g' &&
        memory < this.MEMORY_WARNING_THRESHOLD) {
      return 'high'
    }

    // Low performance: 4 or fewer cores, slow network, high memory usage
    if (hardwareConcurrency <= 4 && 
        (networkSpeed === 'slow-2g' || networkSpeed === '2g') ||
        memory > this.MEMORY_WARNING_THRESHOLD * 2) {
      return 'low'
    }

    // Medium performance: everything else
    return 'medium'
  }

  /**
   * Setup performance observers
   */
  private setupPerformanceObservers(): void {
    // SSR safety check - only run on client side
    if (typeof window === 'undefined') return
    if (!('PerformanceObserver' in window)) return

    // Long task observer
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.entryType === 'long-task') {
            console.warn('Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime
            })
          }
        })
      })

      longTaskObserver.observe({ entryTypes: ['long-task'] })
      this.observers.push(longTaskObserver)
    } catch (e) {
      console.warn('Long task observation not supported')
    }

    // Layout shift observer
    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            console.warn('Layout shift detected:', {
              value: (entry as any).value,
              startTime: entry.startTime
            })
          }
        })
      })

      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(layoutShiftObserver)
    } catch (e) {
      console.warn('Layout shift observation not supported')
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Touch events
    document.addEventListener('touchstart', this.handleTouchStart, { passive: true })
    
    // Page visibility change
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    
    // Memory pressure (if available)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = this.getMemoryUsage()
        if (memory > this.MEMORY_WARNING_THRESHOLD) {
          console.warn(`High memory usage detected: ${(memory / 1024 / 1024).toFixed(2)}MB`)
        }
      }, 10000) // Check every 10 seconds
    }
  }

  /**
   * Cleanup event listeners
   */
  private cleanupEventListeners(): void {
    // SSR safety check - only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }
    
    document.removeEventListener('touchstart', this.handleTouchStart)
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
  }

  /**
   * Cleanup performance observers
   */
  private cleanupObservers(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }

  /**
   * Handle touch start events
   */
  private handleTouchStart = (event: TouchEvent): void => {
    const startTime = performance.now()
    const target = (event.target as Element).tagName

    // Measure response time after event processing
    setTimeout(() => {
      this.measureTouchResponse(startTime, target)
    }, 0)
  }

  /**
   * Handle visibility change
   */
  private handleVisibilityChange = (): void => {
    // SSR safety check - only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }
    
    if (document.hidden) {
      // Page is hidden, pause monitoring
      this.stopMonitoring()
    } else {
      // Page is visible, resume monitoring
      this.startMonitoring()
    }
  }

  /**
   * Measure initial metrics
   */
  private measureInitialMetrics(): void {
    // Measure page load time
    setTimeout(() => {
      const loadTime = this.getPageLoadTime()
      if (loadTime > this.PAGE_LOAD_THRESHOLD) {
        console.warn(`Slow page load detected: ${loadTime.toFixed(2)}ms`)
      }
    }, 100)

    // Start animation performance measurement
    setTimeout(() => {
      this.measureAnimationPerformance()
    }, 1000)
  }

  /**
   * Get performance optimization suggestions
   */
  getOptimizationSuggestions(): string[] {
    const metrics = this.getCurrentMetrics()
    const suggestions: string[] = []

    if (metrics.touchResponseTime > this.TOUCH_RESPONSE_THRESHOLD) {
      suggestions.push('Consider optimizing touch event handlers for faster response')
    }

    if (metrics.pageLoadTime > this.PAGE_LOAD_THRESHOLD) {
      suggestions.push('Optimize asset loading and consider lazy loading for non-critical resources')
    }

    if (metrics.animationFrameRate < this.ANIMATION_FRAME_RATE_TARGET * 0.8) {
      suggestions.push('Reduce animation complexity or use CSS transforms for better performance')
    }

    if (metrics.memoryUsage > this.MEMORY_WARNING_THRESHOLD) {
      suggestions.push('Implement memory management strategies and consider object pooling')
    }

    if (metrics.networkSpeed === 'slow-2g' || metrics.networkSpeed === '2g') {
      suggestions.push('Implement adaptive loading for slow network connections')
    }

    if (metrics.devicePerformance === 'low') {
      suggestions.push('Enable performance optimizations for low-end devices')
    }

    return suggestions
  }
}

// Singleton instance
export const mobilePerformanceMonitor = new MobilePerformanceMonitor()
