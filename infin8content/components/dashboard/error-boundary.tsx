/**
 * Enhanced Error boundary component with structured logging
 * Story 15.1: Real-time Article Status Display
 * Enhanced with comprehensive debugging ecosystem integration
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';
import { logger } from '@/lib/logging';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentPath?: string;
  userId?: string;
  sessionId?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId?: string;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  private errorId: string;
  private componentPath: string;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
    
    // Generate unique error ID for tracking
    this.errorId = this.generateErrorId();
    this.componentPath = props.componentPath || 'DashboardErrorBoundary';
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.generateErrorId();
    
    // Enhanced structured logging
    logger.error(`Error boundary caught error in ${this.componentPath}`, {
      errorId,
      errorName: error.name,
      errorMessage: error.message,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.componentPath,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      timestamp: new Date().toISOString()
    }, {
      componentPath: this.componentPath,
      userId: this.props.userId,
      sessionId: this.props.sessionId,
      stackTrace: error.stack
    });

    // Keep console.error for development debugging
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    // Log retry attempt
    logger.info(`User retrying error boundary`, {
      errorId: this.state.errorId,
      componentPath: this.componentPath
    }, {
      componentPath: this.componentPath,
      userId: this.props.userId,
      sessionId: this.props.sessionId
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: undefined
    });
  };

  handleReportError = () => {
    // Log error report request
    logger.info(`User requested error report`, {
      errorId: this.state.errorId,
      componentPath: this.componentPath,
      errorName: this.state.error?.name,
      errorMessage: this.state.error?.message
    }, {
      componentPath: this.componentPath,
      userId: this.props.userId,
      sessionId: this.props.sessionId
    });

    // In a real implementation, this would open a error reporting modal
    // For now, we'll copy error details to clipboard
    if (this.state.error && this.state.errorInfo) {
      const errorDetails = `
Error ID: ${this.state.errorId}
Component: ${this.componentPath}
Error: ${this.state.error.name}
Message: ${this.state.error.message}
Stack: ${this.state.error.stack}
Component Stack: ${this.state.errorInfo.componentStack}
User Agent: ${typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR'}
URL: ${typeof window !== 'undefined' ? window.location.href : 'SSR'}
Timestamp: ${new Date().toISOString()}
      `.trim();

      // Copy to clipboard
      if (typeof window !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(errorDetails).then(() => {
          logger.info('Error details copied to clipboard', { errorId: this.state.errorId });
        }).catch((err) => {
          logger.warn('Failed to copy error details to clipboard', { errorId: this.state.errorId, error: err.message });
        });
      }
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI with enhanced error reporting
      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
              {this.state.errorId && (
                <span className="text-xs text-red-600 font-mono">
                  ID: {this.state.errorId}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-700">
              The dashboard encountered an error and couldn&apos;t display the article status.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-xs text-red-600 bg-red-100 p-2 rounded">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReportError}
                className="flex items-center gap-2"
              >
                <Bug className="h-4 w-4" />
                Report Error
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Enhanced Hook for error handling in functional components
 */
export function useErrorHandler(options?: {
  componentPath?: string;
  userId?: string;
  sessionId?: string;
}) {
  const handleError = (error: Error, context?: string) => {
    const componentPath = options?.componentPath || context || 'component';
    
    // Enhanced structured logging
    logger.error(`Error in ${componentPath}`, {
      errorName: error.name,
      errorMessage: error.message,
      context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR'
    }, {
      componentPath,
      userId: options?.userId,
      sessionId: options?.sessionId,
      stackTrace: error.stack
    });
    
    // Keep console.error for development debugging
    console.error(`Error in ${context || 'component'}:`, error);
  };

  const createFallback = (message: string, onRetry?: () => void, errorId?: string) => {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{message}</span>
            {errorId && (
              <span className="text-xs text-orange-600 font-mono ml-2">
                ID: {errorId}
              </span>
            )}
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="ml-auto h-6"
              >
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const createErrorBoundary = (children: ReactNode, fallbackProps?: {
    message?: string;
    onRetry?: () => void;
  }) => {
    return (
      <DashboardErrorBoundary
        componentPath={options?.componentPath}
        userId={options?.userId}
        sessionId={options?.sessionId}
        onError={(error: Error, errorInfo: ErrorInfo) => {
          handleError(error, options?.componentPath);
        }}
      >
        {children}
      </DashboardErrorBoundary>
    );
  };

  return {
    handleError,
    createFallback,
    createErrorBoundary
  };
}
