// API Cost Tracker
// Story 3.0: Research Infrastructure Foundation
// Tier-1 Producer story for research data structures

import { researchService } from './research-service';

export interface ApiCostRecord {
  organizationId: string;
  userId: string;
  apiSource: string;
  endpoint: string;
  cost: number;
  timestamp: string;
}

export interface ApiCostSummary {
  totalCost: number;
  apiBreakdown: Record<string, number>;
  endpointBreakdown: Record<string, number>;
  dailyCosts: Record<string, number>;
  requestCount: number;
}

export interface CostThreshold {
  warning: number;
  critical: number;
  hardLimit: number;
}

export class ApiCostTracker {
  private static instance: ApiCostTracker;
  private costRecords: Map<string, ApiCostRecord[]> = new Map();
  private thresholds: Map<string, CostThreshold> = new Map();

  private constructor() {
    // Initialize default thresholds
    this.thresholds.set('dataforseo', {
      warning: 50.00,
      critical: 100.00,
      hardLimit: 250.00
    });

    this.thresholds.set('tavily', {
      warning: 25.00,
      critical: 50.00,
      hardLimit: 100.00
    });

    this.thresholds.set('default', {
      warning: 100.00,
      critical: 200.00,
      hardLimit: 500.00
    });
  }

  static getInstance(): ApiCostTracker {
    if (!ApiCostTracker.instance) {
      ApiCostTracker.instance = new ApiCostTracker();
    }
    return ApiCostTracker.instance;
  }

  async trackCost(
    organizationId: string,
    userId: string,
    apiSource: string,
    endpoint: string,
    cost: number
  ): Promise<void> {
    const record: ApiCostRecord = {
      organizationId,
      userId,
      apiSource,
      endpoint,
      cost,
      timestamp: new Date().toISOString()
    };

    // Store in memory
    const key = this.generateKey(organizationId, userId);
    if (!this.costRecords.has(key)) {
      this.costRecords.set(key, []);
    }
    this.costRecords.get(key)!.push(record);

    // Store in database
    await researchService.trackApiUsage(organizationId, userId, apiSource, endpoint, cost);

    // Check thresholds
    await this.checkThresholds(organizationId, apiSource);
  }

  async getCostSummary(
    organizationId: string,
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiCostSummary> {
    const usage = await researchService.getApiUsage(organizationId, userId, startDate, endDate);

    const totalCost = usage.reduce((sum, record) => sum + record.total_cost, 0);
    const requestCount = usage.reduce((sum, record) => sum + record.request_count, 0);

    const apiBreakdown = usage.reduce((breakdown, record) => {
      breakdown[record.api_source] = (breakdown[record.api_source] || 0) + record.total_cost;
      return breakdown;
    }, {} as Record<string, number>);

    const endpointBreakdown = usage.reduce((breakdown, record) => {
      const key = `${record.api_source}:${record.endpoint}`;
      breakdown[key] = (breakdown[key] || 0) + record.total_cost;
      return breakdown;
    }, {} as Record<string, number>);

    const dailyCosts = usage.reduce((breakdown, record) => {
      breakdown[record.usage_date] = (breakdown[record.usage_date] || 0) + record.total_cost;
      return breakdown;
    }, {} as Record<string, number>);

    return {
      totalCost,
      apiBreakdown,
      endpointBreakdown,
      dailyCosts,
      requestCount
    };
  }

  async getMonthlyCosts(
    organizationId: string,
    userId: string,
    year: number,
    month: number
  ): Promise<ApiCostSummary> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

    return await this.getCostSummary(organizationId, userId, startDate, endDate);
  }

  async getDailyCosts(
    organizationId: string,
    userId: string,
    date: string
  ): Promise<ApiCostSummary> {
    return await this.getCostSummary(organizationId, userId, date, date);
  }

  async checkThresholds(organizationId: string, apiSource: string): Promise<{
    status: 'ok' | 'warning' | 'critical' | 'exceeded';
    currentCost: number;
    threshold: CostThreshold;
  }> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const summary = await this.getMonthlyCosts(organizationId, '', new Date().getFullYear(), new Date().getMonth() + 1);
    
