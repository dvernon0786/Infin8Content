import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useMobileLayout } from '@/hooks/use-mobile-layout';

// Types
export interface MobileListItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  badge?: string;
  badgeColor?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  actions?: React.ReactNode;
  onPress?: (item: MobileListItem) => void;
  onLongPress?: (item: MobileListItem) => void;
  disabled?: boolean;
  selected?: boolean;
  loading?: boolean;
  metadata?: Record<string, any>;
}

export interface MobileListProps {
  items: MobileListItem[];
  onItemPress?: (item: MobileListItem) => void;
  onItemLongPress?: (item: MobileListItem) => void;
  onSelectionChange?: (selectedItems: Set<string>) => void;
  multiSelect?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  className?: string;
  style?: React.CSSProperties;
  testId?: string;
  renderItem?: (item: MobileListItem, index: number) => React.ReactNode;
  keyExtractor?: (item: MobileListItem, index: number) => string;
}

// Mobile-specific constants
const MOBILE_TOUCH_TARGET_SIZE = 44; // iOS HIG minimum
const MOBILE_SPACING = {
  list: {
    padding: 8,
    gap: 4,
  },
  item: {
    minHeight: 64,
    padding: 12,
    borderRadius: 8,
    margin: 4,
  },
  empty: {
    padding: 32,
    minHeight: 200,
  },
};

const BADGE_COLORS = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-800',
} as const;

export const MobileList: React.FC<MobileListProps> = ({
  items,
  onItemPress,
  onItemLongPress,
  onSelectionChange,
  multiSelect = false,
  loading = false,
  emptyMessage = 'No items found',
  emptyIcon = '📭',
  className = '',
  style = {},
  testId = 'mobile-list',
  renderItem,
  keyExtractor,
}) => {
  const { isMobile, touchOptimization } = useMobileLayout();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    itemId: null as string | null,
    isLongPressing: false,
  });
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update selection when items change
  useEffect(() => {
    if (!multiSelect) {
      setSelectedItems(new Set());
    }
  }, [items, multiSelect]);

  // Handle selection change
  useEffect(() => {
    onSelectionChange?.(selectedItems);
  }, [selectedItems, onSelectionChange]);

  // Touch gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent, itemId: string) => {
    const touch = e.touches[0];
    if (!touch) return;
    
    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      itemId,
      isLongPressing: false,
    };

    // Start long press timer
    if (onItemLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        touchStateRef.current.isLongPressing = true;
        const item = items.find(i => i.id === itemId);
        if (item) {
          onItemLongPress(item);
        }
      }, touchOptimization.gestures.longPressDelay);
    }
  }, [items, onItemLongPress, touchOptimization]);

  const handleTouchEnd = useCallback((e: React.TouchEvent, itemId: string) => {
    if (!touchStateRef.current.itemId) return;
    
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
    if (onItemPress && !touchStateRef.current.isLongPressing) {
      if (deltaX < 10 && deltaY < 10 && deltaTime < touchOptimization.gestures.tapTimeout) {
        const item = items.find(i => i.id === itemId);
        if (item) {
          if (multiSelect) {
            // Toggle selection in multi-select mode
            const newSelected = new Set(selectedItems);
            if (newSelected.has(itemId)) {
              newSelected.delete(itemId);
            } else {
              newSelected.add(itemId);
            }
            setSelectedItems(newSelected);
          } else {
            // Single selection mode
            setSelectedItems(new Set([itemId]));
            onItemPress(item);
          }
        }
      }
    }
    
    touchStateRef.current.isLongPressing = false;
    touchStateRef.current.itemId = null;
  }, [items, onItemPress, multiSelect, selectedItems, touchOptimization]);

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

  // Default key extractor
  const defaultKeyExtractor = useCallback((item: MobileListItem, index: number) => {
    return item.id || `item-${index}`;
  }, []);

  // Default render item
  const defaultRenderItem = useCallback((item: MobileListItem, index: number) => {
    const isSelected = selectedItems.has(item.id);
    const itemKey = keyExtractor ? keyExtractor(item, index) : defaultKeyExtractor(item, index);

    return (
      <div
        key={itemKey}
        data-testid={`list-item-${item.id}`}
        className={`bg-white rounded-lg border transition-all duration-200 ${
          isSelected
            ? 'border-blue-500 shadow-md'
            : 'border-gray-200 shadow-sm'
        } ${item.disabled ? 'opacity-50' : ''} ${
          (onItemPress || onItemLongPress) ? 'active:scale-95 cursor-pointer' : ''
        }`}
        style={{
          minHeight: MOBILE_SPACING.item.minHeight,
          padding: MOBILE_SPACING.item.padding,
          margin: MOBILE_SPACING.item.margin,
          borderRadius: MOBILE_SPACING.item.borderRadius,
        }}
        onTouchStart={(e) => handleTouchStart(e, item.id)}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => handleTouchEnd(e, item.id)}
        role={(onItemPress || onItemLongPress) ? 'button' : undefined}
        tabIndex={(onItemPress || onItemLongPress) ? 0 : undefined}
        aria-disabled={item.disabled}
        aria-busy={item.loading}
        aria-selected={isSelected}
      >
        {/* Loading State */}
        {item.loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Content */}
        <div className="flex items-center space-x-3">
          {/* Image */}
          {item.image && (
            <img
              src={item.image}
              alt={item.imageAlt || item.title}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              loading="lazy"
            />
          )}

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="text-base font-medium text-gray-900 truncate">
              {item.title}
            </h3>

            {/* Subtitle */}
            {item.subtitle && (
              <p className="text-sm text-gray-600 truncate mt-1">
                {item.subtitle}
              </p>
            )}

            {/* Description */}
            {item.description && (
              <p className="text-sm text-gray-500 truncate mt-1">
                {item.description}
              </p>
            )}
          </div>

          {/* Badge */}
          {item.badge && (
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                BADGE_COLORS[item.badgeColor || 'blue']
              }`}
            >
              {item.badge}
            </div>
          )}

          {/* Actions */}
          {item.actions && (
            <div className="flex-shrink-0">
              {item.actions}
            </div>
          )}

          {/* Selected Indicator */}
          {isSelected && (
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    );
  }, [selectedItems, handleTouchStart, handleTouchMove, handleTouchEnd, onItemPress, onItemLongPress, keyExtractor, defaultKeyExtractor]);

  // Empty state
  if (items.length === 0 && !loading) {
    return (
      <div
        data-testid={`${testId}-empty`}
        className="flex flex-col items-center justify-center text-center"
        style={{
          padding: MOBILE_SPACING.empty.padding,
          minHeight: MOBILE_SPACING.empty.minHeight,
        }}
      >
        <div className="text-4xl mb-4">{emptyIcon}</div>
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div
        data-testid={`${testId}-loading`}
        className="flex items-center justify-center"
        style={{
          padding: MOBILE_SPACING.empty.padding,
          minHeight: MOBILE_SPACING.empty.minHeight,
        }}
      >
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      data-testid={testId}
      className={`space-y-2 ${className}`}
      style={{
        padding: MOBILE_SPACING.list.padding,
        gap: MOBILE_SPACING.list.gap,
        ...style,
      }}
    >
      {items.map((item, index) => {
        if (renderItem) {
          return renderItem(item, index);
        }
        return defaultRenderItem(item, index);
      })}
    </div>
  );
};

export default MobileList;
