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
  badgeColor?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
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
const MOBILE_SPACING = {
  card: {
    padding: 16,
    margin: 8,
    borderRadius: 12,
    shadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  image: {
    height: 120,
    borderRadius: 8,
  },
  content: {
    padding: 12,
  },
  actions: {
    padding: 12,
    gap: 8,
  },
};

const BADGE_COLORS = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-800',
} as const;

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  title,
  subtitle,
  description,
  image,
  imageAlt,
  badge,
  badgeColor = 'blue',
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
    'bg-white rounded-lg shadow-sm transition-all duration-200',
    selected && 'ring-2 ring-blue-500 shadow-md',
    disabled && 'opacity-50',
    loading && 'animate-pulse',
    (onPress || onLongPress) && 'active:scale-95 cursor-pointer',
    className,
  ].filter(Boolean).join(' ');

  const cardStyle = {
    padding: MOBILE_SPACING.card.padding,
    margin: MOBILE_SPACING.card.margin,
    borderRadius: MOBILE_SPACING.card.borderRadius,
    boxShadow: MOBILE_SPACING.card.shadow,
    minHeight: isMobile ? MOBILE_TOUCH_TARGET_SIZE : 'auto',
    ...style,
  };

  return (
    <div
      ref={cardRef}
      data-testid={testId}
      className={cardClasses}
      style={cardStyle}
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
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Image */}
      {image && (
        <div className="relative overflow-hidden" style={{ borderRadius: MOBILE_SPACING.image.borderRadius }}>
          <img
            src={image}
            alt={imageAlt || title || 'Card image'}
            className="w-full object-cover"
            style={{ height: MOBILE_SPACING.image.height }}
            loading="lazy"
          />
          {badge && (
            <div
              className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${BADGE_COLORS[badgeColor]}`}
            >
              {badge}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: MOBILE_SPACING.content.padding }}>
        {/* Title */}
        {title && (
          <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
            {title}
          </h3>
        )}

        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
            {subtitle}
          </p>
        )}

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-3">
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
        <div 
          className="flex items-center justify-end"
          style={{ 
            padding: MOBILE_SPACING.actions.padding,
            gap: MOBILE_SPACING.actions.gap,
          }}
        >
          {actions}
        </div>
      )}

      {/* Selected Indicator */}
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
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
