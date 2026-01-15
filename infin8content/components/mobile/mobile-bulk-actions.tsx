"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useMobileLayout } from '@/hooks/use-mobile-layout';

// Types
export interface BulkActionItem {
  id: string;
  title: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
  metadata?: Record<string, any>;
}

export interface BulkAction {
  id: string;
  label: string;
  icon: string;
  onPress: (selectedItems: BulkActionItem[]) => void;
  disabled?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

interface MobileBulkActionsProps {
  items: BulkActionItem[];
  actions: BulkAction[];
  onSelectionChange?: (selectedItems: BulkActionItem[]) => void;
  maxSelections?: number;
  showSelectAll?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Mobile-specific constants
const MOBILE_TOUCH_TARGET_SIZE = 44; // iOS HIG minimum
const MOBILE_SPACING = {
  item: {
    padding: 16,
    margin: 8,
    minHeight: 72,
  },
  actionBar: {
    height: 64,
    padding: 12,
  },
  checkbox: {
    size: 24,
    margin: 12,
  },
};

// Touch gesture thresholds
const GESTURE_THRESHOLDS = {
  swipeMinDistance: 30,
  swipeMaxTime: 300,
  longPressMinTime: 500,
  tapMaxTime: 200,
};

export const MobileBulkActions: React.FC<MobileBulkActionsProps> = ({
  items,
  actions,
  onSelectionChange,
  maxSelections,
  showSelectAll = true,
  className = '',
  style = {},
}) => {
  const { isMobile } = useMobileLayout();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [touchState, setTouchState] = useState<{
    isLongPressing: boolean;
    startX: number;
    startY: number;
    startTime: number;
    itemId: string | null;
  }>({
    isLongPressing: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    itemId: null,
  });
  const [confirmingAction, setConfirmingAction] = useState<string | null>(null);
  
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update selected items when items prop changes
  useEffect(() => {
    const newSelected = new Set<string>();
    items.forEach(item => {
      if (item.selected) {
        newSelected.add(item.id);
      }
    });
    setSelectedItems(newSelected);
  }, [items]);

  // Handle selection changes
  const updateSelection = useCallback((newSelected: Set<string>) => {
    setSelectedItems(newSelected);
    const selected = items.filter(item => newSelected.has(item.id));
    onSelectionChange?.(selected);
  }, [items, onSelectionChange]);

  // Toggle item selection
  const toggleItemSelection = useCallback((itemId: string) => {
    const newSelected = new Set(selectedItems);
    
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      if (maxSelections && newSelected.size >= maxSelections) {
        return; // Max selections reached
      }
      newSelected.add(itemId);
    }
    
    updateSelection(newSelected);
  }, [selectedItems, maxSelections, updateSelection]);

