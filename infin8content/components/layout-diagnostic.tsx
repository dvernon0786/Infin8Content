'use client'

import { useEffect } from 'react'

export function LayoutDiagnostic() {
  useEffect(() => {
    // Log all major layout elements and their dimensions
    const diagnostics: Record<string, any> = {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      body: {
        width: document.body.offsetWidth,
        height: document.body.offsetHeight,
        scrollWidth: document.body.scrollWidth,
        clientWidth: document.body.clientWidth
      },
      documentElement: {
        width: document.documentElement.offsetWidth,
        height: document.documentElement.offsetHeight,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }
    }

    // Find key layout elements
    const sidebarProvider = document.querySelector('[data-slot="sidebar-wrapper"]')
    const sidebar = document.querySelector('[data-slot="sidebar"]')
    const sidebarGap = document.querySelector('[data-slot="sidebar-gap"]')
    const sidebarContainer = document.querySelector('[data-slot="sidebar-container"]')
    const main = document.querySelector('main')

    if (sidebarProvider) {
      diagnostics['sidebarProvider'] = {
        width: sidebarProvider.clientWidth,
        height: sidebarProvider.clientHeight,
        offsetLeft: (sidebarProvider as HTMLElement).offsetLeft,
        classList: Array.from(sidebarProvider.classList)
      }
    }

    if (sidebar) {
      diagnostics['sidebar'] = {
        width: sidebar.clientWidth,
        height: sidebar.clientHeight,
        offsetLeft: (sidebar as HTMLElement).offsetLeft,
        classList: Array.from(sidebar.classList)
      }
    }

    if (sidebarGap) {
      diagnostics['sidebarGap'] = {
        width: sidebarGap.clientWidth,
        height: sidebarGap.clientHeight,
        classList: Array.from(sidebarGap.classList)
      }
    }

    if (sidebarContainer) {
      diagnostics['sidebarContainer'] = {
        width: sidebarContainer.clientWidth,
        height: sidebarContainer.clientHeight,
        offsetLeft: (sidebarContainer as HTMLElement).offsetLeft,
        classList: Array.from(sidebarContainer.classList)
      }
    }

    if (main) {
      diagnostics['main'] = {
        width: main.clientWidth,
        height: main.clientHeight,
        offsetLeft: (main as HTMLElement).offsetLeft,
        offsetTop: (main as HTMLElement).offsetTop,
        classList: Array.from(main.classList),
        computedStyle: {
          marginLeft: window.getComputedStyle(main).marginLeft,
          marginRight: window.getComputedStyle(main).marginRight,
          paddingLeft: window.getComputedStyle(main).paddingLeft,
          paddingRight: window.getComputedStyle(main).paddingRight,
          width: window.getComputedStyle(main).width
        }
      }
    }

    console.log('[LayoutDiagnostic] Complete layout analysis:', diagnostics)
  }, [])

  return null
}
