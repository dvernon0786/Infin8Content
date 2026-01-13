/**
 * Bulk operations service for multi-article management
 * Story 23.1: Multi-article Management Interface
 */

import { z } from 'zod';

// Types for bulk operations
export type BulkOperationType = 'delete' | 'export' | 'archive' | 'status_change' | 'assign';
export type ExportFormat = 'csv' | 'pdf';

export interface BulkOperationRequest {
  operation: BulkOperationType;
  articleIds: string[];
  format?: ExportFormat;
  status?: string;
  assigneeId?: string;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  message: string;
  errors?: Array<{ id: string; error: string }>;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
}

class BulkOperationsService {
  private baseUrl = '/api/articles/bulk';

  /**
   * Execute a bulk operation
   */
  async executeBulkOperation(request: BulkOperationRequest): Promise<BulkOperationResult> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle different response types
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/csv') || contentType?.includes('text/plain')) {
        // This is an export operation - trigger download
        const blob = await response.blob();
        const filename = this.getExportFilename(request.format || 'csv');
        this.downloadFile(blob, filename);
        
        return {
          success: true,
          processed: request.articleIds.length,
          message: `Successfully exported ${request.articleIds.length} articles`,
        };
      }

      const result = await response.json();
      return {
        success: result.success || false,
        processed: result.deleted || result.archived || result.updated || result.assigned || 0,
        message: result.message || 'Operation completed',
      };
    } catch (error) {
      console.error('Bulk operation failed:', error);
      return {
        success: false,
        processed: 0,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Delete multiple articles
   */
  async deleteArticles(articleIds: string[]): Promise<BulkOperationResult> {
    return this.executeBulkOperation({
      operation: 'delete',
      articleIds,
    });
  }

  /**
   * Export articles in specified format
   */
  async exportArticles(articleIds: string[], format: ExportFormat): Promise<BulkOperationResult> {
    return this.executeBulkOperation({
      operation: 'export',
      articleIds,
      format,
    });
  }

  /**
   * Archive multiple articles
   */
  async archiveArticles(articleIds: string[]): Promise<BulkOperationResult> {
    return this.executeBulkOperation({
      operation: 'archive',
      articleIds,
    });
  }

  /**
   * Change status of multiple articles
   */
  async changeStatus(articleIds: string[], status: string): Promise<BulkOperationResult> {
    return this.executeBulkOperation({
      operation: 'status_change',
      articleIds,
      status,
    });
  }

  /**
   * Assign articles to a team member
   */
  async assignArticles(articleIds: string[], assigneeId?: string): Promise<BulkOperationResult> {
    return this.executeBulkOperation({
      operation: 'assign',
      articleIds,
      assigneeId,
    });
  }

  /**
   * Get available team members for assignment
   */
  async getTeamMembers(): Promise<TeamMember[]> {
    try {
      const response = await fetch('/api/team/members');
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      return [];
    }
  }

  /**
   * Validate bulk operation request
   */
  validateRequest(request: BulkOperationRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate article IDs
    if (!request.articleIds || request.articleIds.length === 0) {
      errors.push('At least one article ID is required');
    }

    if (request.articleIds.length > 100) {
      errors.push('Cannot process more than 100 articles at once');
    }

    // Validate operation-specific requirements
    switch (request.operation) {
      case 'export':
        if (!request.format || !['csv', 'pdf'].includes(request.format)) {
          errors.push('Valid export format (csv or pdf) is required');
        }
        break;
      case 'status_change':
        if (!request.status) {
          errors.push('Status is required for status change operation');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate filename for export downloads
   */
  private getExportFilename(format: ExportFormat): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = format === 'csv' ? 'csv' : 'txt'; // PDF exports as text for now
    return `articles-export-${timestamp}.${extension}`;
  }

  /**
   * Trigger file download
   */
  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Retry failed operation with subset of article IDs
   */
  async retryFailedOperation(
    request: BulkOperationRequest,
    failedIds: string[]
  ): Promise<BulkOperationResult> {
    if (failedIds.length === 0) {
      return {
        success: true,
        processed: 0,
        message: 'No failed articles to retry',
      };
    }

    const retryRequest = { ...request, articleIds: failedIds };
    return this.executeBulkOperation(retryRequest);
  }

  /**
   * Get operation progress (for long-running operations)
   */
  async getOperationProgress(operationId: string): Promise<{
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    processed: number;
    total: number;
  }> {
    try {
      const response = await fetch(`/api/articles/bulk/progress/${operationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch operation progress');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch operation progress:', error);
      return {
        status: 'failed',
        progress: 0,
        processed: 0,
        total: 0,
      };
    }
  }
}

// Export singleton instance
export const bulkOperationsService = new BulkOperationsService();
