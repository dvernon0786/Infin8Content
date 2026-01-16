/**
 * Mobile Touch Optimizer
 * 
 * Provides touch interaction optimization for mobile devices
 * including gesture recognition, touch target optimization,
 * and performance-enhanced touch handling.
 */

export interface TouchConfig {
  minTouchTargetSize: number // pixels
  touchTargetSpacing: number // pixels
  swipeThreshold: number // pixels
  longPressDelay: number // ms
  doubleTapDelay: number // ms
  tapTimeout: number // ms
}

export interface TouchMetrics {
  responseTime: number
  accuracy: number
  gestureSuccess: number
  missedTouches: number
}

export interface GestureEvent {
  type: 'swipe' | 'long-press' | 'double-tap' | 'pinch' | 'rotate'
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
  duration: number
  target: Element
}

export class TouchOptimizer {
  private config: TouchConfig
  private metrics: TouchMetrics
  private touchStartTime: number = 0
  private touchStartPos: { x: number; y: number } = { x: 0, y: 0 }
  private lastTapTime: number = 0
  private longPressTimer: number | null = null
  private gestureCallbacks: Map<string, ((event: GestureEvent) => void)[]> = new Map()

  constructor(config?: Partial<TouchConfig>) {
    this.config = {
      minTouchTargetSize: 44,
      touchTargetSpacing: 8,
      swipeThreshold: 50,
      longPressDelay: 500,
      doubleTapDelay: 300,
      tapTimeout: 200,
      ...config
    }

    this.metrics = {
      responseTime: 0,
      accuracy: 100,
      gestureSuccess: 100,
      missedTouches: 0
    }

    this.initializeTouchHandling()
  }

  /**
   * Get current touch configuration
   */
  getConfig(): TouchConfig {
    return { ...this.config }
  }