  // Toggle selection mode
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      updateSelection(new Set()); // Clear selections when exiting
    }
  }, [isSelectionMode, updateSelection]);

  // Select all items
  const selectAll = useCallback(() => {
    const newSelected = new Set(
      items
        .filter(item => !item.disabled)
        .map(item => item.id)
        .slice(0, maxSelections || Infinity)
    );
    updateSelection(newSelected);
  }, [items, maxSelections, updateSelection]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    updateSelection(new Set());
  }, [updateSelection]);

  // Touch gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent, itemId: string) => {
    const touch = e.touches[0];
    if (!touch) return;
    
    setTouchState({
      isLongPressing: false,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      itemId,
    });

    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      setTouchState(prev => ({ ...prev, isLongPressing: true }));
      if (!isSelectionMode) {
        setIsSelectionMode(true);
        toggleItemSelection(itemId);
      }
    }, GESTURE_THRESHOLDS.longPressMinTime);
  }, [isSelectionMode, toggleItemSelection]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.itemId) return;
    
    const touch = e.touches[0];
    if (!touch) return;
    
    const deltaX = Math.abs(touch.clientX - touchState.startX);
    const deltaY = Math.abs(touch.clientY - touchState.startY);
    
    // Cancel long press if moved too much
    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setTouchState(prev => ({ ...prev, isLongPressing: false }));
    }
  }, [touchState]);

  const handleTouchEnd = useCallback((e: React.TouchEvent, itemId: string) => {
    if (!touchState.itemId) return;
    
    const touch = e.changedTouches[0];
    if (!touch) return;
    
    const deltaX = Math.abs(touch.clientX - touchState.startX);
    const deltaY = Math.abs(touch.clientY - touchState.startY);
    const deltaTime = Date.now() - touchState.startTime;
    
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Handle swipe gesture for selection
    if (deltaX > GESTURE_THRESHOLDS.swipeMinDistance && 
        deltaTime < GESTURE_THRESHOLDS.swipeMaxTime &&
        deltaY < 50) {
      // Swipe detected - toggle selection
      if (!isSelectionMode) {
        setIsSelectionMode(true);
      }
      toggleItemSelection(itemId);
    }
    // Handle tap for selection in selection mode
    else if (deltaX < 10 && deltaY < 10 && deltaTime < GESTURE_THRESHOLDS.tapMaxTime) {
      if (isSelectionMode) {
        toggleItemSelection(itemId);
      }
    }
    
    setTouchState({
      isLongPressing: false,
      startX: 0,
      startY: 0,
      startTime: 0,
      itemId: null,
    });
  }, [touchState, isSelectionMode, toggleItemSelection]);

  // Handle action execution
  const handleActionPress = useCallback(async (action: BulkAction) => {
    const selected = items.filter(item => selectedItems.has(item.id));
    
    if (action.requiresConfirmation && !confirmingAction) {
      setConfirmingAction(action.id);
      return;
    }
    
    if (confirmingAction === action.id) {
      // Execute action
      await action.onPress(selected);
      setConfirmingAction(null);
    } else {
      // Execute action directly
      await action.onPress(selected);
    }
  }, [selectedItems, items, confirmingAction]);

  // Render checkbox
  const renderCheckbox = useCallback((itemId: string, isSelected: boolean, disabled: boolean) => (
    <div
      data-testid={`bulk-checkbox-${itemId}`}
      className={`flex items-center justify-center rounded border-2 transition-all duration-200 ${
        isSelected
          ? 'bg-blue-500 border-blue-500'
          : 'bg-white border-gray-300'
      } ${disabled ? 'opacity-50' : ''}`}
      style={{
        width: MOBILE_SPACING.checkbox.size,
        height: MOBILE_SPACING.checkbox.size,
        minWidth: MOBILE_SPACING.checkbox.size,
        minHeight: MOBILE_SPACING.checkbox.size,
      }}
    >
      {isSelected && (
        <svg
          className="w-4 h-4 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  ), []);

  // Render action bar
  const renderActionBar = useCallback(() => {
    const selected = items.filter(item => selectedItems.has(item.id));
    const hasSelection = selected.length > 0;
    
    return (
      <div
        data-testid="bulk-action-bar"
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg"
        style={{
          height: MOBILE_SPACING.actionBar.height,
          padding: MOBILE_SPACING.actionBar.padding,
          zIndex: 50,
        }}
      >
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">
              {selected.length} selected
            </span>
            {maxSelections && (
              <span className="text-xs text-gray-500">
                (max {maxSelections})
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {actions.map(action => {
              const isDisabled = action.disabled || !hasSelection;
              const isConfirming = confirmingAction === action.id;
              
              return (
                <button
                  key={action.id}
                  data-testid={`bulk-action-${action.id}`}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDisabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isConfirming
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                  }`}
                  style={{
                    minHeight: MOBILE_TOUCH_TARGET_SIZE,
                    minWidth: MOBILE_TOUCH_TARGET_SIZE,
                  }}
                  disabled={isDisabled}
                  onClick={() => handleActionPress(action)}
                >
                  <span className="text-base">{action.icon}</span>
                  <span>{isConfirming ? 'Confirm?' : action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }, [selectedItems, items, actions, maxSelections, confirmingAction, handleActionPress]);

  // Render item
  const renderItem = useCallback((item: BulkActionItem) => {
    const isSelected = selectedItems.has(item.id);
    const showCheckbox = isSelectionMode || touchState.isLongPressing;
    
    return (
      <div
        key={item.id}
        data-testid={`bulk-item-${item.id}`}
        className={`relative bg-white rounded-lg border border-gray-200 transition-all duration-200 ${
          isSelected ? 'border-blue-500 shadow-md' : 'shadow-sm'
        } ${touchState.itemId === item.id && touchState.isLongPressing ? 'scale-95' : ''}`}
        style={{
          padding: MOBILE_SPACING.item.padding,
          margin: MOBILE_SPACING.item.margin,
          minHeight: MOBILE_SPACING.item.minHeight,
        }}
        onTouchStart={(e) => handleTouchStart(e, item.id)}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => handleTouchEnd(e, item.id)}
        onClick={() => {
          if (!isSelectionMode) {
            setIsSelectionMode(true);
          }
          toggleItemSelection(item.id);
        }}
      >
        <div className="flex items-center space-x-3">
          {/* Checkbox */}
          {showCheckbox && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                toggleItemSelection(item.id);
              }}
              style={{ margin: MOBILE_SPACING.checkbox.margin }}
            >
              {renderCheckbox(item.id, isSelected, item.disabled || false)}
            </div>
          )}
          
          {/* Item content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-gray-900 truncate">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-sm text-gray-500 truncate mt-1">
                {item.description}
              </p>
            )}
          </div>
          
          {/* Selection indicator */}
          {isSelected && !showCheckbox && (
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
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
      </div>
    );
  }, [selectedItems, isSelectionMode, touchState, handleTouchStart, handleTouchMove, handleTouchEnd, toggleItemSelection, renderCheckbox]);

  return (
    <div
      ref={containerRef}
      data-testid="mobile-bulk-actions"
      className={`relative ${className}`}
      style={{
        paddingBottom: isSelectionMode ? MOBILE_SPACING.actionBar.height : 0,
        ...style,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Bulk Actions
        </h2>
        
        {showSelectAll && (
          <div className="flex items-center space-x-2">
            <button
              data-testid="bulk-select-all"
              className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              onClick={selectAll}
              disabled={items.length === 0}
            >
              Select All
            </button>
            <button
              data-testid="bulk-clear-selection"
              className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-700"
              onClick={clearSelection}
              disabled={selectedItems.size === 0}
            >
              Clear
            </button>
          </div>
        )}
      </div>
      
      {/* Instructions */}
      {!isSelectionMode && (
        <div
          data-testid="bulk-instructions"
          className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4"
        >
          <p className="text-sm text-blue-800">
            Long press or swipe to start selecting items
          </p>
        </div>
      )}
      
      {/* Items list */}
      <div className="space-y-2">
        {items.map(renderItem)}
      </div>
      
      {/* Action bar */}
      {isSelectionMode && renderActionBar()}
      
      {/* Empty state */}
      {items.length === 0 && (
        <div
          data-testid="bulk-empty-state"
          className="text-center py-8"
        >
          <p className="text-gray-500">No items available</p>
        </div>
      )}
    </div>
  );
};

export default MobileBulkActions;
