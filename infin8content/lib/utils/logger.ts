/**
 * Logging utility with environment-based controls
 * Story 4a.6: Real-Time Progress Tracking and Updates
 */

export interface Logger {
  log: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

/**
 * Create a logger with environment-based controls
 */
export function createLogger(context: string): Logger {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isDebug = process.env.NEXT_PUBLIC_DEBUG_PROGRESS === 'true' || process.env.DEBUG_PROGRESS === 'true';
  
  return {
    log: (message: string, ...args: any[]) => {
      if (isDevelopment || isDebug) {
        console.log(`[${context}] ${message}`, ...args);
      }
    },
    error: (message: string, ...args: any[]) => {
      console.error(`[${context}] ERROR: ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
      if (isDevelopment || isDebug) {
        console.warn(`[${context}] WARNING: ${message}`, ...args);
      }
    },
    debug: (message: string, ...args: any[]) => {
      if (isDebug) {
        console.debug(`[${context}] DEBUG: ${message}`, ...args);
      }
    },
  };
}

/**
 * Default logger for progress tracking
 */
export const progressLogger = createLogger('ProgressTracking');
