/**
 * Optimized Image Component
 * 
 * Mobile-optimized image component with responsive loading,
 * lazy loading, and network-aware quality adjustment.
 */

"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useMobileLayout } from '../infin8content/hooks/use-mobile-layout'

interface OptimizedImageProps {
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
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 'medium',
  loading = 'lazy',
  sizes,
  srcset,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError
}) => {
  const { isMobile } = useMobileLayout()
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Generate responsive srcset if not provided
  const generateSrcset = (baseSrc: string): string => {
    if (srcset) return srcset
    
    const widths = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
    return widths
      .map(w => `${baseSrc}?w=${w} ${w}w`)
      .join(', ')
  }

  // Generate sizes if not provided
  const generateSizes = (): string => {
    if (sizes) return sizes
    
    if (isMobile) {
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
    }
    
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
  }

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  // Handle image error
  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  // Get quality parameter for URL
  const getQualityParam = (): number => {
    switch (quality) {
      case 'low': return 40
      case 'medium': return 75
      case 'high': return 90
      default: return 75
    }
  }

  // Build image URL with parameters
  const buildImageUrl = (baseSrc: string): string => {
    const url = new URL(baseSrc, window.location.origin)
    url.searchParams.set('q', getQualityParam().toString())
    if (width) url.searchParams.set('w', width.toString())
    if (height) url.searchParams.set('h', height.toString())
    return url.toString()
  }

  return (
    <div className={`relative ${className}`}>
      <img
        ref={imgRef}
        src={buildImageUrl(src)}
        srcSet={generateSrcset(src)}
        sizes={generateSizes()}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`
          transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
          ${hasError ? 'hidden' : ''}
        `}
      />
      
      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div 
          className={`
            absolute inset-0 bg-muted animate-pulse
            ${isLoaded ? 'opacity-0' : 'opacity-100'}
            transition-opacity duration-300
          `}
          style={{ 
            width: width ? `${width}px` : '100%',
            height: height ? `${height}px` : 'auto'
          }}
        />
      )}
      
      {/* Error fallback */}
      {hasError && (
        <div 
          className="flex items-center justify-center bg-muted text-muted-foreground"
          style={{ 
            width: width ? `${width}px` : '100%',
            height: height ? `${height}px` : '200px'
          }}
        >
          <span className="text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  )
}