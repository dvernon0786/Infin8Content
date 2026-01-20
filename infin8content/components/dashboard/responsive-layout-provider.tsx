"use client"

import * as React from "react"
import { ResponsiveNavigationProvider, useResponsiveNavigation } from "@/hooks/use-responsive-navigation"
import { cn } from "@/lib/utils"

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

  return (
    <div
      className={cn("min-h-screen w-full", className)}
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
