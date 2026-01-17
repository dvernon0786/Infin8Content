/**
 * Centralized Logging Utility
 * 
 * Provides structured logging with environment-based filtering,
 * emoji indicators for console output, and JSON formatting for production.
 * 
 * Log Levels: debug, info, warn, error
 * Environments: development, production, test
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogEnvironment = 'development' | 'production' | 'test';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  componentPath?: string;
  userId?: string;
  sessionId?: string;
  stackTrace?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  environment: LogEnvironment;
  enableConsole: boolean;
  enableDatabase: boolean;
  enableThirdParty: boolean;
}

class Logger {
  private config: LoggerConfig;
  private emojiMap: Record<LogLevel, string> = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌'
  };

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      environment: (process.env.NODE_ENV as LogEnvironment) || 'development',
      enableConsole: true,
      enableDatabase: process.env.NODE_ENV === 'production',
      enableThirdParty: process.env.NODE_ENV === 'production',
      ...config
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.config.level];
  }

  private formatForConsole(entry: LogEntry): string {
    const emoji = this.emojiMap[entry.level];
    const timestamp = entry.timestamp;
    const context = entry.context ? ` [${JSON.stringify(entry.context)}]` : '';
    const component = entry.componentPath ? ` (${entry.componentPath})` : '';
    
    return `${emoji} [${timestamp}] ${entry.level.toUpperCase()}${component}: ${entry.message}${context}`;
  }

  private formatForDatabase(entry: LogEntry): Omit<LogEntry, 'timestamp'> & { created_at: string } {
    const { timestamp, ...rest } = entry;
    return {
      ...rest,
      created_at: timestamp
    };
  }

  private sanitizeForProduction(entry: LogEntry): LogEntry {
    // Remove sensitive information in production
    if (this.config.environment === 'production') {
      const sanitized = { ...entry };
      
      // Sanitize PII patterns
      if (sanitized.message) {
        sanitized.message = sanitized.message
          .replace(/email\s*[:=]\s*[\w\.-@]+/gi, 'email: [REDACTED]')
          .replace(/password\s*[:=]\s*\S+/gi, 'password: [REDACTED]')
          .replace(/token\s*[:=]\s*\S+/gi, 'token: [REDACTED]')
          .replace(/api[_-]?key\s*[:=]\s*\S+/gi, 'api_key: [REDACTED]');
      }
      
      // Remove potentially sensitive context
      if (sanitized.context) {
        const { password, token, apiKey, ...safeContext } = sanitized.context;
        sanitized.context = safeContext;
      }
      
      return sanitized;
    }
    
    return entry;
  }

  private async writeToDatabase(entry: LogEntry): Promise<void> {
    if (!this.config.enableDatabase) return;

    try {
      // Import dynamically to avoid circular dependencies
      const { createClient } = await import('./supabase/client');
      const supabase = createClient();
      
      const dbEntry = this.formatForDatabase(entry);
      
      // Use any type for now since the table doesn't exist yet
      // This will be fixed after Task 2 (database schema creation)
      await (supabase as any).from('error_logs').insert(dbEntry);
    } catch (error) {
      // Avoid infinite logging loops
      console.error('Failed to write log to database:', error);
    }
  }

  private async sendToThirdParty(entry: LogEntry): Promise<void> {
    if (!this.config.enableThirdParty) return;

    try {
      // Sentry integration for error/warn levels
      if ((entry.level === 'error' || entry.level === 'warn') && process.env.SENTRY_DSN) {
        // Dynamic import to handle optional dependency
        const Sentry = await import('@sentry/nextjs').catch(() => null);
        
        if (Sentry) {
          Sentry.captureException(new Error(entry.message), {
            tags: { component: entry.componentPath },
            extra: entry.context,
            user: entry.userId ? { id: entry.userId } : undefined
          });
        }
      }
    } catch (error) {
      console.error('Failed to send log to third party:', error);
    }
  }

  private async processLog(entry: LogEntry): Promise<void> {
    // Sanitize for production
    const sanitizedEntry = this.sanitizeForProduction(entry);

    // Console output
    if (this.config.enableConsole) {
      const consoleMessage = this.formatForConsole(sanitizedEntry);
      
      switch (sanitizedEntry.level) {
        case 'debug':
          console.debug(consoleMessage);
          break;
        case 'info':
          console.info(consoleMessage);
          break;
        case 'warn':
          console.warn(consoleMessage);
          break;
        case 'error':
          console.error(consoleMessage);
          break;
      }
    }

    // Database logging (async, non-blocking)
    if (this.config.enableDatabase) {
      // Don't await to avoid blocking the main thread
      this.writeToDatabase(sanitizedEntry).catch(() => {});
    }

    // Third-party integration (async, non-blocking)
    if (this.config.enableThirdParty) {
      // Don't await to avoid blocking the main thread
      this.sendToThirdParty(sanitizedEntry).catch(() => {});
    }
  }

  createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    options?: {
      componentPath?: string;
      userId?: string;
      sessionId?: string;
      stackTrace?: string;
    }
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      componentPath: options?.componentPath,
      userId: options?.userId,
      sessionId: options?.sessionId,
      stackTrace: options?.stackTrace
    };
  }

  // Public logging methods
  debug(message: string, context?: Record<string, any>, options?: any): void {
    if (!this.shouldLog('debug')) return;
    
    const entry = this.createLogEntry('debug', message, context, options);
    this.processLog(entry);
  }

  info(message: string, context?: Record<string, any>, options?: any): void {
    if (!this.shouldLog('info')) return;
    
    const entry = this.createLogEntry('info', message, context, options);
    this.processLog(entry);
  }

  warn(message: string, context?: Record<string, any>, options?: any): void {
    if (!this.shouldLog('warn')) return;
    
    const entry = this.createLogEntry('warn', message, context, options);
    this.processLog(entry);
  }

  error(message: string, context?: Record<string, any>, options?: any): void {
    if (!this.shouldLog('error')) return;
    
    const entry = this.createLogEntry('error', message, context, options);
    this.processLog(entry);
  }

  // Specialized logging methods
  logError(error: Error, context?: Record<string, any>, options?: any): void {
    this.error(error.message, context, {
      ...options,
      stackTrace: error.stack
    });
  }

  logApiCall(method: string, url: string, status: number, duration: number, context?: Record<string, any>): void {
    const level = status >= 400 ? 'warn' : status >= 500 ? 'error' : 'info';
    
    this[level](`API ${method} ${url}`, {
      status,
      duration: `${duration}ms`,
      ...context
    }, {
      componentPath: `api:${method}:${url}`
    });
  }

  logPerformance(metricName: string, value: number, unit: string = 'ms', context?: Record<string, any>): void {
    this.info(`Performance: ${metricName}`, {
      value,
      unit,
      ...context
    }, {
      componentPath: `performance:${metricName}`
    });
  }

  logUserAction(action: string, userId: string, context?: Record<string, any>): void {
    this.info(`User action: ${action}`, context, {
      userId,
      componentPath: `user:${action}`
    });
  }

  // Configuration methods
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  setEnvironment(environment: LogEnvironment): void {
    this.config.environment = environment;
    this.config.enableConsole = environment !== 'production';
    this.config.enableDatabase = environment === 'production';
    this.config.enableThirdParty = environment === 'production';
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// Create default logger instance
export const logger = new Logger({
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  environment: (process.env.NODE_ENV as LogEnvironment) || 'development'
});

// Export factory function for creating custom loggers
export function createLogger(config: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}

// Export types and utilities
export { Logger };
export default logger;
