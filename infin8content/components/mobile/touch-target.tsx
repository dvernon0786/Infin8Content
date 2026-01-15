import React, { useRef, useEffect, useCallback } from 'react';
import { useMobileLayout } from '@/hooks/use-mobile-layout';

// Types
export interface TouchTargetProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  disabled?: boolean;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  style?: React.CSSProperties;
  testId?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

// Mobile-specific constants
const MOBILE_TOUCH_TARGETS = {
  small: 40,
  medium: 44, // iOS HIG minimum
  large: 48,
} as const;

const VARIANTS = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700',
  secondary: 'bg-gray-500 text-white hover:bg-gray-600 active:bg-gray-700',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100',
  ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200',
} as const;

export const TouchTarget: React.FC<TouchTargetProps> = ({
  children,
  onPress,
  onLongPress,
  onTouchStart,
  onTouchEnd,
  disabled = false,
  loading = false,
  size = 'medium',
  variant = 'primary',
  className = '',
  style = {},
  testId = 'touch-target',
  ariaLabel,
  ariaDescribedBy,
}) => {
  const { touchOptimization } = useMobileLayout();
  const targetRef = useRef<HTMLDivElement>(null);
  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    isLongPressing: false,
  });
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Touch gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || loading) return;
    
    const touch = e.touches[0];
    if (!touch) return;
    
    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isLongPressing: false,
    };

    // Call custom onTouchStart
    onTouchStart?.();

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        touchStateRef.current.isLongPressing = true;
        onLongPress();
      }, touchOptimization.gestures.longPressDelay);
    }
  }, [disabled, loading, onLongPress, onTouchStart, touchOptimization]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled || loading) return;
    
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
    
    // Call custom onTouchEnd
    onTouchEnd?.();
    
    // Handle tap for onPress
    if (onPress && !touchStateRef.current.isLongPressing) {
      if (deltaX < 10 && deltaY < 10 && deltaTime < touchOptimization.gestures.tapTimeout) {
        onPress();
      }
    }
    
    touchStateRef.current.isLongPressing = false;
  }, [disabled, loading, onPress, onTouchEnd, touchOptimization]);

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

  const targetSize = MOBILE_TOUCH_TARGETS[size];
  const variantClasses = VARIANTS[variant];

  const targetClasses = [
    'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
    variantClasses,
    disabled && 'opacity-50 cursor-not-allowed',
    loading && 'animate-pulse',
    !disabled && !loading && 'active:scale-95 cursor-pointer',
    className,
  ].filter(Boolean).join(' ');

  const targetStyle = {
    minWidth: targetSize,
    minHeight: targetSize,
    ...style,
  };

  return (
    <div
      ref={targetRef}
      data-testid={testId}
      className={targetClasses}
      style={targetStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-busy={loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center">
        {children}
      </div>

      {/* Touch Feedback */}
      <div className="absolute inset-0 rounded-lg bg-white opacity-0 active:opacity-10 transition-opacity" />
    </div>
  );
};

export default TouchTarget;
