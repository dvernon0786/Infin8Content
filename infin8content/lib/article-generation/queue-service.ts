// Queue Service
// Story 4A-1: Article Generation Initiation and Queue Setup
// Tier-1 Producer story for article generation infrastructure

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

export interface QueueEntry {
  id: string;
  article_id: string;
  queue_position: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  worker_id?: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface QueueStatus {
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  averageWaitTime: number;
  maxConcurrent: number;
  currentLoad: number;
}

export interface QueueStatistics {
  totalProcessed: number;
  averageProcessingTime: number;
  successRate: number;
  throughputPerHour: number;
  peakQueueSize: number;
}

export class QueueService {
  private supabase: ReturnType<typeof createClient<Database>>;
  private maxConcurrent: number = 50; // NFR-P6: Up to 50 concurrent generations

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  async addToQueue(articleId: string, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<QueueEntry> {
    const { data, error } = await this.supabase
      .from('article_generation_queue')
      .insert({
        article_id: articleId,
        status: 'queued'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add to queue: ${error.message}`);
    }

    return data;
  }

  async getNextQueuedArticle(workerId?: string): Promise<QueueEntry | null> {
    // Check if we can process more articles
    const currentLoad = await this.getCurrentLoad();
    if (currentLoad >= this.maxConcurrent) {
      return null;
    }

    // Get the next queued article
    const { data, error } = await this.supabase
      .from('article_generation_queue')
      .select('*')
      .eq('status', 'queued')
      .order('queue_position', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No queued articles
      }
      throw new Error(`Failed to get next queued article: ${error.message}`);
    }

    // Mark as processing
    await this.markAsProcessing(data.id, workerId);

    return data;
  }

  async markAsProcessing(queueId: string, workerId?: string): Promise<void> {
    const { error } = await this.supabase
      .from('article_generation_queue')
      .update({
        status: 'processing',
        worker_id: workerId,
        started_at: new Date().toISOString()
      })
      .eq('id', queueId);

    if (error) {
      throw new Error(`Failed to mark as processing: ${error.message}`);
    }
  }

  async markAsCompleted(queueId: string, errorMessage?: string): Promise<void> {
    const updates: any = {
      status: 'completed',
      completed_at: new Date().toISOString()
    };

    if (errorMessage) {
      updates.status = 'failed';
      updates.error_message = errorMessage;
    }

    const { error } = await this.supabase
      .from('article_generation_queue')
      .update(updates)
      .eq('id', queueId);

    if (error) {
      throw new Error(`Failed to mark as completed: ${error.message}`);
    }
  }

  async markAsFailed(queueId: string, errorMessage: string): Promise<void> {
    const { error } = await this.supabase
      .from('article_generation_queue')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString()
      })
      .eq('id', queueId);

    if (error) {
      throw new Error(`Failed to mark as failed: ${error.message}`);
    }
  }

  async removeFromQueue(queueId: string): Promise<void> {
    const { error } = await this.supabase
      .from('article_generation_queue')
      .delete()
      .eq('id', queueId);

    if (error) {
      throw new Error(`Failed to remove from queue: ${error.message}`);
    }
  }

  async getQueueStatus(organizationId: string): Promise<QueueStatus> {
    const { data, error } = await this.supabase
      .rpc('get_queue_statistics', { org_uuid: organizationId });

    if (error) {
      throw new Error(`Failed to get queue status: ${error.message}`);
    }

    const stats = data[0] || {
      queued_count: 0,
      processing_count: 0,
      completed_count: 0,
      failed_count: 0,
      average_wait_time: null
    };

    const currentLoad = await this.getCurrentLoad();

    return {
      queued: stats.queued_count,
      processing: stats.processing_count,
      completed: stats.completed_count,
      failed: stats.failed_count,
      averageWaitTime: stats.average_wait_time ? 
        new Date(stats.average_wait_time).getTime() : 0,
      maxConcurrent: this.maxConcurrent,
      currentLoad
    };
  }

  async getQueuePosition(articleId: string): Promise<number | null> {
    const { data, error } = await this.supabase
      .from('article_generation_queue')
      .select('queue_position')
      .eq('article_id', articleId)
      .eq('status', 'queued')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get queue position: ${error.message}`);
    }

    return data?.queue_position || null;
  }

  async getQueuedArticles(organizationId: string, limit: number = 10): Promise<QueueEntry[]> {
    const { data, error } = await this.supabase
      .from('article_generation_queue')
      .select(`
        *,
        articles!inner(
          id,
          keyword,
          status,
          progress,
          created_at
        )
      `)
      .eq('status', 'queued')
      .eq('articles.organization_id', organizationId)
      .order('queue_position', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get queued articles: ${error.message}`);
    }

    return data || [];
  }

  async getProcessingArticles(organizationId: string): Promise<QueueEntry[]> {
    const { data, error } = await this.supabase
      .from('article_generation_queue')
      .select(`
        *,
        articles!inner(
          id,
          keyword,
          status,
          progress,
          current_section,
          created_at
        )
      `)
      .eq('status', 'processing')
      .eq('articles.organization_id', organizationId)
      .order('started_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get processing articles: ${error.message}`);
    }

    return data || [];
  }

  async cancelQueuedArticle(articleId: string): Promise<void> {
    // Get the queue entry
    const { data, error } = await this.supabase
      .from('article_generation_queue')
      .select('id')
      .eq('article_id', articleId)
      .eq('status', 'queued')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not in queue, nothing to cancel
        return;
      }
      throw new Error(`Failed to find queued article: ${error.message}`);
    }

