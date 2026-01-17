/**
 * Logging Utility Tests
 * Tests logging utility with different log levels and environments
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, createLogger, Logger } from '@/lib/logging';

// Mock console methods
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
const mockConsoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});

// Mock fetch for database operations
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Logging', () => {
    it('should create logger with default configuration', () => {
      const testLogger = createLogger();
      expect(testLogger).toBeInstanceOf(Logger);
    });

    it('should log debug messages when level allows', () => {
      const testLogger = createLogger({ level: 'debug' });
      testLogger.debug('Debug message');
      expect(mockConsoleDebug).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG: Debug message')
      );
    });

    it('should not log debug messages when level is higher', () => {
      const testLogger = createLogger({ level: 'info' });
      testLogger.debug('Debug message');
      expect(mockConsoleDebug).not.toHaveBeenCalled();
    });

    it('should log error messages regardless of level', () => {
      const testLogger = createLogger({ level: 'info' });
      testLogger.error('Error message');
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Error message')
      );
    });

    it('should log with context and options', () => {
      const testLogger = createLogger({ level: 'debug' });
      const context = { userId: '123', action: 'test' };
      const options = { componentPath: 'TestComponent', sessionId: 'session-123' };

      testLogger.info('Test message', context, options);

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Test message')
      );
    });
  });

  describe('Specialized Logging Methods', () => {
    it('should log errors with stack trace', () => {
      const testLogger = createLogger({ level: 'debug' });
      const error = new Error('Test error');
      
      testLogger.logError(error, { context: 'test' });

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Test error')
      );
    });

    it('should log API calls with performance data', () => {
      const testLogger = createLogger({ level: 'debug' });
      
      testLogger.logApiCall('GET', '/api/test', 200, 150);

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('INFO: API GET /api/test')
      );
    });

    it('should log performance metrics', () => {
      const testLogger = createLogger({ level: 'debug' });
      
      testLogger.logPerformance('database_query', 250, 'ms');

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Performance: database_query')
      );
    });

    it('should log user actions', () => {
      const testLogger = createLogger({ level: 'debug' });
      
      testLogger.logUserAction('login', 'user-123');

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('INFO: User action: login')
      );
    });
  });

  describe('Configuration', () => {
    it('should allow changing log level', () => {
      const testLogger = createLogger({ level: 'error' });
      
      testLogger.debug('Debug message');
      expect(mockConsoleDebug).not.toHaveBeenCalled();
      
      testLogger.setLevel('debug');
      testLogger.debug('Debug message');
      expect(mockConsoleDebug).toHaveBeenCalled();
    });

    it('should allow changing environment', () => {
      const testLogger = createLogger({ level: 'debug' });
      
      testLogger.setEnvironment('production');
      expect(testLogger.getConfig().environment).toBe('production');
      expect(testLogger.getConfig().enableConsole).toBe(false);
      expect(testLogger.getConfig().enableDatabase).toBe(true);
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize PII in production environment', () => {
      const testLogger = createLogger({ 
        level: 'debug',
        environment: 'production'
      });
      
      testLogger.error('Login failed for email=user@example.com with password=secret123', {
        apiKey: 'secret-key',
        token: 'auth-token'
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('email: [REDACTED]')
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('password: [REDACTED]')
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('token: [REDACTED]')
      );
    });

    it('should not sanitize in development environment', () => {
      const testLogger = createLogger({ 
        level: 'debug',
        environment: 'development'
      });
      
      testLogger.error('Login failed for email=user@example.com with password=secret123');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('email=user@example.com')
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('password=secret123')
      );
    });
  });

  describe('Database Integration', () => {
    it('should attempt to write to database when enabled', async () => {
      const testLogger = createLogger({ 
        level: 'debug',
        enableDatabase: true
      });
      
      // Mock successful database response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      testLogger.error('Test error');

      // Should not throw error, database operations are async and non-blocking
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('Third-Party Integration', () => {
    it('should attempt to send to Sentry when enabled', async () => {
      const testLogger = createLogger({ 
        level: 'debug',
        enableThirdParty: true
      });
      
      // Mock Sentry
      const mockSentry = {
        captureException: vi.fn(),
        captureMessage: vi.fn()
      };
      
      // Mock dynamic import
      vi.doMock('@sentry/nextjs', () => mockSentry);

      testLogger.error('Test error');

      // Should not throw error, Sentry operations are async and non-blocking
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });
});

describe('Default Logger Instance', () => {
  it('should export a default logger instance', () => {
    expect(logger).toBeInstanceOf(Logger);
  });

  it('should use environment variables for configuration', () => {
    // Test that the default logger reads from process.env
    expect(logger.getConfig().environment).toBeDefined();
  });
});
