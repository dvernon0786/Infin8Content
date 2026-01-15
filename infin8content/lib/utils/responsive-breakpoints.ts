/**
 * Responsive Breakpoint Utilities
 * 
 * Provides standardized breakpoint definitions and utility functions
 * for responsive design across the Infin8Content application.
 * 
 * Breakpoint System:
 * - Mobile: < 640px (default) - Slide-out drawer
 * - Tablet: 640px - 1024px (md: breakpoint) - Collapsible sidebar  
 * - Desktop: 1024px+ (lg: breakpoint) - Persistent sidebar
 */

export const BREAKPOINTS = {
  MOBILE: 640,    // < 640px
  TABLET: 1024,   // 640px - 1024px
  DESKTOP: 1024,  // 1024px+
} as const

export type Breakpoint = 'MOBILE' | 'TABLET' | 'DESKTOP'

export interface ViewportInfo {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  breakpoint: Breakpoint
}

/**
 * Get current viewport information
 */
export function getViewportInfo(): ViewportInfo {
  const { width, height } = getWindowDimensions()
  
  return {
    width,
    height,
    isMobile: width < BREAKPOINTS.MOBILE,
    isTablet: width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.DESKTOP,
    isDesktop: width >= BREAKPOINTS.DESKTOP,
    breakpoint: getBreakpoint(width),
  }
}

/**
 * Get breakpoint from viewport width
 */
export function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINTS.MOBILE) return 'MOBILE'
  if (width < BREAKPOINTS.DESKTOP) return 'TABLET'
  return 'DESKTOP'
}

/**
 * Get window dimensions with fallback for SSR
 */
export function getWindowDimensions(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1024, height: 768 } // Default desktop dimensions for SSR
  }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

/**
 * Media query helpers for programmatic breakpoint detection
 */
export const mediaQueries = {
  mobile: `(max-width: ${BREAKPOINTS.MOBILE - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.MOBILE}px) and (max-width: ${BREAKPOINTS.DESKTOP - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.DESKTOP}px)`,
  notMobile: `(min-width: ${BREAKPOINTS.MOBILE}px)`,
  notDesktop: `(max-width: ${BREAKPOINTS.DESKTOP - 1}px)`,
} as const

/**
 * CSS custom properties for responsive design
 */
export const responsiveCSSVars = {
  '--sidebar-width-mobile': '18rem',  // 288px
  '--sidebar-width-tablet': '16rem',  // 256px  
  '--sidebar-width-desktop': '16rem', // 256px
  '--header-height': '4rem',          // 64px
  '--touch-target-min': '2.75rem',   // 44px
} as const
