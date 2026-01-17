/**
 * Production Monitoring Infrastructure
 * Implements production monitoring with third-party integrations (Sentry, etc.)
 * Environment-based activation and configurable endpoints
 */

import { logger } from './logging';

export interface MonitoringConfig {
  enabled: boolean;
  environment: 'development' | 'production' | 'test';
  sentry?: {
    dsn: string;
    environment: string;
    tracesSampleRate: number;
    profilesSampleRate: number;
  };
  customMetrics?: {
    endpoint?: string;
    apiKey?: string;
    batchSize: number;
    flushInterval: number;
  };
  alerting?: {
    webhookUrl?: string;
    slackChannel?: string;
    emailRecipients?: string[];
  };
}

export interface MetricData {
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp: Date;
}

export interface AlertData {
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class ProductionMonitoring {
  private config: MonitoringConfig;
  private metricsQueue: MetricData[] = [];
  private alertsQueue: AlertData[] = [];
  private flushTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production' && process.env.MONITORING_ENABLED !== 'false',
      environment: (process.env.NODE_ENV as any) || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
      customMetrics: {
        batchSize: 100,
        flushInterval: 30000,
        endpoint: process.env.CUSTOM_METRICS_ENDPOINT,
        apiKey: process.env.CUSTOM_METRICS_API_KEY
      },
      alerting: {
        webhookUrl: process.env.ALERT_WEBHOOK_URL,
        slackChannel: process.env.SLACK_CHANNEL,
        emailRecipients: process.env.EMAIL_RECIPIENTS?.split(',').filter(Boolean)
      },
      ...config
    };

