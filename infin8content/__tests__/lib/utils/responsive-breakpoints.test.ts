import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  BREAKPOINTS, 
  getViewportInfo, 
  getBreakpoint, 
  getWindowDimensions,
  mediaQueries,
  responsiveCSSVars 
} from '@/lib/utils/responsive-breakpoints'

// Mock window for SSR compatibility
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
}

describe('Responsive Breakpoints', () => {
  beforeEach(() => {
    vi.stubGlobal('window', mockWindow)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('BREAKPOINTS constants', () => {
    it('should have correct breakpoint values', () => {
      expect(BREAKPOINTS.MOBILE).toBe(640)
      expect(BREAKPOINTS.TABLET).toBe(1024)
      expect(BREAKPOINTS.DESKTOP).toBe(1024)
    })
  })

  describe('getWindowDimensions', () => {
    it('should return window dimensions when window is available', () => {
      const dimensions = getWindowDimensions()
      expect(dimensions).toEqual({
        width: 1024,
        height: 768,
      })
    })

    it('should return default dimensions for SSR', () => {
      vi.stubGlobal('window', undefined)
      
      const dimensions = getWindowDimensions()
      expect(dimensions).toEqual({
        width: 1024,
        height: 768,
      })
    })
  })

  describe('getBreakpoint', () => {
    it('should return MOBILE for width < 640', () => {
      expect(getBreakpoint(639)).toBe('MOBILE')
      expect(getBreakpoint(320)).toBe('MOBILE')
    })

    it('should return TABLET for width 640-1023', () => {
      expect(getBreakpoint(640)).toBe('TABLET')
      expect(getBreakpoint(768)).toBe('TABLET')
      expect(getBreakpoint(1023)).toBe('TABLET')
    })

    it('should return DESKTOP for width >= 1024', () => {
      expect(getBreakpoint(1024)).toBe('DESKTOP')
      expect(getBreakpoint(1920)).toBe('DESKTOP')
    })
  })

  describe('getViewportInfo', () => {
    it('should return complete viewport information', () => {
      const info = getViewportInfo()
      
      expect(info).toEqual({
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        breakpoint: 'DESKTOP',
      })
    })

    it('should correctly identify mobile viewport', () => {
      vi.stubGlobal('window', { innerWidth: 375, innerHeight: 667 })
      
      const info = getViewportInfo()
      
      expect(info.isMobile).toBe(true)
      expect(info.isTablet).toBe(false)
      expect(info.isDesktop).toBe(false)
      expect(info.breakpoint).toBe('MOBILE')
    })

    it('should correctly identify tablet viewport', () => {
      vi.stubGlobal('window', { innerWidth: 768, innerHeight: 1024 })
      
      const info = getViewportInfo()
      
      expect(info.isMobile).toBe(false)
      expect(info.isTablet).toBe(true)
      expect(info.isDesktop).toBe(false)
      expect(info.breakpoint).toBe('TABLET')
    })
  })

  describe('mediaQueries', () => {
    it('should generate correct media query strings', () => {
      expect(mediaQueries.mobile).toBe('(max-width: 639px)')
      expect(mediaQueries.tablet).toBe('(min-width: 640px) and (max-width: 1023px)')
      expect(mediaQueries.desktop).toBe('(min-width: 1024px)')
      expect(mediaQueries.notMobile).toBe('(min-width: 640px)')
      expect(mediaQueries.notDesktop).toBe('(max-width: 1023px)')
    })
  })

  describe('responsiveCSSVars', () => {
    it('should contain all required CSS variables', () => {
      expect(responsiveCSSVars['--sidebar-width-mobile']).toBe('18rem')
      expect(responsiveCSSVars['--sidebar-width-tablet']).toBe('16rem')
      expect(responsiveCSSVars['--sidebar-width-desktop']).toBe('16rem')
      expect(responsiveCSSVars['--header-height']).toBe('4rem')
      expect(responsiveCSSVars['--touch-target-min']).toBe('2.75rem')
    })
  })
})
