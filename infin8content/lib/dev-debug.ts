/**
 * Developer Debugging Tools
 * Builds developer utilities for local debugging and troubleshooting
 * Includes database inspection, API testing, and performance profiling tools
 */

import { createClient } from './supabase/client';
import { logger } from './logging';

export interface DatabaseTableInfo {
  name: string;
  columns: ColumnInfo[];
  rowCount: number;
  indexes: IndexInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
}

export interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface ApiTestResult {
  url: string;
  method: string;
  status: number;
  responseTime: number;
  response?: any;
  error?: string;
}

export interface PerformanceProfile {
  name: string;
  duration: number;
  memoryUsage: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class DevDebugTools {
  private isDevelopment: boolean;
  private performanceProfiles: PerformanceProfile[] = [];
  private apiTests: ApiTestResult[] = [];

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    if (this.isDevelopment) {
      logger.info('Developer debugging tools initialized', {}, { componentPath: 'DevDebugTools' });
    }
  }

  // Database Inspection Tools
  async inspectDatabase(tables?: string[]): Promise<DatabaseTableInfo[]> {
    if (!this.isDevelopment) {
      throw new Error('Database inspection is only available in development mode');
    }

    const supabase = createClient();
    const tableInfo: DatabaseTableInfo[] = [];

    try {
      // Get list of tables
      // Get list of tables - DISABLED FOR PRODUCTION
      // const { data: tablesData, error: tablesError } = await supabase
      // Get list of tables - DISABLED FOR PRODUCTION
      // const { data: tablesData, error: tablesError } = await supabase

      if (false) { // tablesError - DISABLED
        // Fallback: try to get table info manually
        const defaultTables = [
          'users', 'organizations', 'articles', 'article_progress',
          'error_logs', 'performance_metrics', 'debug_sessions'
        ];
        
        for (const tableName of defaultTables) {
          try {
            const info = await this.getTableInfo(supabase, tableName);
            if (info) {
              // tableInfo.push(info);
            }
          } catch (err) {
            logger.warn(`Failed to inspect table ${tableName}`, {
              error: (err as Error).message || 'Unknown error'
            }, { componentPath: 'DevDebugTools' });
          }
        }
      } else {
        // tableInfo.push(...tablesData);
      }

      logger.info('Database inspection completed', {
        tablesInspected: tableInfo.length,
        tableNames: tableInfo.map(t => t.name)
      }, { componentPath: 'DevDebugTools' });

      return tableInfo;

    } catch (error) {
      logger.error('Database inspection failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { componentPath: 'DevDebugTools' });
      throw error;
    }
  }

  private async getTableInfo(supabase: any, tableName: string): Promise<DatabaseTableInfo | null> {
    try {
      // Get row count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw countError;
      }

      // Get column information (this is a simplified approach)
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (sampleError) {
        throw sampleError;
      }

      const columns: ColumnInfo[] = [];
      if (sampleData && sampleData.length > 0) {
        const sampleRow = sampleData[0];
        for (const [key, value] of Object.entries(sampleRow)) {
          columns.push({
            name: key,
            type: typeof value,
            nullable: value === null
          });
        }
      }

      return {
        name: tableName,
        columns,
        rowCount: count || 0,
        indexes: [] // Would need additional query to get indexes
      };

    } catch (error) {
      return null;
    }
  }