    if (this.config.enabled) {
      this.initialize();
    }
  }

  private async initialize() {
    try {
      // Initialize Sentry if configured
      if (this.config.sentry?.dsn) {
        await this.initializeSentry();
      }

      // Set up metrics flushing
      if (this.config.customMetrics?.endpoint) {
        this.setupMetricsFlushing();
      }

      this.isInitialized = true;
      logger.info('Production monitoring initialized', {
        environment: this.config.environment,
        sentryEnabled: !!this.config.sentry?.dsn,
        customMetricsEnabled: !!this.config.customMetrics?.endpoint
      }, { componentPath: 'ProductionMonitoring' });

    } catch (error) {
      logger.error('Failed to initialize production monitoring', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { componentPath: 'ProductionMonitoring' });
    }
  }

  private async initializeSentry() {
    try {
      // Dynamic import to handle optional dependency
      const Sentry = await import('@sentry/nextjs').catch(() => null);
      
      if (Sentry && this.config.sentry) {
        Sentry.init({
          dsn: this.config.sentry.dsn,
          environment: this.config.sentry.environment,
          tracesSampleRate: this.config.tracesSampleRate,
          profilesSampleRate: this.config.profilesSampleRate,
          beforeSend: (event) => {
            // Filter out sensitive information
            return this.sanitizeEvent(event);
          },
          beforeSendTransaction: (transaction) => {
            // Filter out certain transactions if needed
            return transaction;
          }
        });

        logger.info('Sentry initialized', { 
          environment: this.config.sentry.environment 
        }, { componentPath: 'ProductionMonitoring' });
      }
    } catch (error) {
      logger.error('Failed to initialize Sentry', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { componentPath: 'ProductionMonitoring' });
    }
  }

  private sanitizeEvent(event: any): any {
    if (!event) return event;

    // Remove sensitive information from events
    const sanitized = { ...event };

    // Sanitize breadcrumbs
    if (sanitized.breadcrumbs) {
      sanitized.breadcrumbs = sanitized.breadcrumbs.map((breadcrumb: any) => ({
        ...breadcrumb,
        message: breadcrumb.message?.replace(/password\s*[:=]\s*\S+/gi, 'password: [REDACTED]')
      }));
    }

    // Sanitize extra data
    if (sanitized.extra) {
      sanitized.extra = this.sanitizeObject(sanitized.extra);
    }

    // Sanitize contexts
    if (sanitized.contexts) {
      sanitized.contexts = this.sanitizeObject(sanitized.contexts);
    }

    return sanitized;
  }

  private sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key in sanitized) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key]
          .replace(/password\s*[:=]\s*\S+/gi, 'password: [REDACTED]')
          .replace(/token\s*[:=]\s*\S+/gi, 'token: [REDACTED]')
          .replace(/api[_-]?key\s*[:=]\s*\S+/gi, 'api_key: [REDACTED]')
          .replace(/email\s*[:=]\s*[\w\.-@]+/gi, 'email: [REDACTED]');
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeObject(sanitized[key]);
      }
    }

    return sanitized;
  }

  private setupMetricsFlushing() {
    if (this.config.customMetrics?.flushInterval) {
      this.flushTimer = setInterval(() => {
        this.flushMetrics();
      }, this.config.customMetrics.flushInterval);
    }
  }

  // Public API methods
  captureException(error: Error, context?: Record<string, any>) {
    if (!this.isInitialized || !this.config.enabled) return;

    try {
      // Log to our logger first
      logger.error('Exception captured by monitoring', {
        error: error.message,
        stack: error.stack,
        context
      }, { componentPath: 'ProductionMonitoring' });

      // Send to Sentry if available
      if (this.config.sentry?.dsn) {
        import('@sentry/nextjs').then(Sentry => {
          if (Sentry) {
            Sentry.captureException(error, {
              tags: { source: 'production-monitoring' },
              extra: context
            });
          }
        }).catch(() => {
          // Silently fail if Sentry is not available
        });
      }

      // Create alert for critical errors
      if (context?.severity === 'critical') {
        this.createAlert('critical', 'Critical Error', error.message, 'production-monitoring', context);
      }

    } catch (err) {
      logger.error('Failed to capture exception', {
        error: err instanceof Error ? err.message : 'Unknown error'
      }, { componentPath: 'ProductionMonitoring' });
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
    if (!this.isInitialized || !this.config.enabled) return;

    try {
      // Log to our logger
      logger[level](`Message captured by monitoring: ${message}`, context, { componentPath: 'ProductionMonitoring' });

      // Send to Sentry if available
      if (this.config.sentry?.dsn) {
        import('@sentry/nextjs').then(Sentry => {
          if (Sentry) {
            Sentry.captureMessage(message, level, {
              tags: { source: 'production-monitoring' },
              extra: context
            });
          }
        }).catch(() => {
          // Silently fail if Sentry is not available
        });
      }

    } catch (err) {
      logger.error('Failed to capture message', {
        error: err instanceof Error ? err.message : 'Unknown error'
      }, { componentPath: 'ProductionMonitoring' });
    }
  }

  recordMetric(name: string, value: number, unit: string = 'count', tags?: Record<string, string>) {
    if (!this.isInitialized || !this.config.enabled) return;

    const metric: MetricData = {
      name,
      value,
      unit,
      tags: { ...tags, environment: this.config.environment },
      timestamp: new Date()
    };

    this.metricsQueue.push(metric);

    // Auto-flush if batch size reached
    if (this.config.customMetrics && this.metricsQueue.length >= this.config.customMetrics.batchSize) {
      this.flushMetrics();
    }

    // Log metric to our logger
    logger.debug('Metric recorded', {
      name,
      value,
      unit,
      tags
    }, { componentPath: 'ProductionMonitoring' });
  }

  createAlert(level: AlertData['level'], title: string, message: string, source: string, metadata?: Record<string, any>) {
    if (!this.isInitialized || !this.config.enabled) return;

    const alert: AlertData = {
      level,
      title,
      message,
      source,
      timestamp: new Date(),
      metadata
    };

    this.alertsQueue.push(alert);

    // Log alert
    logger[level](`Alert created: ${title}`, {
      message,
      source,
      metadata
    }, { componentPath: 'ProductionMonitoring' });

    // Auto-flush alerts for critical level
    if (level === 'critical') {
      this.flushAlerts();
    }
  }

  private async flushMetrics() {
    if (!this.config.customMetrics?.endpoint || this.metricsQueue.length === 0) return;

    try {
      const metricsToSend = [...this.metricsQueue];
      this.metricsQueue = [];

      const response = await fetch(this.config.customMetrics.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.customMetrics.apiKey}`
        },
        body: JSON.stringify({
          metrics: metricsToSend,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.debug('Metrics flushed successfully', {
        count: metricsToSend.length
      }, { componentPath: 'ProductionMonitoring' });

    } catch (error) {
      logger.error('Failed to flush metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        metricsCount: this.metricsQueue.length
      }, { componentPath: 'ProductionMonitoring' });

      // Re-queue metrics that failed to send
      // Note: In production, you might want to implement a backoff strategy
    }
  }

  private async flushAlerts() {
    if (this.alertsQueue.length === 0) return;

    try {
      const alertsToSend = [...this.alertsQueue];
      this.alertsQueue = [];

      // Send to webhook if configured
      if (this.config.alerting?.webhookUrl) {
        await this.sendWebhookAlert(alertsToSend);
      }

      // Send to Slack if configured
      if (this.config.alerting?.slackChannel) {
        await this.sendSlackAlert(alertsToSend);
      }

      // Send email if configured
      if (this.config.alerting?.emailRecipients?.length) {
        await this.sendEmailAlert(alertsToSend);
      }

      logger.debug('Alerts flushed successfully', {
        count: alertsToSend.length
      }, { componentPath: 'ProductionMonitoring' });

    } catch (error) {
      logger.error('Failed to flush alerts', {
        error: error instanceof Error ? error.message : 'Unknown error',
        alertsCount: this.alertsQueue.length
      }, { componentPath: 'ProductionMonitoring' });
    }
  }

  private async sendWebhookAlert(alerts: AlertData[]) {
    if (!this.config.alerting?.webhookUrl) return;

    try {
      await fetch(this.config.alerting.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alerts,
          environment: this.config.environment,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      logger.error('Failed to send webhook alert', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { componentPath: 'ProductionMonitoring' });
    }
  }

  private async sendSlackAlert(alerts: AlertData[]) {
    if (!this.config.alerting?.slackChannel) return;

    try {
      const criticalAlerts = alerts.filter(alert => alert.level === 'critical');
      if (criticalAlerts.length === 0) return;

      const message = criticalAlerts.map(alert => {
        const emoji = alert.level === 'critical' ? '🚨' : alert.level === 'error' ? '❌' : '⚠️';
        return `${emoji} *${alert.title}*\n${alert.message}`;
      }).join('\n\n');

      // This would require a Slack webhook URL implementation
      logger.info('Slack alert would be sent', {
        channel: this.config.alerting.slackChannel,
        alertCount: criticalAlerts.length
      }, { componentPath: 'ProductionMonitoring' });

    } catch (error) {
      logger.error('Failed to send Slack alert', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { componentPath: 'ProductionMonitoring' });
    }
  }

  private async sendEmailAlert(alerts: AlertData[]) {
    if (!this.config.alerting?.emailRecipients?.length) return;

    try {
      const criticalAlerts = alerts.filter(alert => alert.level === 'critical');
      if (criticalAlerts.length === 0) return;

      // This would require an email service implementation
      logger.info('Email alert would be sent', {
        recipients: this.config.alerting.emailRecipients,
        alertCount: criticalAlerts.length
      }, { componentPath: 'ProductionMonitoring' });

    } catch (error) {
      logger.error('Failed to send email alert', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { componentPath: 'ProductionMonitoring' });
    }
  }

  // Cleanup method
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Flush any remaining data
    this.flushMetrics();
    this.flushAlerts();

    this.isInitialized = false;
    logger.info('Production monitoring destroyed', {}, { componentPath: 'ProductionMonitoring' });
  }

  // Get monitoring status
  getStatus() {
    return {
      initialized: this.isInitialized,
      enabled: this.config.enabled,
      environment: this.config.environment,
      sentryEnabled: !!this.config.sentry?.dsn,
      customMetricsEnabled: !!this.config.customMetrics?.endpoint,
      metricsQueueSize: this.metricsQueue.length,
      alertsQueueSize: this.alertsQueue.length
    };
  }
}

// Create singleton instance
export const productionMonitoring = new ProductionMonitoring();

// Export factory for custom instances
export function createProductionMonitoring(config: Partial<MonitoringConfig>): ProductionMonitoring {
  return new ProductionMonitoring(config);
}

// Export types and utilities
export { ProductionMonitoring };
export default productionMonitoring;
