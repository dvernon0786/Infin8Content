"use client"

import * as React from "react"
import { ResponsiveNavigationProvider, useResponsiveNavigation } from "@/hooks/use-responsive-navigation"
import { cn } from "@/lib/utils"
import { responsiveCSSVars } from "@/lib/utils/responsive-breakpoints"

interface ResponsiveLayoutProviderProps {
  children: React.ReactNode
  className?: string
}

/**
 * Wrapper component that provides responsive navigation context
 * and applies responsive layout classes based on current breakpoint
 */
function ResponsiveLayoutContent({ children, className }: ResponsiveLayoutProviderProps) {
  const { isMobile, isTablet, isDesktop } = useResponsiveNavigation()

  // Critical layout dimensions with inline style fallbacks to prevent CSS specificity conflicts
  const getLayoutStyles = () => {
    const baseStyles: React.CSSProperties = {
      // Ensure minimum height and full width with inline styles
      minHeight: '100vh',
      width: '100%',
      // Apply responsive sidebar width as CSS custom properties
      ...Object.fromEntries(
        Object.entries(responsiveCSSVars).map(([key, value]) => [key, value])
      ),
    }

    return baseStyles
  }

  return (
    <div
      className={cn(
        // Base layout
        "min-h-screen w-full",
        
        // Responsive layout adaptations
        isMobile && "layout-mobile",
        isTablet && "layout-tablet", 
        isDesktop && "layout-desktop",
        
        // Touch optimizations for mobile
        isMobile && "touch-optimized",
        
        className
      )}
      style={getLayoutStyles()}
      data-breakpoint={isMobile ? "mobile" : isTablet ? "tablet" : "desktop"}
    >
      {children}
    </div>
  )
}

/**
 * Main responsive layout provider that combines navigation context
 * with responsive layout adaptations
 */
export function ResponsiveLayoutProvider({ children, className }: ResponsiveLayoutProviderProps) {
  return (
    <ResponsiveNavigationProvider>
      <ResponsiveLayoutContent className={className}>
        {children}
      </ResponsiveLayoutContent>
    </ResponsiveNavigationProvider>
  )
}
