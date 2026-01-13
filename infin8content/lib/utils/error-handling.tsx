/**
 * Error handling utilities for bulk operations
 * Story 23.1: Multi-article Management Interface
 */

import React from 'react';

export interface BulkOperationError {
  id: string;
  error: string;
  retryable: boolean;
  context?: Record<string, any>;
}

export interface ErrorHandlingOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: BulkOperationError) => void;
  onFailure?: (errors: BulkOperationError[]) => void;
  onSuccess?: (successCount: number, total: number) => void;
}

/**
 * Enhanced error handler for bulk operations
 */
export class BulkOperationErrorHandler {
  private errors: BulkOperationError[] = [];
  private maxRetries: number;
  private retryDelay: number;
  private onRetry?: (attempt: number, error: BulkOperationError) => void;
  private onFailure?: (errors: BulkOperationError[]) => void;
  private onSuccess?: (successCount: number, total: number) => void;

  constructor(options: ErrorHandlingOptions = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.onRetry = options.onRetry;
    this.onFailure = options.onFailure;
    this.onSuccess = options.onSuccess;
  }

  /**
   * Handle a bulk operation with retry logic
   */
  async handleBulkOperation<T>(
    operation: () => Promise<T>,
    operationId: string,
    context?: Record<string, any>
  ): Promise<{ success: boolean; result?: T; error?: BulkOperationError }> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // If we had previous errors for this operation, clear them
        this.errors = this.errors.filter(e => e.id !== operationId);
        
        return { success: true, result };
      } catch (error) {
        lastError = error as Error;
        
        const bulkError: BulkOperationError = {
          id: operationId,
          error: lastError.message,
          retryable: this.isRetryableError(lastError),
          context,
        };

        if (attempt < this.maxRetries && bulkError.retryable) {
          this.onRetry?.(attempt, bulkError);
          await this.delay(this.retryDelay * attempt); // Exponential backoff
          continue;
        }
        
        // Add to errors list if all retries failed
        this.errors.push(bulkError);
        break;
      }
    }

    return { 
      success: false, 
      error: {
        id: operationId,
        error: lastError?.message || 'Unknown error',
        retryable: false,
        context,
      }
    };
  }

  /**
   * Process multiple operations in batches with error handling
   */
  async processBatch<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    options: {
      batchSize?: number;
      continueOnError?: boolean;
      onBatchComplete?: (batchIndex: number, results: Array<{ success: boolean; result?: R; error?: BulkOperationError }>) => void;
    } = {}
  ): Promise<{
    successCount: number;
    failureCount: number;
    results: Array<{ success: boolean; result?: R; error?: BulkOperationError }>;
  }> {
    const { batchSize = 10, continueOnError = true, onBatchComplete } = options;
    const results: Array<{ success: boolean; result?: R; error?: BulkOperationError }> = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (item, batchIndex) => {
          const operationId = `${item}-${i + batchIndex}`;
          return this.handleBulkOperation(
            () => processor(item, i + batchIndex),
            operationId,
            { item, index: i + batchIndex }
          );
        })
      );

      const batchProcessedResults = batchResults.map(result => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            success: false,
            error: {
              id: 'batch-error',
              error: (result.reason as any)?.message || 'Batch processing failed',
              retryable: false,
            }
          };
        }
      });

      results.push(...batchProcessedResults);
      
      // Update counts
      batchProcessedResults.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      });

      onBatchComplete?.(Math.floor(i / batchSize), batchProcessedResults);

      // Stop processing if not continuing on error and we have failures
      if (!continueOnError && failureCount > 0) {
        break;
      }
    }

    // Notify completion
    if (successCount > 0) {
      this.onSuccess?.(successCount, items.length);
    }
    
    if (failureCount > 0) {
      this.onFailure?.(this.errors);
    }

    return {
      successCount,
      failureCount,
      results,
    };
  }

  /**
   * Get all errors
   */
  getErrors(): BulkOperationError[] {
    return [...this.errors];
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get retryable errors
   */
  getRetryableErrors(): BulkOperationError[] {
    return this.errors.filter(e => e.retryable);
  }

  /**
   * Retry failed operations
   */
  async retryFailedOperations<T>(
    retryProcessor: (error: BulkOperationError) => Promise<T>
  ): Promise<{ successCount: number; failureCount: number }> {
    const retryableErrors = this.getRetryableErrors();
    let successCount = 0;
    let failureCount = 0;

    for (const error of retryableErrors) {
      try {
        await retryProcessor(error);
        successCount++;
        // Remove from errors list on successful retry
        this.errors = this.errors.filter(e => e.id !== error.id);
      } catch (retryError) {
        failureCount++;
        // Update error to be non-retryable after failed retry
        const errorIndex = this.errors.findIndex(e => e.id === error.id);
        if (errorIndex >= 0) {
          this.errors[errorIndex].retryable = false;
          this.errors[errorIndex].error = `Retry failed: ${(retryError as Error).message}`;
        }
      }
    }

    return { successCount, failureCount };
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Network errors are typically retryable
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return true;
    }
    
    // Rate limit errors are retryable
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return true;
    }
    
    // Server errors (5xx) are typically retryable
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return true;
    }
    
    // Client errors (4xx) are generally not retryable except for specific cases
    if (message.includes('408') || message.includes('429')) { // Request timeout or too many requests
      return true;
    }
    
    return false;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate user-friendly error message
   */
  static getUserFriendlyMessage(error: BulkOperationError): string {
    const message = error.error.toLowerCase();
    
    if (message.includes('network') || message.includes('connection')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    if (message.includes('timeout')) {
      return 'Operation timed out. Please try again.';
    }
    
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    
    if (message.includes('unauthorized')) {
      return 'You are not authorized to perform this action.';
    }
    
    if (message.includes('not found')) {
      return 'The requested resource was not found.';
    }
    
    if (message.includes('permission')) {
      return 'You do not have permission to perform this action.';
    }
    
    return error.error || 'An unexpected error occurred.';
  }
}

/**
 * Create a default error handler instance
 */
export function createBulkErrorHandler(options?: ErrorHandlingOptions): BulkOperationErrorHandler {
  return new BulkOperationErrorHandler(options);
}

/**
 * Error boundary component for bulk operations
 */
export interface BulkOperationErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class BulkOperationErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  }>,
  BulkOperationErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): BulkOperationErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
      <div className="flex items-center gap-2 text-red-800">
        <span className="font-medium">Something went wrong:</span>
        <span>{error.message}</span>
      </div>
      <button
        onClick={retry}
        className="mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  );
}
