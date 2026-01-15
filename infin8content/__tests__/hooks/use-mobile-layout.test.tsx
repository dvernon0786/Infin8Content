import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMobileLayout } from '@/hooks/use-mobile-layout';

// Mock the mobile layout utilities
vi.mock('@/lib/utils/mobile-layout-utils', () => ({
  getMobileLayoutConfig: vi.fn(() => ({
    spacing: {
      container: { padding: '16px', maxWidth: '100%' },
      card: { padding: '16px', marginBottom: '16px', minHeight: '80px' },
      button: { minHeight: '44px', padding: '12px 24px', margin: '8px' },
      list: { itemHeight: '64px', itemPadding: '16px', itemMargin: '8px' },
    },
    typography: {
      heading: { fontSize: '20px', fontWeight: '600', lineHeight: '1.4', marginBottom: '16px' },
      body: { fontSize: '16px', fontWeight: '400', lineHeight: '1.5', marginBottom: '12px' },
      caption: { fontSize: '14px', fontWeight: '400', lineHeight: '1.4', marginBottom: '8px' },
    },
    breakpoints: { mobile: 640, tablet: 1024 },
    container: { maxWidth: '100%', padding: '16px' },
  })),
  getTouchOptimizationConfig: vi.fn(() => ({
    minTouchTarget: { size: '44px', spacing: '8px' },
    spacing: { small: '8px', medium: '16px', large: '24px' },
    gestures: { swipeThreshold: 50, longPressDelay: 500, tapTimeout: 300 },
  })),
  isMobileViewport: vi.fn(() => false),
  getDeviceType: vi.fn(() => 'desktop'),
  isTouchDevice: vi.fn(() => false),
  debounce: vi.fn((fn) => fn),
  throttle: vi.fn((fn) => fn),
  MOBILE_BREAKPOINT: 640,
  TABLET_BREAKPOINT: 1024,
}));

describe('useMobileLayout Hook', () => {
  let mockGetMobileLayoutConfig: any;
  let mockGetTouchOptimizationConfig: any;
  let mockIsMobileViewport: any;
  let mockGetDeviceType: any;
  let mockIsTouchDevice: any;
  let mockDebounce: any;
  let mockThrottle: any;

  beforeEach(async () => {
    // Import mocked utilities after the mock is set up
    const mockedUtils = await import('@/lib/utils/mobile-layout-utils');
    mockGetMobileLayoutConfig = vi.mocked(mockedUtils.getMobileLayoutConfig);
    mockGetTouchOptimizationConfig = vi.mocked(mockedUtils.getTouchOptimizationConfig);
    mockIsMobileViewport = vi.mocked(mockedUtils.isMobileViewport);
    mockGetDeviceType = vi.mocked(mockedUtils.getDeviceType);
    mockIsTouchDevice = vi.mocked(mockedUtils.isTouchDevice);
    mockDebounce = vi.mocked(mockedUtils.debounce);
    mockThrottle = vi.mocked(mockedUtils.throttle);
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset mock return values to defaults
    mockGetDeviceType.mockReturnValue('desktop');
    mockIsMobileViewport.mockReturnValue(false);
    mockIsTouchDevice.mockReturnValue(false);
    
    vi.stubGlobal('window', {
      innerWidth: 1024,
      innerHeight: 768,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Initial State', () => {
    it('should return initial mobile layout state', () => {
      const { result } = renderHook(() => useMobileLayout());
      
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isTouchDevice).toBe(false);
      expect(result.current.deviceType).toBe('desktop');
      expect(result.current.containerWidth).toBe(1024);
      expect(result.current.breakpoint).toBe('desktop');
    });

    it('should provide mobile layout configuration', () => {
      const { result } = renderHook(() => useMobileLayout());
      
      expect(result.current.spacing).toBeDefined();
      expect(result.current.typography).toBeDefined();
      expect(result.current.touchOptimization).toBeDefined();
      expect(result.current.breakpoints).toBeDefined();
    });
  });

  describe('Mobile Viewport Detection', () => {
    it('should detect mobile viewport correctly', () => {
      mockGetDeviceType.mockReturnValue('mobile');
      mockIsMobileViewport.mockReturnValue(true);
      
      vi.stubGlobal('window', {
        innerWidth: 375,
        innerHeight: 667,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      
      const { result } = renderHook(() => useMobileLayout());
      
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.deviceType).toBe('mobile');
      expect(result.current.breakpoint).toBe('mobile');
    });

    it('should detect tablet viewport correctly', () => {
      mockGetDeviceType.mockReturnValue('tablet');
      mockIsMobileViewport.mockReturnValue(false);
      
      vi.stubGlobal('window', {
        innerWidth: 768,
        innerHeight: 1024,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      
      const { result } = renderHook(() => useMobileLayout());
      
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.deviceType).toBe('tablet');
      expect(result.current.breakpoint).toBe('tablet');
    });
  });

  describe('Touch Device Detection', () => {
    it('should detect touch devices correctly', () => {
      mockIsTouchDevice.mockReturnValue(true);
      
      vi.stubGlobal('window', {
        innerWidth: 1024,
        innerHeight: 768,
        ontouchstart: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      
      const { result } = renderHook(() => useMobileLayout());
      
      expect(result.current.isTouchDevice).toBe(true);
    });
  });

  describe('Performance Optimizations', () => {
    it('should debounce resize events', async () => {
      renderHook(() => useMobileLayout());
      
      expect(mockDebounce).toHaveBeenCalled();
    });

    it('should throttle scroll events', async () => {
      renderHook(() => useMobileLayout());
      
      expect(mockThrottle).toHaveBeenCalled();
    });
  });

  describe('Touch Optimization State', () => {
    it('should provide touch optimization configuration', () => {
      const { result } = renderHook(() => useMobileLayout());
      
      expect(result.current.touchOptimization).toBeDefined();
      expect(result.current.touchOptimization.minTouchTarget).toBeDefined();
      expect(result.current.touchOptimization.spacing).toBeDefined();
      expect(result.current.touchOptimization.gestures).toBeDefined();
    });

    it('should enable touch optimizations on touch devices', () => {
      mockIsTouchDevice.mockReturnValue(true);
      mockGetDeviceType.mockReturnValue('mobile');
      
      vi.stubGlobal('window', {
        innerWidth: 375,
        innerHeight: 667,
        ontouchstart: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      
      const { result } = renderHook(() => useMobileLayout());
      
      expect(result.current.touchOptimized).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const mockRemoveEventListener = vi.fn();
      vi.stubGlobal('window', {
        innerWidth: 1024,
        innerHeight: 768,
        addEventListener: vi.fn(),
        removeEventListener: mockRemoveEventListener,
      });
      
      const { unmount } = renderHook(() => useMobileLayout());
      
      unmount();
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    });
  });
});
