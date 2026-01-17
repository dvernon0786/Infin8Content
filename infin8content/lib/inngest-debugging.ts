/**
 * Inngest Debugging Integration
 * Adds debugging instrumentation to Inngest workflows for job monitoring
 * Hooks into article generation pipeline for queue health and failure tracking
 */

import { Inngest } from 'inngest';
import { logger } from './logging';

export interface InngestDebugConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  trackPerformance: boolean;
  trackFailures: boolean;
  trackRetries: boolean;
  sampleRate: number; // 0-1, percentage of jobs to sample
}

export interface JobDebugInfo {
  jobId: string;
  jobName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  retryCount?: number;
  error?: Error;
  metadata?: Record<string, any>;
  userId?: string;
  organizationId?: string;
}

class InngestDebugger {
  private config: InngestDebugConfig;
  private activeJobs = new Map<string, JobDebugInfo>();
  private jobMetrics = {
    total: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    avgDuration: 0,
    totalDuration: 0
  };

  constructor(config: Partial<InngestDebugConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV !== 'production' || process.env.INNGEST_DEBUG_ENABLED === 'true',
      logLevel: (process.env.INNGEST_DEBUG_LOG_LEVEL as any) || 'info',
      trackPerformance: true,
      trackFailures: true,
      trackRetries: true,
      sampleRate: parseFloat(process.env.INNGEST_DEBUG_SAMPLE_RATE || '1.0'),
      ...config
    };
  }

  private shouldSampleJob(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateMetrics(jobInfo: JobDebugInfo) {
    this.jobMetrics.total++;
    
    switch (jobInfo.status) {
      case 'completed':
        this.jobMetrics.completed++;
        if (jobInfo.duration) {
          this.jobMetrics.totalDuration += jobInfo.duration;
          this.jobMetrics.avgDuration = this.jobMetrics.totalDuration / this.jobMetrics.completed;
        }
        break;
      case 'failed':
        this.jobMetrics.failed++;
        break;
      case 'cancelled':
        this.jobMetrics.cancelled++;
        break;
    }
  }

  private logJobEvent(jobInfo: JobDebugInfo, event: string, additionalData?: Record<string, any>) {
    if (!this.config.enabled) return;

    const logData = {
      jobId: jobInfo.jobId,
      jobName: jobInfo.jobName,
      status: jobInfo.status,
      duration: jobInfo.duration,
      retryCount: jobInfo.retryCount,
      userId: jobInfo.userId,
      organizationId: jobInfo.organizationId,
      ...additionalData
    };

    switch (this.config.logLevel) {
      case 'debug':
        logger.debug(`Inngest job ${event}`, logData, {
          componentPath: 'inngest-debug',
          sessionId: jobInfo.jobId
        });
        break;
      case 'info':
        logger.info(`Inngest job ${event}`, logData, {
          componentPath: 'inngest-debug',
          sessionId: jobInfo.jobId
        });
        break;
      case 'warn':
        logger.warn(`Inngest job ${event}`, logData, {
          componentPath: 'inngest-debug',
          sessionId: jobInfo.jobId
        });
        break;
      case 'error':
        logger.error(`Inngest job ${event}`, logData, {
          componentPath: 'inngest-debug',
          sessionId: jobInfo.jobId
        });
        break;
    }
  }

  // Public API methods
  startJob(jobName: string, metadata?: Record<string, any>): string | null {
    if (!this.config.enabled || !this.shouldSampleJob()) {
      return null;
    }

    const jobId = this.generateJobId();
    const jobInfo: JobDebugInfo = {
      jobId,
      jobName,
      status: 'running',
      startTime: new Date(),
      metadata,
      userId: metadata?.userId,
      organizationId: metadata?.organizationId
    };

    this.activeJobs.set(jobId, jobInfo);
    this.logJobEvent(jobInfo, 'started', { metadata });

    return jobId;
  }

  completeJob(jobId: string, result?: any, metadata?: Record<string, any>): void {
    const jobInfo = this.activeJobs.get(jobId);
    if (!jobInfo) return;

    const endTime = new Date();
    const duration = endTime.getTime() - jobInfo.startTime.getTime();

    jobInfo.status = 'completed';
    jobInfo.endTime = endTime;
    jobInfo.duration = duration;
    if (metadata) {
      jobInfo.metadata = { ...jobInfo.metadata, ...metadata };
    }

    this.updateMetrics(jobInfo);
    this.logJobEvent(jobInfo, 'completed', { duration, result });

    this.activeJobs.delete(jobId);
  }

  failJob(jobId: string, error: Error, metadata?: Record<string, any>): void {
    const jobInfo = this.activeJobs.get(jobId);
    if (!jobInfo) return;

    const endTime = new Date();
    const duration = endTime.getTime() - jobInfo.startTime.getTime();

    jobInfo.status = 'failed';
    jobInfo.endTime = endTime;
    jobInfo.duration = duration;
    jobInfo.error = error;
    if (metadata) {
      jobInfo.metadata = { ...jobInfo.metadata, ...metadata };
    }

    this.updateMetrics(jobInfo);
    this.logJobEvent(jobInfo, 'failed', { 
      duration, 
      error: error.message,
      stackTrace: error.stack 
    });

    this.activeJobs.delete(jobId);
  }

  retryJob(jobId: string, attempt: number, maxAttempts: number, error?: Error): void {
    const jobInfo = this.activeJobs.get(jobId);
    if (!jobInfo) return;

    jobInfo.retryCount = (jobInfo.retryCount || 0) + 1;

    this.logJobEvent(jobInfo, 'retrying', {
      attempt,
      maxAttempts,
      error: error?.message,
      retryCount: jobInfo.retryCount
    });
  }

  cancelJob(jobId: string, reason?: string): void {
    const jobInfo = this.activeJobs.get(jobId);
    if (!jobInfo) return;

    const endTime = new Date();
    const duration = endTime.getTime() - jobInfo.startTime.getTime();

    jobInfo.status = 'cancelled';
    jobInfo.endTime = endTime;
    jobInfo.duration = duration;

    this.updateMetrics(jobInfo);
    this.logJobEvent(jobInfo, 'cancelled', { duration, reason });

    this.activeJobs.delete(jobId);
  }

  getActiveJobs(): JobDebugInfo[] {
    return Array.from(this.activeJobs.values());
  }

  getMetrics() {
    return {
      ...this.jobMetrics,
      activeJobs: this.activeJobs.size,
      successRate: this.jobMetrics.total > 0 ? (this.jobMetrics.completed / this.jobMetrics.total) * 100 : 0,
      failureRate: this.jobMetrics.total > 0 ? (this.jobMetrics.failed / this.jobMetrics.total) * 100 : 0
    };
  }

  // Helper method to wrap Inngest functions with debugging
  wrapFunction(
    inngest: Inngest,
    jobName: string,
    fn: (event: any, step: any) => Promise<any>,
    options?: {
      userId?: string;
      organizationId?: string;
      metadata?: Record<string, any>;
    }
  ) {
    return inngest.createFunction(
      {
        id: jobName,
        name: jobName,
        retries: 3
      },
      {
        event: jobName
      },
      async ({ event, step }: any) => {
        const jobId = this.startJob(jobName, {
          eventId: event.id,
          userId: options?.userId || event.data?.userId,
          organizationId: options?.organizationId || event.data?.organizationId,
          ...options?.metadata,
          ...event.data
        });

        try {
          // Track step execution
          if (this.config.trackPerformance) {
            const stepStart = Date.now();
            
            const result = await fn(event, step);
            
            const stepDuration = Date.now() - stepStart;
            this.logJobEvent(
              this.activeJobs.get(jobId!)!,
              'step-completed',
              { stepDuration, step: 'main' }
            );
            
            if (jobId) {
              this.completeJob(jobId, result, { stepDuration });
            }
            
            return result;
          } else {
            const result = await fn(event, step);
            
            if (jobId) {
              this.completeJob(jobId, result);
            }
            
            return result;
          }
        } catch (error) {
          if (jobId) {
            this.failJob(jobId, error as Error);
          }
          throw error;
        }
      }
    );
  }
}

// Create singleton instance
export const inngestDebugger = new InngestDebugger();

// Export factory for custom instances
export function createInngestDebugger(config: Partial<InngestDebugConfig>): InngestDebugger {
  return new InngestDebugger(config);
}

// Export types and utilities
export { InngestDebugger };
export default inngestDebugger;