  /**
   * Update touch configuration
   */
  updateConfig(newConfig: Partial<TouchConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current touch metrics
   */
  getMetrics(): TouchMetrics {
    return { ...this.metrics }
  }

  /**
   * Register gesture callback
   */
  onGesture(type: string, callback: (event: GestureEvent) => void): () => void {
    if (!this.gestureCallbacks.has(type)) {
      this.gestureCallbacks.set(type, [])
    }
    
    this.gestureCallbacks.get(type)!.push(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.gestureCallbacks.get(type)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  /**
   * Optimize touch targets on the page
   */
  optimizeTouchTargets(): void {
    const touchableElements = document.querySelectorAll(
      'button, a, input, textarea, select, [role="button"], [onclick], [ontouchstart]'
    )

    touchableElements.forEach(element => {
      this.optimizeTouchTarget(element as Element)
    })
  }

  /**
   * Check if element meets minimum touch target requirements
   */
  validateTouchTarget(element: Element): boolean {
    const rect = element.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    return width >= this.config.minTouchTargetSize && 
           height >= this.config.minTouchTargetSize
  }

  /**
   * Enhance touch target with padding if needed
   */
  enhanceTouchTarget(element: Element): void {
    if (this.validateTouchTarget(element)) return

    // SSR safety check - only run on client side
    if (typeof window === 'undefined') return
    
    const computedStyle = window.getComputedStyle(element)
    const currentPadding = {
      top: parseFloat(computedStyle.paddingTop) || 0,
      right: parseFloat(computedStyle.paddingRight) || 0,
      bottom: parseFloat(computedStyle.paddingBottom) || 0,
      left: parseFloat(computedStyle.paddingLeft) || 0
    }

    const rect = element.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    // Calculate needed padding
    const neededWidth = Math.max(0, this.config.minTouchTargetSize - width)
    const neededHeight = Math.max(0, this.config.minTouchTargetSize - height)

    if (neededWidth > 0 || neededHeight > 0) {
      const extraPaddingX = neededWidth / 2
      const extraPaddingY = neededHeight / 2

      // Apply padding using inline styles for maximum specificity
      ;(element as HTMLElement).style.paddingTop = `${currentPadding.top + extraPaddingY}px`
      ;(element as HTMLElement).style.paddingRight = `${currentPadding.right + extraPaddingX}px`
      ;(element as HTMLElement).style.paddingBottom = `${currentPadding.bottom + extraPaddingY}px`
      ;(element as HTMLElement).style.paddingLeft = `${currentPadding.left + extraPaddingX}px`
    }
  }

  /**
   * Add touch feedback to element
   */
  addTouchFeedback(element: Element): void {
    const htmlElement = element as HTMLElement
    
    // Add touch feedback styles
    htmlElement.style.transition = 'transform 0.1s ease-out, opacity 0.1s ease-out'
    htmlElement.style.transformOrigin = 'center'

    const handleTouchStart = (e: TouchEvent) => {
      htmlElement.style.transform = 'scale(0.95)'
      htmlElement.style.opacity = '0.8'
    }

    const handleTouchEnd = (e: TouchEvent) => {
      htmlElement.style.transform = 'scale(1)'
      htmlElement.style.opacity = '1'
    }

    const handleTouchCancel = (e: TouchEvent) => {
      htmlElement.style.transform = 'scale(1)'
      htmlElement.style.opacity = '1'
    }

    htmlElement.addEventListener('touchstart', handleTouchStart, { passive: true })
    htmlElement.addEventListener('touchend', handleTouchEnd, { passive: true })
    htmlElement.addEventListener('touchcancel', handleTouchCancel, { passive: true })
  }

  /**
   * Prevent default touch behaviors on specific elements
   */
  preventDefaultTouch(selector: string): void {
    const elements = document.querySelectorAll(selector)
    
    elements.forEach(element => {
      element.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false })
      element.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })
    })
  }

  /**
   * Enable pull-to-refresh functionality
   */
  enablePullToRefresh(callback: () => void): () => void {
    let startY = 0
    let pullDistance = 0
    let isPulling = false

    const handleTouchStart = (e: TouchEvent) => {
      // SSR safety check - only run on client side
      if (typeof window === 'undefined') return
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY
        isPulling = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return

      const currentY = e.touches[0].clientY
      pullDistance = currentY - startY

      // SSR safety check - only run on client side
      if (typeof window !== 'undefined' && pullDistance > 0 && window.scrollY === 0) {
        e.preventDefault()
        
        // Add visual feedback
        document.body.style.transform = `translateY(${Math.min(pullDistance * 0.5, 100)}px)`
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isPulling) return

      document.body.style.transform = ''
      
      if (pullDistance > 100) {
        callback()
      }

      isPulling = false
      pullDistance = 0
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    // Return cleanup function
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }

  /**
   * Initialize touch handling
   */
  private initializeTouchHandling(): void {
    document.addEventListener('touchstart', this.handleTouchStart, { passive: true })
    document.addEventListener('touchmove', this.handleTouchMove, { passive: true })
    document.addEventListener('touchend', this.handleTouchEnd, { passive: true })
    document.addEventListener('touchcancel', this.handleTouchCancel, { passive: true })
  }

  /**
   * Handle touch start events
   */
  private handleTouchStart = (e: TouchEvent): void => {
    this.touchStartTime = performance.now()
    this.touchStartPos = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }

    // Start long press timer - SSR safety check
    if (typeof window !== 'undefined') {
      this.longPressTimer = window.setTimeout(() => {
        this.handleLongPress(e.target as Element)
      }, this.config.longPressDelay)
    }
  }

  /**
   * Handle touch move events
   */
  private handleTouchMove = (e: TouchEvent): void => {
    // Cancel long press if moved
    if (this.longPressTimer) {
      const moveDistance = Math.sqrt(
        Math.pow(e.touches[0].clientX - this.touchStartPos.x, 2) +
        Math.pow(e.touches[0].clientY - this.touchStartPos.y, 2)
      )

      if (moveDistance > 10) { // Moved more than 10px
        clearTimeout(this.longPressTimer)
        this.longPressTimer = null
      }
    }
  }

  /**
   * Handle touch end events
   */
  private handleTouchEnd = (e: TouchEvent): void => {
    const endTime = performance.now()
    const responseTime = endTime - this.touchStartTime

    // Update metrics
    this.metrics.responseTime = (this.metrics.responseTime + responseTime) / 2

    // Cancel long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }

    // Check for tap
    if (responseTime < this.config.tapTimeout) {
      this.handleTap(e.target as Element)
    }

    // Check for swipe
    const endPos = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    }

    const distance = Math.sqrt(
      Math.pow(endPos.x - this.touchStartPos.x, 2) +
      Math.pow(endPos.y - this.touchStartPos.y, 2)
    )

    if (distance > this.config.swipeThreshold) {
      this.handleSwipe(e.target as Element, this.touchStartPos, endPos)
    }
  }

  /**
   * Handle touch cancel events
   */
  private handleTouchCancel = (e: TouchEvent): void => {
    // Cancel long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }

    this.metrics.missedTouches++
  }

  /**
   * Handle tap events
   */
  private handleTap(target: Element): void {
    const currentTime = performance.now()
    
    // Check for double tap
    if (currentTime - this.lastTapTime < this.config.doubleTapDelay) {
      this.handleDoubleTap(target)
    }
    
    this.lastTapTime = currentTime
  }

  /**
   * Handle double tap events
   */
  private handleDoubleTap(target: Element): void {
    const event: GestureEvent = {
      type: 'double-tap',
      duration: 0,
      target
    }

    this.triggerGesture('double-tap', event)
  }

  /**
   * Handle long press events
   */
  private handleLongPress(target: Element): void {
    const event: GestureEvent = {
      type: 'long-press',
      duration: this.config.longPressDelay,
      target
    }

    this.triggerGesture('long-press', event)
  }

  /**
   * Handle swipe events
   */
  private handleSwipe(target: Element, startPos: { x: number; y: number }, endPos: { x: number; y: number }): void {
    const deltaX = endPos.x - startPos.x
    const deltaY = endPos.y - startPos.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    let direction: 'up' | 'down' | 'left' | 'right'
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left'
    } else {
      direction = deltaY > 0 ? 'down' : 'up'
    }

    const event: GestureEvent = {
      type: 'swipe',
      direction,
      distance,
      duration: performance.now() - this.touchStartTime,
      target
    }

    this.triggerGesture('swipe', event)
  }

  /**
   * Trigger gesture event
   */
  private triggerGesture(type: string, event: GestureEvent): void {
    const callbacks = this.gestureCallbacks.get(type)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error('Error in gesture callback:', error)
        }
      })
    }
  }

  /**
   * Optimize individual touch target
   */
  private optimizeTouchTarget(element: Element): void {
    this.enhanceTouchTarget(element)
    this.addTouchFeedback(element)
  }
}

// Singleton instance
export const touchOptimizer = new TouchOptimizer()
