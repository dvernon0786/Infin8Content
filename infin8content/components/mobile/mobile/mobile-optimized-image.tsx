/**
 * Mobile Optimized Image Component
 * 
 * Wrapper around OptimizedImage with mobile-specific enhancements
 * including lazy loading, network-aware quality, and touch interactions.
 */

"use client"

import React, { useState } from 'react'
import { OptimizedImage } from '../../../../components/ui/optimized-image'
import { useMobilePerformance } from '../../../hooks/use-mobile-performance'
import { useMobileLayout } from '../../../hooks/use-mobile-layout'

interface MobileOptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: 'low' | 'medium' | 'high'
  loading?: 'lazy' | 'eager'
  sizes?: string
  srcset?: string
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
  enableTouchInteraction?: boolean
  showLoadingIndicator?: boolean
  fallbackComponent?: React.ReactNode
}

export const MobileOptimizedImage: React.FC<MobileOptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality,
  loading,
  sizes,
  srcset,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  enableTouchInteraction = true,
  showLoadingIndicator = true,
  fallbackComponent
}) => {
  const { getImageQuality, getLoadingStrategy } = useMobilePerformance()
  const { isMobile } = useMobileLayout()
  const [isTouched, setIsTouched] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Get mobile-optimized quality and loading strategy
  const mobileQuality = quality || getImageQuality()
  const mobileLoading = loading || (priority ? 'eager' : getLoadingStrategy())

  // Touch interaction handlers
  const handleTouchStart = () => {
    if (enableTouchInteraction && isMobile) {
      setIsTouched(true)
    }
  }

  const handleTouchEnd = () => {
    if (enableTouchInteraction && isMobile) {
      setTimeout(() => setIsTouched(false), 150)
    }
  }

  const handleLoad = () => {
    setImageError(false)
    onLoad?.()
  }

  const handleError = () => {
    setImageError(true)
    onError?.()
  }

  const handleRetry = () => {
    setImageError(false)
  }

  // Mobile-specific sizes if not provided
  const mobileSizes = sizes || (isMobile 
    ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
    : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
  )

  // If image failed to load and fallback is provided
  if (imageError && fallbackComponent) {
    return <>{fallbackComponent}</>
  }

  return (
    <div 
      className={`mobile-optimized-image-container ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        display: 'inline-block',
        touchAction: 'manipulation'
      }}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        quality={mobileQuality}
        loading={mobileLoading}
        sizes={mobileSizes}
        srcset={srcset}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-transform duration-150 ${
          isTouched ? 'scale-95' : 'scale-100'
        }`}
      />

      {/* Mobile touch feedback overlay */}
      {enableTouchInteraction && isMobile && (
        <div 
          className={`absolute inset-0 pointer-events-none transition-opacity duration-150 ${
            isTouched ? 'opacity-20' : 'opacity-0'
          }`}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: 'inherit'
          }}
        />
      )}

      {/* Custom loading indicator for mobile */}
      {showLoadingIndicator && isMobile && !imageError && (
        <div className="mobile-image-loading-indicator">
          <div 
            className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"
            style={{
              width: '20px',
              height: '20px',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>
      )}

      {/* Error state with retry for mobile */}
      {imageError && !fallbackComponent && (
        <div 
          className="mobile-image-error-state"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            fontSize: isMobile ? '12px' : '14px',
            textAlign: 'center',
            padding: '16px'
          }}
        >
          <div style={{ marginBottom: '8px' }}>Failed to load image</div>
          <button 
            onClick={handleRetry}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              minWidth: '44px',
              minHeight: '44px'
            }}
          >
            Retry
          </button>
        </div>
      )}

      <style jsx>{`
        .mobile-optimized-image-container {
          position: relative;
          display: inline-block;
        }

        .mobile-image-loading-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 10;
        }

        .mobile-image-error-state {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #f3f4f6;
          color: #6b7280;
          font-size: 12px;
          text-align: center;
          padding: 16px;
        }

        @media (max-width: 640px) {
          .mobile-image-error-state {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  )
}

export default MobileOptimizedImage
