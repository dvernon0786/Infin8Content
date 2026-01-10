/**
 * Article progress service for database operations
 * Story 4a.6: Real-Time Progress Tracking and Updates
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { 
  ArticleProgress, 
  CreateArticleProgressParams, 
  UpdateArticleProgressParams,
  ProgressUpdate 
} from '@/types/article';

export class ArticleProgressService {
  private supabase: any;

  constructor() {
    // Initialize as null, will be created when needed
    this.supabase = null;
  }

  private async getClient() {
    if (!this.supabase) {
      this.supabase = createServiceRoleClient();
    }
    return this.supabase;
  }

  /**
   * Create a new progress tracking record (or update if exists)
   */
  async createProgress(params: CreateArticleProgressParams): Promise<ArticleProgress> {
    const client = await this.getClient();
    const { data, error } = await client
      .from('article_progress')
      .upsert({
        article_id: params.article_id,
        org_id: params.org_id,
        status: params.status,
        current_section: 1,
        total_sections: params.total_sections,
        progress_percentage: 0,
        current_stage: params.current_stage,
        metadata: params.metadata || {},
      }, {
        onConflict: 'article_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating article progress:', error);
      throw new Error(`Failed to create progress: ${error.message}`);
    }

    return data;
  }

  /**
   * Get progress for a specific article
   */
  async getProgress(articleId: string): Promise<ArticleProgress | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from('article_progress')
      .select('*')
      .eq('article_id', articleId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching article progress:', error);
      throw new Error(`Failed to fetch progress: ${error.message}`);
    }

    return data;
  }

  /**
   * Update progress for an article
   */
  async updateProgress(
    articleId: string, 
    updates: UpdateArticleProgressParams
  ): Promise<ArticleProgress> {
    // Calculate progress percentage if not provided
    let progressPercentage = updates.progress_percentage;
    if (progressPercentage === undefined && updates.current_section !== undefined) {
      const current = await this.getProgress(articleId);
      if (current) {
        progressPercentage = (updates.current_section / current.total_sections) * 100;
      }
    }

    const client = await this.getClient();
    const { data, error } = await client
      .from('article_progress')
      .update({
        ...updates,
        progress_percentage: progressPercentage,
        updated_at: new Date().toISOString(),
      })
      .eq('article_id', articleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating article progress:', error);
      throw new Error(`Failed to update progress: ${error.message}`);
    }

    return data;
  }

  /**
   * Update progress with partial data (for real-time updates)
   */
  async updateProgressPartial(articleId: string, update: ProgressUpdate): Promise<void> {
    const client = await this.getClient();
    const { error } = await client
      .from('article_progress')
      .update({
        status: update.status,
        current_section: update.current_section,
        progress_percentage: update.progress_percentage,
        current_stage: update.current_stage,
        estimated_time_remaining: update.estimated_time_remaining,
        word_count: update.word_count,
        citations_count: update.citations_count,
        api_cost: update.api_cost,
        error_message: update.error_message,
        updated_at: new Date().toISOString(),
      })
      .eq('article_id', articleId);

    if (error) {
      console.error('Error updating article progress partially:', error);
      throw new Error(`Failed to update progress: ${error.message}`);
    }
  }

  /**
   * Mark article as completed with final statistics
   */
  async markCompleted(
    articleId: string, 
    statistics: {
      word_count: number;
      citations_count: number;
      api_cost: number;
      total_time_seconds: number;
    }
  ): Promise<ArticleProgress> {
    const current = await this.getProgress(articleId);
    if (!current) {
      throw new Error('Progress record not found');
    }

    return this.updateProgress(articleId, {
      status: 'completed',
      progress_percentage: 100,
      current_section: current.total_sections,
      current_stage: 'Completed',
      estimated_time_remaining: 0,
      actual_time_spent: statistics.total_time_seconds,
      word_count: statistics.word_count,
      citations_count: statistics.citations_count,
      api_cost: statistics.api_cost,
      error_message: null,
    });
  }

  /**
   * Mark article as failed with error message
   */
  async markFailed(articleId: string, errorMessage: string): Promise<ArticleProgress> {
    return this.updateProgress(articleId, {
      status: 'failed',
      current_stage: 'Failed',
      error_message: errorMessage,
    });
  }

  /**
   * Delete progress record (typically after article completion)
   */
  async deleteProgress(articleId: string): Promise<void> {
    const client = await this.getClient();
    const { error } = await client
      .from('article_progress')
      .delete()
      .eq('article_id', articleId);

    if (error) {
      console.error('Error deleting article progress:', error);
      throw new Error(`Failed to delete progress: ${error.message}`);
    }
  }

  /**
   * Get all progress records for an organization
   */
  async getOrgProgress(orgId: string): Promise<ArticleProgress[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from('article_progress')
      .select('*')
      .eq('org_id', orgId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching org progress:', error);
      throw new Error(`Failed to fetch org progress: ${error.message}`);
    }

    return data || [];
  }
}

// Singleton instance
export const articleProgressService = new ArticleProgressService();
