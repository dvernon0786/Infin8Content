/**
 * Mobile Optimized Image Component
 * 
 * Wrapper around OptimizedImage with mobile-specific enhancements
 * including lazy loading, network-aware quality, and touch interactions.
 */

"use client"

import React, { useState } from 'react'
import { OptimizedImage } from '../../ui/optimized-image'
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
  const networkLoadingStrategy = getLoadingStrategy()
  const mobileLoading = loading || (priority ? 'eager' : 
    (networkLoadingStrategy === 'progressive' ? 'lazy' : networkLoadingStrategy))

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
      className={`mobile-optimized-image-container relative inline-block touch-manipulation ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
          className={`absolute inset-0 pointer-events-none transition-opacity duration-150 bg-black/10 rounded-inherit ${
            isTouched ? 'opacity-20' : 'opacity-0'
          }`}
        />
      )}

      {/* Custom loading indicator for mobile */}
      {showLoadingIndicator && isMobile && !imageError && (
        <div className="mobile-image-loading-indicator">
          <div 
            className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          />
        </div>
      )}

      {/* Error state with retry for mobile */}
      {imageError && !fallbackComponent && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-500 text-center p-4"
        >
          <div className="mb-2">Failed to load image</div>
          <button 
            onClick={handleRetry}
            className="px-3 py-1.5 text-xs bg-blue-500 text-white border-0 rounded cursor-pointer min-w-[44px] min-h-[44px]"
          >
            Retry
          </button>
        </div>
      )}

    </div>
  )
}

export default MobileOptimizedImage