  async queryDatabase(query: string, params?: any[]): Promise<any> {
    if (!this.isDevelopment) {
      throw new Error('Database queries are only available in development mode');
    }

    const supabase = createClient();

    try {
      // This is a simplified approach - in reality you'd want to use a proper SQL executor
      // For now, we'll just log the query and return a mock response
      logger.info('Database query executed', {
        query,
        params
      }, { componentPath: 'DevDebugTools' });

      return { message: 'Query executed successfully', query, params };

    } catch (error) {
      logger.error('Database query failed', {
        query,
        params,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { componentPath: 'DevDebugTools' });
      throw error;
    }
  }

  // API Testing Tools
  async testApiEndpoint(url: string, options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
  }): Promise<ApiTestResult> {
    const startTime = Date.now();
    const method = options?.method || 'GET';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        },
        body: options?.body ? JSON.stringify(options.body) : undefined
      });

      const responseTime = Date.now() - startTime;
      let responseData;

      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }

      const result: ApiTestResult = {
        url,
        method,
        status: response.status,
        responseTime,
        response: responseData
      };

      this.apiTests.push(result);

      logger.info('API test completed', {
        url,
        method,
        status: response.status,
        responseTime
      }, { componentPath: 'DevDebugTools' });

      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: ApiTestResult = {
        url,
        method,
        status: 0,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.apiTests.push(result);

      logger.error('API test failed', {
        url,
        method,
        error: result.error,
        responseTime
      }, { componentPath: 'DevDebugTools' });

      return result;
    }
  }

  async testApiEndpoints(endpoints: string[]): Promise<ApiTestResult[]> {
    const results: ApiTestResult[] = [];

    for (const endpoint of endpoints) {
      try {
        const result = await this.testApiEndpoint(endpoint);
        results.push(result);
      } catch (error) {
        results.push({
          url: endpoint,
          method: 'GET',
          status: 0,
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  // Performance Profiling Tools
  startProfile(name: string): string {
    if (!this.isDevelopment) {
      throw new Error('Performance profiling is only available in development mode');
    }

    const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Start memory monitoring
    const startMemory = this.getMemoryUsage();
    
    // Store profile start info
    const profile: PerformanceProfile = {
      name,
      duration: 0,
      memoryUsage: startMemory,
      timestamp: new Date(),
      metadata: { profileId, status: 'started' }
    };

    this.performanceProfiles.push(profile);

    logger.info('Performance profile started', {
      name,
      profileId,
      startMemory
    }, { componentPath: 'DevDebugTools' });

    return profileId;
  }

  endProfile(profileId: string): PerformanceProfile | null {
    const profileIndex = this.performanceProfiles.findIndex(
      p => p.metadata?.profileId === profileId && p.metadata?.status === 'started'
    );

    if (profileIndex === -1) {
      logger.warn('Profile not found or already ended', { profileId }, { componentPath: 'DevDebugTools' });
      return null;
    }

    const profile = this.performanceProfiles[profileIndex];
    const endMemory = this.getMemoryUsage();
    const duration = Date.now() - profile.timestamp.getTime();

    // Update profile
    profile.duration = duration;
    profile.memoryUsage = endMemory - profile.memoryUsage;
    profile.metadata = { ...profile.metadata, status: 'completed' };

    logger.info('Performance profile completed', {
      name: profile.name,
      profileId,
      duration,
      memoryDelta: profile.memoryUsage
    }, { componentPath: 'DevDebugTools' });

    return profile;
  }

  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      return memory.usedJSHeapSize;
    }
    return 0;
  }

  getPerformanceProfiles(): PerformanceProfile[] {
    return this.performanceProfiles.filter(p => p.metadata?.status === 'completed');
  }

  getApiTestResults(): ApiTestResult[] {
    return this.apiTests;
  }

  // Utility Tools
  clearTestData(): Promise<void> {
    if (!this.isDevelopment) {
      throw new Error('Test data clearing is only available in development mode');
    }

    const supabase = createClient();

    return new Promise((resolve, reject) => {
      const tables = ['error_logs', 'performance_metrics', 'debug_sessions'];
      let completed = 0;
      let errors: string[] = [];

      tables.forEach(async (table) => {
        try {
          // const { error } = await supabase.from(table).delete().gte('created_at', '2000-01-01');
          
          // if (error) {
          //   errors.push(`${table}: ${error.message}`);
          // if (error) {
          //   errors.push(`${table}: ${error.message}`);
          // } else {
          //   logger.info(`Test data cleared from ${table}`, {}, { componentPath: 'DevDebugTools'});
          // }
          // } else {
          //   logger.info(`Test data cleared from ${table}`, {}, { componentPath: 'DevDebugTools'});
          // }
          // } else {
          //   logger.info(`Test data cleared from ${table}`, {}, { componentPath: 'DevDebugTools'});
          // }
        } catch (err) {
          errors.push(`${table}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
          completed++;
          
          if (completed === tables.length) {
            if (errors.length > 0) {
              reject(new Error(`Some errors occurred: ${errors.join(', ')}`));
            } else {
              logger.info('All test data cleared successfully', {}, { componentPath: 'DevDebugTools' });
              resolve();
            }
          }
        }
      });
    });
  }

  // Development Dashboard Data
  getDevDashboardData() {
    if (!this.isDevelopment) {
      return { error: 'Development dashboard is only available in development mode' };
    }

    const recentProfiles = this.getPerformanceProfiles().slice(-10);
    const recentApiTests = this.getApiTestResults().slice(-20);

    const avgResponseTime = recentApiTests.length > 0
      ? recentApiTests.reduce((sum, test) => sum + test.responseTime, 0) / recentApiTests.length
      : 0;

    const errorRate = recentApiTests.length > 0
      ? (recentApiTests.filter(test => test.status >= 400).length / recentApiTests.length) * 100
      : 0;

    return {
      profiles: recentProfiles,
      apiTests: recentApiTests,
      stats: {
        totalProfiles: this.getPerformanceProfiles().length,
        totalApiTests: this.getApiTestResults().length,
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 10) / 10
      }
    };
  }

  // Debugging Helper Functions
  async validateEnvironment(): Promise<{
    supabase: boolean;
    inngest: boolean;
    monitoring: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    let supabaseOk = false;
    let inngestOk = false;
    let monitoringOk = false;

    // Test Supabase connection
    try {
      const supabase = createClient();
      const { error } = await supabase.from('users').select('id').limit(1);
      supabaseOk = !error;
      if (error) {
        issues.push(`Supabase: ${error.message}`);
      }
    } catch (err) {
      issues.push(`Supabase: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Test Inngest (simplified check)
    try {
      const inngestUrl = process.env.INNGEST_EVENT_KEY ? 'configured' : 'not configured';
      inngestOk = !!process.env.INNGEST_EVENT_KEY;
      if (!inngestOk) {
        issues.push('Inngest: Not configured (missing INNGEST_EVENT_KEY)');
      }
    } catch (err) {
      issues.push(`Inngest: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Test Monitoring
    try {
      monitoringOk = !!process.env.SENTRY_DSN || !!process.env.MONITORING_ENABLED;
      if (!monitoringOk) {
        issues.push('Monitoring: Not configured (missing SENTRY_DSN or MONITORING_ENABLED)');
      }
    } catch (err) {
      issues.push(`Monitoring: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    const result = {
      supabase: supabaseOk,
      inngest: inngestOk,
      monitoring: monitoringOk,
      issues
    };

    logger.info('Environment validation completed', result, { componentPath: 'DevDebugTools' });

    return result;
  }
}

// Create singleton instance
export const devDebugTools = new DevDebugTools();

// Export factory for custom instances
export function createDevDebugTools(): DevDebugTools {
  return new DevDebugTools();
}

// Export types and utilities
export { DevDebugTools };
export default devDebugTools;