    // Remove from queue
    await this.removeFromQueue(data.id);
  }

  async retryFailedArticle(articleId: string): Promise<void> {
    // Get the queue entry
    const { data, error } = await this.supabase
      .from('article_generation_queue')
      .select('id')
      .eq('article_id', articleId)
      .eq('status', 'failed')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Failed article not found in queue');
      }
      throw new Error(`Failed to find failed article: ${error.message}`);
    }

    // Reset to queued status
    const { error: updateError } = await this.supabase
      .from('article_generation_queue')
      .update({
        status: 'queued',
        worker_id: null,
        started_at: null,
        completed_at: null,
        error_message: null
      })
      .eq('id', data.id);

    if (updateError) {
      throw new Error(`Failed to retry article: ${updateError.message}`);
    }
  }

  async getCurrentLoad(): Promise<number> {
    const { data, error } = await this.supabase
      .from('article_generation_queue')
      .select('id')
      .eq('status', 'processing');

    if (error) {
      throw new Error(`Failed to get current load: ${error.message}`);
    }

    return data?.length || 0;
  }

  async getQueueStatistics(organizationId: string, hours: number = 24): Promise<QueueStatistics> {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await this.supabase
      .from('article_generation_queue')
      .select('*')
      .eq('status', 'completed')
      .gte('created_at', startTime)
      .eq('articles.organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to get queue statistics: ${error.message}`);
    }

    const completed = data || [];
    const totalProcessed = completed.length;
    
    const averageProcessingTime = completed.length > 0 
      ? completed.reduce((sum, entry) => {
          if (entry.started_at && entry.completed_at) {
            return sum + (new Date(entry.completed_at).getTime() - new Date(entry.started_at).getTime());
          }
          return sum;
        }, 0) / completed.length
      : 0;

    const successRate = completed.length > 0
      ? (completed.filter(entry => !entry.error_message).length / completed.length) * 100
      : 0;

    const throughputPerHour = totalProcessed / hours;

    // Get peak queue size
    const { data: peakData, error: peakError } = await this.supabase
      .from('article_generation_queue')
      .select('queue_position')
      .eq('articles.organization_id', organizationId)
      .order('queue_position', { ascending: false })
      .limit(1)
      .single();

    const peakQueueSize = peakError ? 0 : peakData?.queue_position || 0;

    return {
      totalProcessed,
      averageProcessingTime,
      successRate,
      throughputPerHour,
      peakQueueSize
    };
  }

  async optimizeQueue(): Promise<void> {
    // Remove stale processing entries (older than 1 hour)
    const staleTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: staleEntries, error } = await this.supabase
      .from('article_generation_queue')
      .select('id, article_id')
      .eq('status', 'processing')
      .lt('started_at', staleTime);

    if (error) {
      throw new Error(`Failed to get stale entries: ${error.message}`);
    }

    // Reset stale entries to queued
    for (const entry of staleEntries || []) {
      await this.supabase
        .from('article_generation_queue')
        .update({
          status: 'queued',
          worker_id: null,
          started_at: null,
          completed_at: null,
          error_message: 'Stale processing entry - reset to queued'
        })
        .eq('id', entry.id);
    }

    // Reassign queue positions
    await this.reassignQueuePositions();
  }

  private async reassignQueuePositions(): Promise<void> {
    // Get all queued entries ordered by creation time
    const { data, error } = await this.supabase
      .from('article_generation_queue')
      .select('id, created_at')
      .eq('status', 'queued')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get queued entries for repositioning: ${error.message}`);
    }

    // Update positions
    for (let i = 0; i < (data || []).length; i++) {
      const entry = data[i];
      await this.supabase
        .from('article_generation_queue')
        .update({ queue_position: i + 1 })
        .eq('id', entry.id);
    }
  }

  async getWorkerStatus(workerId: string): Promise<{
    currentArticle: QueueEntry | null;
    processedCount: number;
    averageProcessingTime: number;
    successRate: number;
  }> {
    // Get current article being processed
    const { data: currentData, error: currentError } = await this.supabase
      .from('article_generation_queue')
      .select(`
        *,
        articles!inner(
          id,
          keyword,
          status,
          progress
        )
      `)
      .eq('worker_id', workerId)
      .eq('status', 'processing')
      .single();

    const currentArticle = currentError ? null : currentData;

    // Get completed articles for this worker
    const { data: completedData, error: completedError } = await this.supabase
      .from('article_generation_queue')
      .select('*')
      .eq('worker_id', workerId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(100);

    if (completedError) {
      throw new Error(`Failed to get completed articles: ${completedError.message}`);
    }

    const completed = completedData || [];
    const processedCount = completed.length;
    
    const averageProcessingTime = completed.length > 0
      ? completed.reduce((sum, entry) => {
          if (entry.started_at && entry.completed_at) {
            return sum + (new Date(entry.completed_at).getTime() - new Date(entry.started_at).getTime());
          }
          return sum;
        }, 0) / completed.length
      : 0;

    const successRate = completed.length > 0
      ? (completed.filter(entry => !entry.error_message).length / completed.length) * 100
      : 0;

    return {
      currentArticle,
      processedCount,
      averageProcessingTime,
      successRate
    };
  }

  async setMaxConcurrent(maxConcurrent: number): Promise<void> {
    this.maxConcurrent = maxConcurrent;
  }

  async getMaxConcurrent(): Promise<number> {
    return this.maxConcurrent;
  }
}

// Singleton instance
export const queueService = new QueueService(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);