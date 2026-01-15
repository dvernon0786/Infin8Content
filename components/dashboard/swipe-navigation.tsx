/**
 * Mobile Swipe Navigation Component
 * 
 * Implements swipe gestures for mobile dashboard navigation
 * including pull-to-refresh and swipe-to-navigate functionality.
 */

"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useMobilePerformance } from '../../hooks/use-mobile-performance'
import { touchOptimizer } from '../../lib/mobile/touch-optimizer'

interface SwipeNavigationProps {
  children: React.ReactNode
  onPullToRefresh?: () => void | Promise<void>
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  pullToRefreshThreshold?: number
  swipeThreshold?: number
  enablePullToRefresh?: boolean
  enableSwipeNavigation?: boolean
  className?: string
}

export const SwipeNavigation: React.FC<SwipeNavigationProps> = ({
  children,
  onPullToRefresh,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  pullToRefreshThreshold = 100,
  swipeThreshold = 50,
  enablePullToRefresh = true,
  enableSwipeNavigation = true,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { addTouchFeedback } = useMobilePerformance()

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const pullStartRef = useRef<{ y: number; scrollTop: number } | null>(null)

  // Pull-to-refresh functionality
  useEffect(() => {
    if (!enablePullToRefresh || !onPullToRefresh) return

    const cleanup = touchOptimizer.enablePullToRefresh(async () => {
      if (isRefreshing) return
      
      setIsRefreshing(true)
      try {
        await onPullToRefresh()
      } catch (error) {
        console.error('Pull-to-refresh failed:', error)
      } finally {
        setIsRefreshing(false)
      }
    })

    return cleanup
  }, [enablePullToRefresh, onPullToRefresh, isRefreshing])

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    if (enablePullToRefresh && window.scrollY === 0) {
      pullStartRef.current = {
        y: touch.clientY,
        scrollTop: window.scrollY
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y

    // Handle pull-to-refresh
    if (enablePullToRefresh && pullStartRef.current && window.scrollY === 0) {
      const currentPullDistance = touch.clientY - pullStartRef.current.y
      
      if (currentPullDistance > 0) {
        e.preventDefault()
        setIsPulling(true)
        setPullDistance(Math.min(currentPullDistance * 0.5, pullToRefreshThreshold))
        
        // Add visual feedback
        if (containerRef.current) {
          containerRef.current.style.transform = `translateY(${Math.min(currentPullDistance * 0.5, pullToRefreshThreshold)}px)`
        }
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time

    // Reset pull-to-refresh
    if (isPulling) {
      setIsPulling(false)
      
      if (containerRef.current) {
        containerRef.current.style.transform = ''
      }

      // Trigger refresh if threshold exceeded
      if (pullDistance >= pullToRefreshThreshold && onPullToRefresh && !isRefreshing) {
        setIsRefreshing(true)
        onPullToRefresh().finally(() => {
          setIsRefreshing(false)
        })
      }

      setPullDistance(0)
      pullStartRef.current = null
    }

    // Handle swipe navigation
    if (enableSwipeNavigation && Math.abs(deltaX) > Math.abs(deltaY)) {
      const isSwipe = Math.abs(deltaX) > swipeThreshold && deltaTime < 300

      if (isSwipe) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      }
    } else if (enableSwipeNavigation) {
      const isSwipe = Math.abs(deltaY) > swipeThreshold && deltaTime < 300

      if (isSwipe) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown()
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp()
        }
      }
    }

    touchStartRef.current = null
  }

  // Add touch feedback to container
  useEffect(() => {
    if (containerRef.current) {
      addTouchFeedback(containerRef.current)
    }
  }, [addTouchFeedback])

  return (
    <div
      ref={containerRef}
      className={`swipe-navigation-container ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        minHeight: '100vh',
        touchAction: 'pan-y', // Allow vertical scrolling but handle horizontal swipes
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull-to-refresh indicator */}
      {enablePullToRefresh && (
        <div
          className="pull-to-refresh-indicator"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: `${Math.min(pullDistance, pullToRefreshThreshold)}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
            opacity: pullDistance / pullToRefreshThreshold,
            transition: 'opacity 0.2s ease-out',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          {isRefreshing ? (
            <div className="refresh-spinner">
              <div
                className="animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
                style={{
                  width: '24px',
                  height: '24px'
                }}
              />
            </div>
          ) : (
            <div className="refresh-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  transform: `rotate(${Math.min(pullDistance / pullToRefreshThreshold, 1) * 180}deg)`,
                  transition: 'transform 0.2s ease-out'
                }}
              >
                <path
                  d="M4 4v5h5M4 9a9 9 0 0 1 14.1-1.4M20 20v-5h-5M20 15a9 9 0 0 1-14.1 1.4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="swipe-navigation-content">
        {children}
      </div>

      {/* Swipe navigation hints (overlay) */}
      {enableSwipeNavigation && (
        <div className="swipe-hints" style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          opacity: 0.7,
          pointerEvents: 'none',
          zIndex: 999
        }}>
          Swipe to navigate
        </div>
      )}

      <style jsx>{`
        .swipe-navigation-container {
          position: relative;
          min-height: 100vh;
          touch-action: pan-y;
          transition: transform 0.3s ease-out;
        }

        .pull-to-refresh-indicator {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.2s ease-out;
          pointer-events: none;
          z-index: 1000;
        }

        .refresh-spinner,
        .refresh-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .swipe-hints {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          opacity: 0.7;
          pointer-events: none;
          z-index: 999;
        }

        @media (max-width: 640px) {
          .swipe-hints {
            font-size: 11px;
            padding: 6px 12px;
          }
        }
      `}</style>
    </div>
  )
}

export default SwipeNavigation