    const threshold = this.thresholds.get(apiSource) || this.thresholds.get('default')!;
    const currentCost = summary.apiBreakdown[apiSource] || 0;

    let status: 'ok' | 'warning' | 'critical' | 'exceeded' = 'ok';

    if (currentCost >= threshold.hardLimit) {
      status = 'exceeded';
    } else if (currentCost >= threshold.critical) {
      status = 'critical';
    } else if (currentCost >= threshold.warning) {
      status = 'warning';
    }

    return { status, currentCost, threshold };
  }

  setThreshold(apiSource: string, threshold: CostThreshold): void {
    this.thresholds.set(apiSource, threshold);
  }

  getThreshold(apiSource: string): CostThreshold {
    return this.thresholds.get(apiSource) || this.thresholds.get('default')!;
  }

  async getCostProjection(
    organizationId: string,
    userId: string,
    apiSource: string
  ): Promise<{
    projectedMonthlyCost: number;
    projectedDailyCost: number;
    confidence: 'high' | 'medium' | 'low';
  }> {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const summary = await this.getMonthlyCosts(organizationId, userId, currentYear, currentMonth + 1);
    const currentCost = summary.apiBreakdown[apiSource] || 0;

    const projectedMonthlyCost = (currentCost / dayOfMonth) * daysInMonth;
    const projectedDailyCost = currentCost / dayOfMonth;

    // Confidence based on days of data available
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (dayOfMonth >= 20) {
      confidence = 'high';
    } else if (dayOfMonth >= 10) {
      confidence = 'medium';
    }

    return {
      projectedMonthlyCost,
      projectedDailyCost,
      confidence
    };
  }

  async getCostEfficiencyMetrics(
    organizationId: string,
    userId: string
  ): Promise<{
    costPerKeyword: number;
    costPerSource: number;
    cacheHitRate: number;
    totalRequests: number;
    totalCost: number;
  }> {
    const summary = await this.getCostSummary(organizationId, userId);
    
    // These would need to be calculated based on actual usage patterns
    // For now, we'll provide placeholder calculations
    const totalKeywords = summary.endpointBreakdown['dataforseo:research'] || 0;
    const totalSources = summary.endpointBreakdown['tavily:research'] || 0;
    const totalRequests = summary.requestCount;
    const totalCost = summary.totalCost;

    const costPerKeyword = totalKeywords > 0 ? totalCost / totalKeywords : 0;
    const costPerSource = totalSources > 0 ? totalCost / totalSources : 0;
    
    // Cache hit rate would need to be tracked separately
    const cacheHitRate = 0.75; // Placeholder

    return {
      costPerKeyword,
      costPerSource,
      cacheHitRate,
      totalRequests,
      totalCost
    };
  }

  private generateKey(organizationId: string, userId: string): string {
    return `${organizationId}:${userId}`;
  }

  async exportCostData(
    organizationId: string,
    userId: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const usage = await researchService.getApiUsage(organizationId, userId);
    
    if (format === 'csv') {
      const headers = ['Date', 'API Source', 'Endpoint', 'Requests', 'Cost'];
      const rows = usage.map(record => [
        record.usage_date,
        record.api_source,
        record.endpoint,
        record.request_count.toString(),
        record.total_cost.toFixed(6)
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else {
      return JSON.stringify(usage, null, 2);
    }
  }

  getMemoryUsage(): {
    recordCount: number;
    memoryUsage: number;
  } {
    let recordCount = 0;
    for (const records of this.costRecords.values()) {
      recordCount += records.length;
    }

    // Rough estimation of memory usage
    const memoryUsage = recordCount * 200; // ~200 bytes per record

    return {
      recordCount,
      memoryUsage
    };
  }

  clearMemoryCache(): void {
    this.costRecords.clear();
  }

  destroy(): void {
    this.costRecords.clear();
    this.thresholds.clear();
  }
}

// Singleton instance
export const apiCostTracker = ApiCostTracker.getInstance();
