/**
 * Shared status configuration for article status indicators
 * Story 15.2: Visual Status Indicators
 */

import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  XCircle
} from 'lucide-react';

export interface StatusConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  ariaLabel: string;
  // Accessibility enhancements
  pattern: 'solid' | 'striped' | 'dotted' | 'dashed' | 'crossed';
  highContrastColor: string;
  // CSS pattern classes for colorblind accessibility
  patternClass: string;
}

export const statusConfigs: Record<string, StatusConfig> = {
  queued: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: React.createElement(Clock, { className: "h-4 w-4" }),
    label: 'Queued',
    variant: 'secondary',
    ariaLabel: 'Article status: queued',
    // Accessibility enhancements
    pattern: 'striped', // Visual pattern for colorblind users
    highContrastColor: 'text-blue-800',
    patternClass: 'bg-stripes-blue', // CSS pattern for colorblind accessibility
  },
  generating: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: React.createElement(Loader2, { className: "h-4 w-4 animate-spin" }),
    label: 'Generating',
    variant: 'default',
    ariaLabel: 'Article status: generating',
    // Accessibility enhancements
    pattern: 'dotted', // Visual pattern for colorblind users
    highContrastColor: 'text-orange-800',
    patternClass: 'bg-dots-orange', // CSS pattern for colorblind accessibility
  },
  completed: {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: React.createElement(CheckCircle, { className: "h-4 w-4" }),
    label: 'Completed',
    variant: 'outline',
    ariaLabel: 'Article status: completed',
    // Accessibility enhancements
    pattern: 'solid', // Visual pattern for colorblind users
    highContrastColor: 'text-green-800',
    patternClass: 'bg-solid-green', // CSS pattern for colorblind accessibility
  },
  failed: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: React.createElement(XCircle, { className: "h-4 w-4" }),
    label: 'Failed',
    variant: 'destructive',
    ariaLabel: 'Article status: failed',
    // Accessibility enhancements
    pattern: 'crossed', // Visual pattern for colorblind users
    highContrastColor: 'text-red-800',
    patternClass: 'bg-crossed-red', // CSS pattern for colorblind accessibility
  },
  cancelled: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: React.createElement(AlertCircle, { className: "h-4 w-4" }),
    label: 'Cancelled',
    variant: 'secondary',
    ariaLabel: 'Article status: cancelled',
    // Accessibility enhancements
    pattern: 'dashed', // Visual pattern for colorblind users
    highContrastColor: 'text-gray-800',
    patternClass: 'bg-dashed-gray', // CSS pattern for colorblind accessibility
  },
};

// Helper function to get status configuration
export function getStatusConfig(status: string): StatusConfig {
  return statusConfigs[status] || statusConfigs.queued;
}
