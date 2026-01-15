/**
 * Simple Optimized Image Component
 * 
 * Mobile-optimized image component with responsive loading,
 * lazy loading, and network-aware quality adjustment.
 */

"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useMobileLayout } from '../../infin8content/hooks/use-mobile-layout'

interface SimpleOptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: 'low' | 'medium' | 'high'
  loading?: 'lazy' | 'eager'
}

export const SimpleOptimizedImage: React.FC<SimpleOptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality,
  loading
}) => {
  const { isMobile } = useMobileLayout()
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Determine optimal quality based on device
  const optimalQuality = quality || (isMobile ? 'medium' : 'high')
  const optimalLoading = loading || (priority ? 'eager' : 'lazy')

  // Generate optimized src
  const optimizedSrc = `${src}?w=${width || 800}&q=${optimalQuality === 'low' ? '30' : optimalQuality === 'medium' ? '60' : '85'}`

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true)
    setHasError(false)
  }

  // Handle image error
  const handleError = () => {
    setHasError(true)
  }

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || optimalLoading === 'eager') return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = optimizedSrc
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
  }, [optimizedSrc, optimalLoading, priority])

  return (
    <div 
      className={`simple-optimized-image-container ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        position: 'relative',
        display: 'inline-block'
      }}
    >
      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            style={{
              width: '24px',
              height: '24px',
              border: '2px solid #e5e7eb',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
        </div>
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={priority || optimalLoading === 'eager' ? optimizedSrc : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={optimalLoading}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto',
          objectFit: 'cover',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-out'
        }}
      />

      {/* Error state */}
      {hasError && (
        <div 
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
                if (imgRef.current) {
                  imgRef.current.src = optimizedSrc
                }
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

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .simple-optimized-image-container {
          position: relative;
          display: inline-block;
        }
      `}</style>
    </div>
  )
}

export default SimpleOptimizedImage
