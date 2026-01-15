/**
 * Mobile Layout Utilities
 * 
 * Provides mobile-specific layout configurations, spacing, typography,
 * and touch optimization utilities for responsive design.
 */

// Mobile breakpoint configuration
export const MOBILE_BREAKPOINT = 640;
export const TABLET_BREAKPOINT = 1024;

// Mobile spacing configuration
export interface MobileSpacingConfig {
  container: {
    padding: string;
    maxWidth: string;
  };
  card: {
    padding: string;
    marginBottom: string;
    minHeight: string;
  };
  button: {
    minHeight: string;
    padding: string;
    margin: string;
  };
  list: {
    itemHeight: string;
    itemPadding: string;
    itemMargin: string;
  };
}

// Mobile typography configuration
export interface MobileTypographyConfig {
  heading: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    marginBottom: string;
  };
  body: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    marginBottom: string;
  };
  caption: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    marginBottom: string;
  };
}

// Touch optimization configuration
export interface TouchOptimizationConfig {
  minTouchTarget: {
    size: string;
    spacing: string;
  };
  spacing: {
    small: string;
    medium: string;
    large: string;
  };
  gestures: {
    swipeThreshold: number;
    longPressDelay: number;
    tapTimeout: number;
  };
}

// Complete mobile layout configuration
export interface MobileLayoutConfig {
  spacing: MobileSpacingConfig;
  typography: MobileTypographyConfig;
  breakpoints: {
    mobile: number;
    tablet: number;
  };
  container: {
    maxWidth: string;
    padding: string;
  };
}

/**
 * Get mobile-specific spacing configuration
 */
export function getMobileSpacingConfig(): MobileSpacingConfig {
  return {
    container: {
      padding: '16px',
      maxWidth: '100%',
    },
    card: {
      padding: '16px',
      marginBottom: '16px',
      minHeight: '80px',
    },
    button: {
      minHeight: '44px',
      padding: '12px 24px',
      margin: '8px',
    },
    list: {
      itemHeight: '64px',
      itemPadding: '16px',
      itemMargin: '8px',
    },
  };
}

/**
 * Get mobile-optimized typography configuration
 */
export function getMobileTypographyConfig(): MobileTypographyConfig {
  return {
    heading: {
      fontSize: '20px',
      fontWeight: '600',
      lineHeight: '1.4',
      marginBottom: '16px',
    },
    body: {
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '1.5',
      marginBottom: '12px',
    },
    caption: {
      fontSize: '14px',
      fontWeight: '400',
      lineHeight: '1.4',
      marginBottom: '8px',
    },
  };
}

/**
 * Check if current viewport is mobile-sized
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

/**
 * Get complete mobile layout configuration
 */
export function getMobileLayoutConfig(): MobileLayoutConfig {
  return {
    spacing: getMobileSpacingConfig(),
    typography: getMobileTypographyConfig(),
    breakpoints: {
      mobile: MOBILE_BREAKPOINT,
      tablet: TABLET_BREAKPOINT,
    },
    container: {
      maxWidth: '100%',
      padding: '16px',
    },
  };
}

/**
 * Get touch optimization configuration
 */
export function getTouchOptimizationConfig(): TouchOptimizationConfig {
  return {
    minTouchTarget: {
      size: '44px',
      spacing: '8px',
    },
    spacing: {
      small: '8px',
      medium: '16px',
      large: '24px',
    },
    gestures: {
      swipeThreshold: 50,
      longPressDelay: 500,
      tapTimeout: 300,
    },
  };
}

/**
 * Debounce function calls for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * Throttle function calls for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Get mobile-safe CSS string for inline styles
 * Helps prevent CSS specificity conflicts
 */
export function getMobileSafeStyles(config: Partial<MobileLayoutConfig>): string {
  const styles: string[] = [];
  
  if (config.spacing) {
    if (config.spacing.container) {
      styles.push(`padding: ${config.spacing.container.padding}`);
      styles.push(`max-width: ${config.spacing.container.maxWidth}`);
    }
  }
  
  if (config.container) {
    styles.push(`max-width: ${config.container.maxWidth}`);
    styles.push(`padding: ${config.container.padding}`);
  }
  
  return styles.join('; ');
}

/**
 * Check if device supports touch events
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - for older browsers
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get device type based on viewport and touch capabilities
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width < MOBILE_BREAKPOINT) {
    return 'mobile';
  } else if (width < TABLET_BREAKPOINT) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

/**
 * Mobile-specific media query helper
 */
export const mobileMediaQueries = {
  mobile: `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
  tablet: `(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`,
  desktop: `(min-width: ${TABLET_BREAKPOINT}px)`,
  notMobile: `(min-width: ${MOBILE_BREAKPOINT}px)`,
  touch: `(hover: none) and (pointer: coarse)`,
};
