/**
 * User-Facing Error Reporting Component
 * Builds user error reporting component with feedback collection
 * Integrates with existing UI patterns and adds to error boundaries
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Send, 
  X, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  Bug,
  User,
  Info
} from 'lucide-react';
import { logger } from '@/lib/logging';

export interface ErrorReportData {
  errorId: string;
  errorName: string;
  errorMessage: string;
  componentPath?: string;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

export interface ErrorReporterProps {
  error: ErrorReportData;
  onSubmit?: (report: ErrorReport) => void;
  onCancel?: () => void;
  showTitle?: boolean;
  className?: string;
}

export interface ErrorReport {
  errorId: string;
  userEmail?: string;
  userDescription: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'ui' | 'functionality' | 'performance' | 'security' | 'other';
  userAgent: string;
  url: string;
  timestamp: string;
  consent: boolean;
}

export function ErrorReporter({ 
  error, 
  onSubmit, 
  onCancel, 
  showTitle = true, 
  className = '' 
}: ErrorReporterProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<Partial<ErrorReport>>({
    errorId: error.errorId,
    userAgent: error.userAgent || '',
    url: error.url || '',
    timestamp: error.timestamp,
    severity: 'medium',
    category: 'functionality',
    consent: false
  });

  const severityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  const categoryIcons = {
    ui: AlertTriangle,
    functionality: Bug,
    performance: AlertCircle,
    security: User,
    other: Info
  };

  const handleInputChange = (field: keyof ErrorReport, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userDescription?.trim()) {
      alert('Please provide a description of what you were doing when the error occurred.');
      return;
    }

    if (!formData.consent) {
      alert('Please consent to sharing this information for debugging purposes.');
      return;
    }

    setIsSubmitting(true);

    try {
      const report: ErrorReport = {
        errorId: error.errorId,
        userEmail: formData.userEmail,
        userDescription: formData.userDescription!,
        severity: formData.severity!,
        category: formData.category!,
        userAgent: formData.userAgent,
        url: formData.url,
        timestamp: formData.timestamp,
        consent: formData.consent
      };

      // Log the error report submission
      logger.info('User error report submitted', {
        errorId: error.errorId,
        severity: report.severity,
        category: report.category,
        hasEmail: !!report.userEmail
      }, { componentPath: 'ErrorReporter' });

      // Send to API
      const response = await fetch('/api/admin/debug/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          level: 'info',
          message: `User error report: ${error.errorName}`,
          component_path: 'user-error-report',
          metadata: {
            errorReport: report,
            originalError: error
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit error report');
      }

      setIsSubmitted(true);
      onSubmit?.(report);

    } catch (err) {
      logger.error('Failed to submit error report', {
        error: err instanceof Error ? err.message : 'Unknown error',
        errorId: error.errorId
      }, { componentPath: 'ErrorReporter' });
      
      alert('Failed to submit error report. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    logger.info('User cancelled error report', {
      errorId: error.errorId
    }, { componentPath: 'ErrorReporter' });
    
    onCancel?.();
  };

  if (isSubmitted) {
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <div>
              <div className="font-medium">Error Report Submitted</div>
              <div className="text-sm text-green-700">
                Thank you for helping us improve the application. Your feedback has been received.
              </div>
            </div>
          </div>
          <Button
            onClick={handleCancel}
            variant="outline"
            className="mt-4 border-green-300 text-green-700 hover:bg-green-100"
          >
            Close
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <MessageSquare className="h-5 w-5" />
            Report an Error
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <div className="text-sm text-orange-700">
          Help us fix this issue by providing additional information about what happened.
        </div>

        {/* Error Summary */}
        <div className="p-3 bg-white rounded border">
          <div className="text-xs text-gray-500 mb-1">Error Details</div>
          <div className="font-mono text-sm">{error.errorName}</div>
          <div className="text-sm mt-1">{error.errorMessage}</div>
          {error.componentPath && (
            <div className="text-xs text-gray-500 mt-1">Component: {error.componentPath}</div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Email (optional)
            </label>
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={formData.userEmail || ''}
              onChange={(e) => handleInputChange('userEmail', e.target.value)}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              Only if you'd like us to follow up with you
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              What were you doing when this error occurred? *
            </label>
            <Textarea
              placeholder="Please describe the steps you took before this error appeared..."
              value={formData.userDescription || ''}
              onChange={(e) => handleInputChange('userDescription', e.target.value)}
              className="w-full min-h-[100px]"
              required
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium mb-1">
              How severe is this issue?
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high', 'critical'] as const).map((severity) => (
                <button
                  key={severity}
                  type="button"
                  onClick={() => handleInputChange('severity', severity)}
                  className={`px-3 py-1 rounded text-sm border transition-colors ${
                    formData.severity === severity
                      ? severityColors[severity]
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">
              What type of issue is this?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['ui', 'functionality', 'performance', 'security', 'other'] as const).map((category) => {
                const Icon = categoryIcons[category];
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleInputChange('category', category)}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-sm border transition-colors ${
                      formData.category === category
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Consent */}
          <div className="space-y-2">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={formData.consent || false}
                onChange={(e) => handleInputChange('consent', e.target.checked)}
                className="mt-1"
                required
              />
              <span className="text-sm text-gray-700">
                I consent to sharing this information with the development team for debugging purposes.
                This includes the error details, my description, and browser information.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Report
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Hook for easy integration with error boundaries
export function useErrorReporter() {
  const reportError = useCallback((error: ErrorReportData, options?: {
    onSubmit?: (report: ErrorReport) => void;
    onCancel?: () => void;
  }) => {
    // This would typically open a modal or navigate to an error reporting page
    // For now, we'll just log it and return the component
    logger.info('Error reporter invoked', {
      errorId: error.errorId,
      errorName: error.errorName
    }, { componentPath: 'useErrorReporter' });

    return {
      ErrorReporterComponent: (
        <ErrorReporter
          error={error}
          onSubmit={options?.onSubmit}
          onCancel={options?.onCancel}
        />
      )
    };
  }, []);

  return { reportError };
}

export default ErrorReporter;
