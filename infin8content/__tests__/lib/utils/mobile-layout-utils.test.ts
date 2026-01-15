import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import the utilities we're going to create
import {
  getMobileSpacingConfig,
  getMobileTypographyConfig,
  isMobileViewport,
  getMobileLayoutConfig,
  getTouchOptimizationConfig,
  debounce,
  throttle
} from '@/lib/utils/mobile-layout-utils';

describe('Mobile Layout Utils', () => {
  beforeEach(() => {
    // Reset window.innerWidth before each test
    vi.stubGlobal('window', {
      innerWidth: 1024,
      innerHeight: 768,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getMobileSpacingConfig', () => {
    it('should return mobile-specific spacing configuration', () => {
      const spacing = getMobileSpacingConfig();
      
      expect(spacing).toHaveProperty('container');
      expect(spacing).toHaveProperty('card');
      expect(spacing).toHaveProperty('button');
      expect(spacing).toHaveProperty('list');
      
      // Verify mobile-specific values
      expect(spacing.container.padding).toBe('16px');
      expect(spacing.button.minHeight).toBe('44px');
      expect(spacing.list.itemHeight).toBe('64px');
    });

    it('should have consistent spacing units', () => {
      const spacing = getMobileSpacingConfig();
      
      // All spacing values should be in pixels or percentages (including shorthand)
      const values = Object.values(spacing).flatMap((obj: any) => Object.values(obj));
      values.forEach(value => {
        if (typeof value === 'string') {
          expect(value).toMatch(/^(\d+(px|%)(\s|$))+$/);
        }
      });
    });
  });

  describe('getMobileTypographyConfig', () => {
    it('should return mobile-optimized typography configuration', () => {
      const typography = getMobileTypographyConfig();
      
      expect(typography).toHaveProperty('heading');
      expect(typography).toHaveProperty('body');
      expect(typography).toHaveProperty('caption');
      
      // Verify mobile-specific font sizes
      expect(typography.heading.fontSize).toBe('20px');
      expect(typography.body.fontSize).toBe('16px');
      expect(typography.caption.fontSize).toBe('14px');
    });

    it('should have appropriate line heights for mobile reading', () => {
      const typography = getMobileTypographyConfig();
      
      // Line heights should be optimized for mobile readability
      expect(parseFloat(typography.body.lineHeight)).toBeGreaterThan(1.4);
      expect(parseFloat(typography.heading.lineHeight)).toBeGreaterThan(1.2);
    });
  });

  describe('isMobileViewport', () => {
    it('should return true for mobile viewport widths', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      expect(isMobileViewport()).toBe(true);
      
      Object.defineProperty(window, 'innerWidth', { value: 639 });
      expect(isMobileViewport()).toBe(true);
    });

    it('should return false for tablet and desktop viewport widths', () => {
      Object.defineProperty(window, 'innerWidth', { value: 640 });
      expect(isMobileViewport()).toBe(false);
      
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      expect(isMobileViewport()).toBe(false);
      
      Object.defineProperty(window, 'innerWidth', { value: 1920 });
      expect(isMobileViewport()).toBe(false);
    });
  });

  describe('getMobileLayoutConfig', () => {
    it('should return complete mobile layout configuration', () => {
      const config = getMobileLayoutConfig();
      
      expect(config).toHaveProperty('spacing');
      expect(config).toHaveProperty('typography');
      expect(config).toHaveProperty('breakpoints');
      expect(config).toHaveProperty('container');
      
      // Verify breakpoint configuration
      expect(config.breakpoints.mobile).toBe(640);
      expect(config.breakpoints.tablet).toBe(1024);
      
      // Verify container configuration
      expect(config.container.maxWidth).toBe('100%');
      expect(config.container.padding).toBe('16px');
    });
  });

  describe('getTouchOptimizationConfig', () => {
    it('should return touch optimization configuration', () => {
      const config = getTouchOptimizationConfig();
      
      expect(config).toHaveProperty('minTouchTarget');
      expect(config).toHaveProperty('spacing');
      expect(config).toHaveProperty('gestures');
      
      // Verify touch target requirements
      expect(config.minTouchTarget.size).toBe('44px');
      expect(config.minTouchTarget.spacing).toBe('8px');
      
      // Verify gesture configuration
      expect(config.gestures.swipeThreshold).toBe(50);
      expect(config.gestures.longPressDelay).toBe(500);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce function calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(mockFn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should call function with latest arguments', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');
      
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledWith('third');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throttle function calls', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(100);
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should call function with first set of arguments', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);
      
      throttledFn('first');
      throttledFn('second');
      throttledFn('third');
      
      expect(mockFn).toHaveBeenCalledWith('first');
    });
  });
});
