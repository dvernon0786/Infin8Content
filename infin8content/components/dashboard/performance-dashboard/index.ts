/**
 * Performance Dashboard Components Index
 * Story 22.2: Performance Metrics Dashboard
 * 
 * Exports all performance dashboard components for easy importing.
 */

export { default as PerformanceDashboard } from './performance-dashboard';
export type { 
  PerformanceMetricsResponse,
  GenerationMetrics,
  ResearchMetrics,
  ContextMetrics,
  SystemHealth,
  HistoricalTrends,
  PerformanceAlert
} from './performance-dashboard';

export { default as GenerationMetricsCard } from './generation-metrics-card';

export { default as ResearchMetricsCard } from './research-metrics-card';

export { default as ContextMetricsCard } from './context-metrics-card';

export { default as SystemHealthCard } from './system-health-card';

export { default as PerformanceAlerts } from './performance-alerts';

export { default as HistoricalTrendsChart } from './historical-trends-chart';
