"use client"

import React, { useRef, useEffect, useCallback } from 'react';
import { useMobileLayout } from '@/hooks/use-mobile-layout';

// Types
export interface MobileCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  badge?: string;
  actions?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  testId?: string;
}

// Mobile-specific constants
const MOBILE_TOUCH_TARGET_SIZE = 44; // iOS HIG minimum


export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  title,
  subtitle,
  description,
  image,
  imageAlt,
  badge,
  actions,
  onPress,
  onLongPress,
  disabled = false,
  selected = false,
  loading = false,
  className = '',
  style = {},
  testId = 'mobile-card',
}) => {
  const { isMobile, touchOptimization } = useMobileLayout();
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    isLongPressing: false,
  });
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Touch gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!onPress && !onLongPress) return;
    
    const touch = e.touches[0];
    if (!touch) return;
    
    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isLongPressing: false,
    };

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        touchStateRef.current.isLongPressing = true;
        onLongPress();
      }, touchOptimization.gestures.longPressDelay);
    }
  }, [onPress, onLongPress, touchOptimization]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!onPress && !onLongPress) return;
    
    const touch = e.changedTouches[0];
    if (!touch) return;
    
    const deltaX = Math.abs(touch.clientX - touchStateRef.current.startX);
    const deltaY = Math.abs(touch.clientY - touchStateRef.current.startY);
    const deltaTime = Date.now() - touchStateRef.current.startTime;
    
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Handle tap for onPress
    if (onPress && !touchStateRef.current.isLongPressing) {
      if (deltaX < 10 && deltaY < 10 && deltaTime < touchOptimization.gestures.tapTimeout) {
        onPress();
      }
    }
    
    touchStateRef.current.isLongPressing = false;
  }, [onPress, touchOptimization]);

  const handleTouchMove = useCallback(() => {
    // Cancel long press if moved too much
    if (touchStateRef.current.isLongPressing && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      touchStateRef.current.isLongPressing = false;
    }
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const cardClasses = [
    'bg-white border border-neutral-200',
    'p-4',
    'm-2',
    'rounded-lg',
    'shadow-sm',
    isMobile && 'min-h-[44px]',
    disabled && 'opacity-50',
    selected && 'ring-1 ring-[--brand-electric-blue]/40',
    className,
  ].filter(Boolean).join(' ');;

  return (
    <div
      ref={cardRef}
      data-testid={testId}
      className={cardClasses}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role={onPress ? 'button' : undefined}
      tabIndex={onPress ? 0 : undefined}
      aria-disabled={disabled}
      aria-busy={loading}
    >
      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-[--brand-electric-blue] rounded-full animate-spin" />
        </div>
      )}

      {/* Image */}
      {image && (
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={image}
            alt={imageAlt || title || 'Card image'}
            className="w-full object-cover h-30"
            loading="lazy"
          />
          {badge && (
            <div className="absolute top-2 right-2 bg-neutral-200 text-neutral-700 px-2 py-1 rounded-full text-xs font-lato">
              {badge}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        {title && (
          <h3 className="font-poppins text-neutral-900 text-base font-semibold mb-1 line-clamp-2">
            {title}
          </h3>
        )}

        {/* Subtitle */}
        {subtitle && (
          <p className="font-lato text-neutral-600 text-sm mb-2 line-clamp-1">
            {subtitle}
          </p>
        )}

        {/* Description */}
        {description && (
          <p className="font-lato text-neutral-500 text-sm mb-3 line-clamp-3">
            {description}
          </p>
        )}

        {/* Children */}
        {children && (
          <div className="mb-3">
            {children}
          </div>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex items-center justify-end p-3 gap-2">
          {actions}
        </div>
      )}

      {/* Selected Indicator */}
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-[--brand-electric-blue] rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default MobileCard;
