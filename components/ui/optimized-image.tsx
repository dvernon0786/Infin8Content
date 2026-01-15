/**
 * Optimized Image Component
 * 
 * Mobile-optimized image component with responsive loading,
 * lazy loading, and network-aware quality adjustment.
 */

"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useMobilePerformance } from '../../hooks/use-mobile-performance'

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
  quality,
  loading,
  sizes,
  srcset,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError
}) => {
  const { getImageQuality, getLoadingStrategy, isMobile } = useMobilePerformance()
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const imgRef = useRef<HTMLImageElement>(null)

  // Determine optimal quality based on network and device
  const optimalQuality = quality || getImageQuality()
  const optimalLoading = loading || (priority ? 'eager' : getLoadingStrategy())

  // Generate responsive srcset if not provided
  const generateSrcSet = (originalSrc: string, imageQuality: 'low' | 'medium' | 'high') => {
    if (srcset) return srcset

    const sizes = {
      low: '400w',
      medium: '800w',
      high: '1200w'
    }

    const qualities = {
      low: '30',
      medium: '60',
      high: '85'
    }

    return [
      `${originalSrc}?w=400&q=${qualities[imageQuality]} ${sizes.low]}`,
      `${originalSrc}?w=800&q=${qualities[imageQuality]} ${sizes.medium]}`,
      `${originalSrc}?w=1200&q=${qualities[imageQuality]} ${sizes.high]}`
    ].join(', ')
  }

  // Generate responsive sizes if not provided
  const generateSizes = () => {
    if (sizes) return sizes

    return isMobile 
      ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
      : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
  }

  // Generate blur placeholder
  const generateBlurDataURL = (originalSrc: string) => {
    if (blurDataURL) return blurDataURL
    return `${originalSrc}?w=20&q=10&blur=10`
  }

  // Update image source based on quality changes
  useEffect(() => {
    const newQuality = quality || getImageQuality()
    const optimizedSrc = `${src}?q=${newQuality === 'low' ? '30' : newQuality === 'medium' ? '60' : '85'}`
    setCurrentSrc(optimizedSrc)
  }, [src, quality, getImageQuality])

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true)
    setHasError(false)
    onLoad?.()
  }

  // Handle image error
  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || optimalLoading === 'eager') return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = currentSrc
            observer.unobserve(img)
          }
        })
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current)
      }
    }
  }, [currentSrc, optimalLoading, priority])

  // Generate placeholder style
  const placeholderStyle = placeholder === 'blur' && !isLoaded ? {
    backgroundImage: `url(${generateBlurDataURL(src)})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(10px)',
    transform: 'scale(1.1)'
  } : {}

  // Container style for aspect ratio
  const containerStyle = width && height ? {
    width: width + 'px',
    height: height + 'px',
    position: 'relative' as const,
    overflow: 'hidden'
  } : {}

  return (
    <div 
      className={`optimized-image-container ${className}`}
      style={containerStyle}
    >
      {/* Placeholder */}
      {placeholder === 'blur' && !isLoaded && !hasError && (
        <div 
          className="optimized-image-placeholder"
          style={{
            ...placeholderStyle,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transition: 'opacity 0.3s ease-out'
          }}
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={priority || optimalLoading === 'eager' ? currentSrc : undefined}
        srcSet={priority || optimalLoading === 'eager' ? generateSrcSet(src, optimalQuality) : undefined}
        sizes={generateSizes()}
        alt={alt}
        width={width}
        height={height}
        loading={optimalLoading}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: width ? width + 'px' : '100%',
          height: height ? height + 'px' : 'auto',
          objectFit: 'cover',
          transition: 'opacity 0.3s ease-out',
          opacity: isLoaded ? 1 : 0
        }}
        className={`optimized-image ${isLoaded ? 'loaded' : 'loading'}`}
      />

      {/* Error state */}
      {hasError && (
        <div 
          className="optimized-image-error"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            fontSize: '14px',
            textAlign: 'center'
          }}
        >
          <div>
            <div>Failed to load image</div>
            <button 
              onClick={() => {
                setHasError(false)
                setIsLoaded(false)
                setCurrentSrc(src)
              }}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {!isLoaded && !hasError && (
        <div 
          className="optimized-image-loading"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '24px',
            height: '24px',
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .optimized-image-container {
          position: relative;
          display: inline-block;
        }

        .optimized-image.loaded {
          opacity: 1;
        }

        .optimized-image.loading {
          opacity: 0;
        }
      `}</style>
    </div>
  )
}

export default OptimizedImage
