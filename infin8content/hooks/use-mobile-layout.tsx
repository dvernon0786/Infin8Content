/**
 * Mobile Layout Hook
 * 
 * Provides reactive mobile layout state management with viewport detection,
 * touch optimization, and performance optimizations for mobile devices.
 */

"use client"

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getMobileLayoutConfig,
  getTouchOptimizationConfig,
  isMobileViewport,
  getDeviceType,
  isTouchDevice,
  debounce,
  throttle,
  MOBILE_BREAKPOINT,
  TABLET_BREAKPOINT,
} from '@/lib/utils/mobile-layout-utils';

export interface MobileLayoutState {
  // Device detection
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  
  // Viewport information
  containerWidth: number;
  containerHeight: number;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
  
  // Layout configurations
  spacing: ReturnType<typeof getMobileLayoutConfig>['spacing'];
  typography: ReturnType<typeof getMobileLayoutConfig>['typography'];
  touchOptimization: ReturnType<typeof getTouchOptimizationConfig>;
  breakpoints: ReturnType<typeof getMobileLayoutConfig>['breakpoints'];
  
  // Performance and optimization flags
  touchOptimized: boolean;
  performanceOptimized: boolean;
  
  // Event handlers
  updateLayout: () => void;
  forceMobileLayout: () => void;
  resetLayout: () => void;
}

/**
 * Hook for managing mobile layout state and optimizations
 */
export function useMobileLayout(): MobileLayoutState {
  // Viewport state
  const [containerWidth, setContainerWidth] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [containerHeight, setContainerHeight] = useState(() => 
    typeof window !== 'undefined' ? window.innerHeight : 768
  );
  
  // Device detection state
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>(() => 
    getDeviceType()
  );
  const [isTouchDeviceState, setIsTouchDeviceState] = useState(() => 
    isTouchDevice()
  );
  
  // Performance optimization flags
  const [touchOptimized, setTouchOptimized] = useState(false);
  const [performanceOptimized, setPerformanceOptimized] = useState(false);
  
  // Memoized device detection
  const isMobile = useMemo(() => deviceType === 'mobile', [deviceType]);
  const isTablet = useMemo(() => deviceType === 'tablet', [deviceType]);
  const isDesktop = useMemo(() => deviceType === 'desktop', [deviceType]);
  
  const breakpoint = useMemo(() => {
    if (containerWidth < MOBILE_BREAKPOINT) return 'mobile';
    if (containerWidth < TABLET_BREAKPOINT) return 'tablet';
    return 'desktop';
  }, [containerWidth]);
  
  // Memoized layout configurations
  const layoutConfig = useMemo(() => getMobileLayoutConfig(), []);
  const touchConfig = useMemo(() => getTouchOptimizationConfig(), []);
  
  // Update layout state
  const updateLayout = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    const newDeviceType = getDeviceType();
    const newIsTouchDevice = isTouchDevice();
    
    setContainerWidth(newWidth);
    setContainerHeight(newHeight);
    setDeviceType(newDeviceType);
    setIsTouchDeviceState(newIsTouchDevice);
    
    // Update optimization flags
    setTouchOptimized(newIsTouchDevice && newDeviceType === 'mobile');
    setPerformanceOptimized(newDeviceType === 'mobile');
  }, []);
  
  // Debounced update handler for resize events
  const debouncedUpdateLayout = useMemo(() => 
    debounce(updateLayout, 100), [updateLayout]
  );
  
  // Throttled update handler for scroll events
  const throttledUpdateLayout = useMemo(() => 
    throttle(updateLayout, 50), [updateLayout]
  );
  
  // Force mobile layout (for testing or specific scenarios)
  const forceMobileLayout = useCallback(() => {
    setDeviceType('mobile');
    setTouchOptimized(true);
    setPerformanceOptimized(true);
  }, []);
  
  // Reset layout to detected state
  const resetLayout = useCallback(() => {
    updateLayout();
  }, [updateLayout]);
  
  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Initial update
    updateLayout();
    
    // Add event listeners
    window.addEventListener('resize', debouncedUpdateLayout);
    window.addEventListener('orientationchange', debouncedUpdateLayout);
    window.addEventListener('scroll', throttledUpdateLayout, { passive: true });
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', debouncedUpdateLayout);
      window.removeEventListener('orientationchange', debouncedUpdateLayout);
      window.removeEventListener('scroll', throttledUpdateLayout);
    };
  }, [debouncedUpdateLayout, throttledUpdateLayout, updateLayout]);
  
  // Performance optimization: reduce update frequency on mobile
  useEffect(() => {
    if (performanceOptimized && isMobile) {
      // Reduce frequency of expensive operations on mobile
      const reducedUpdateLayout = debounce(updateLayout, 200);
      
      window.addEventListener('resize', reducedUpdateLayout);
      
      return () => {
        window.removeEventListener('resize', reducedUpdateLayout);
      };
    }
  }, [performanceOptimized, isMobile, updateLayout]);
  
  return {
    // Device detection
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice: isTouchDeviceState,
    deviceType,
    
    // Viewport information
    containerWidth,
    containerHeight,
    breakpoint,
    
    // Layout configurations
    spacing: layoutConfig.spacing,
    typography: layoutConfig.typography,
    touchOptimization: touchConfig,
    breakpoints: layoutConfig.breakpoints,
    
    // Performance and optimization flags
    touchOptimized,
    performanceOptimized,
    
    // Event handlers
    updateLayout,
    forceMobileLayout,
    resetLayout,
  };
}

/**
 * Hook for mobile-specific layout adaptations
 * Provides simplified interface for mobile-first components
 */
export function useMobileAdaptations() {
  const mobileLayout = useMobileLayout();
  
  return {
    // Simplified mobile detection
    isMobile: mobileLayout.isMobile,
    isTouchOptimized: mobileLayout.touchOptimized,
    
    // Mobile-specific spacing
    mobileSpacing: mobileLayout.spacing,
    mobileTypography: mobileLayout.typography,
    
    // Touch optimization
    touchConfig: mobileLayout.touchOptimization,
    
    // Responsive utilities
    shouldUseMobileLayout: mobileLayout.isMobile || mobileLayout.isTablet,
    shouldUseTouchOptimization: mobileLayout.touchOptimized,
  };
}

/**
 * Hook for mobile performance optimizations
 * Provides performance monitoring and optimization strategies
 */
export function useMobilePerformance() {
  const mobileLayout = useMobileLayout();
  
  // Performance metrics
  const [renderTime, setRenderTime] = useState(0);
  const [isLowPerformanceDevice, setIsLowPerformanceDevice] = useState(false);
  
  // Detect low performance devices
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Simple performance detection based on hardware concurrency
    const isLowPerformance = 
      navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4 ||
      mobileLayout.isMobile && mobileLayout.containerWidth <= 375;
    
    setIsLowPerformanceDevice(isLowPerformance);
  }, [mobileLayout.isMobile, mobileLayout.containerWidth]);
  
  // Performance optimization strategies
  const optimizationStrategies = useMemo(() => ({
    reduceAnimations: isLowPerformanceDevice,
    debounceEvents: mobileLayout.isMobile,
    throttleScroll: mobileLayout.isMobile,
    lazyLoadComponents: mobileLayout.isMobile,
    reduceReRenders: isLowPerformanceDevice,
  }), [isLowPerformanceDevice, mobileLayout.isMobile]);
  
  return {
    renderTime,
    isLowPerformanceDevice,
    optimizationStrategies,
    shouldOptimize: mobileLayout.isMobile || isLowPerformanceDevice,
  };
}
