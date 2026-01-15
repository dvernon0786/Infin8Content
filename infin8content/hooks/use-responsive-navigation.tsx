"use client"

import * as React from "react"
import { getViewportInfo, type ViewportInfo, type Breakpoint } from "@/lib/utils/responsive-breakpoints"

export interface ResponsiveNavigationState {
  // Breakpoint information
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  breakpoint: Breakpoint
  viewport: ViewportInfo
  
  // Navigation state
  sidebarOpen: boolean
  sidebarOpenMobile: boolean
  
  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarOpenMobile: (open: boolean) => void
}

const ResponsiveNavigationContext = React.createContext<ResponsiveNavigationState | null>(null)

export function useResponsiveNavigation() {
  const context = React.useContext(ResponsiveNavigationContext)
  if (!context) {
    throw new Error("useResponsiveNavigation must be used within a ResponsiveNavigationProvider")
  }
  return context
}

interface ResponsiveNavigationProviderProps {
  children: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ResponsiveNavigationProvider({
  children,
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
}: ResponsiveNavigationProviderProps) {
  // Viewport state with debounced updates
  const [viewport, setViewport] = React.useState<ViewportInfo>(getViewportInfo())
  const [debouncedViewport, setDebouncedViewport] = React.useState<ViewportInfo>(viewport)
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = React.useState(defaultOpen)
  const [sidebarOpenMobile, setSidebarOpenMobile] = React.useState(false)
  
  // Sync controlled/uncontrolled state
  const open = openProp ?? sidebarOpen
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        setSidebarOpen(openState)
      }
    },
    [setOpenProp, open]
  )

  // Debounced viewport updates to prevent jank
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedViewport(viewport)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [viewport])

  // Viewport resize handler with performance optimization
  React.useEffect(() => {
    let rafId: number

    const handleResize = () => {
      // Cancel previous frame
      if (rafId) {
        cancelAnimationFrame(rafId)
      }

      // Schedule new frame
      rafId = requestAnimationFrame(() => {
        setViewport(getViewportInfo())
      })
    }

    window.addEventListener("resize", handleResize, { passive: true })
    window.addEventListener("orientationchange", handleResize, { passive: true })

    // Initial viewport info
    handleResize()

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleResize)
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [])

  // Auto-close mobile sidebar when switching to desktop/tablet
  React.useEffect(() => {
    if (!viewport.isMobile && sidebarOpenMobile) {
      setSidebarOpenMobile(false)
    }
  }, [viewport.isMobile, sidebarOpenMobile])

  // Toggle sidebar based on device type
  const toggleSidebar = React.useCallback(() => {
    if (viewport.isMobile) {
      setSidebarOpenMobile(open => !open)
    } else {
      setOpen(open => !open)
    }
  }, [viewport.isMobile, setOpen])

  // Keyboard shortcut for sidebar toggle (Ctrl/Cmd + B)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "b" &&
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  // Memoized context value
  const contextValue = React.useMemo<ResponsiveNavigationState>(
    () => ({
      // Breakpoint information
      isMobile: debouncedViewport.isMobile,
      isTablet: debouncedViewport.isTablet,
      isDesktop: debouncedViewport.isDesktop,
      breakpoint: debouncedViewport.breakpoint,
      viewport: debouncedViewport,
      
      // Navigation state
      sidebarOpen: open,
      sidebarOpenMobile,
      
      // Actions
      toggleSidebar,
      setSidebarOpen: setOpen,
      setSidebarOpenMobile,
    }),
    [
      debouncedViewport,
      open,
      sidebarOpenMobile,
      toggleSidebar,
      setOpen,
    ]
  )

  return (
    <ResponsiveNavigationContext.Provider value={contextValue}>
      {children}
    </ResponsiveNavigationContext.Provider>
  )
}
