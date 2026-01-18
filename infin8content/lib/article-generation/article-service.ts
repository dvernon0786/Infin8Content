// Article Service
// Story 4A-1: Article Generation Initiation and Queue Setup
// Tier-1 Producer story for article generation infrastructure

import { createClient } from '@supabase/supabase-js';

// Use any types temporarily to bypass compilation issues
// TODO: Generate proper database types after migration
export interface Database {
  public: any;
}

export interface Article {
  id: string;
  organization_id: string;
  user_id: string;
  keyword: string;
  title?: string;
  target_word_count: number;
  writing_style: string;
  target_audience: string;
  custom_instructions?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled' | 'queued';
  outline?: any;
  progress: number;
  retry_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
  outline_generation_duration_ms?: number;
  actual_completion_time?: string;
  current_section?: string;
}

export interface ArticleSection {
  id: string;
  article_id: string;
  section_type: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq';
  section_title: string;
  section_order: number;
  content?: string;
  word_count: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  research_data: Record<string, any>;
  citations: Array<{
    url: string;
    title: string;
    author?: string;
    publication_date?: string;
    excerpt?: string;
  }>;
  retry_count: number;
  max_retries: number;
  error_message?: string;
  processing_time_ms?: number;
  created_at: string;
  updated_at: string;
}

export interface ArticleGenerationRequest {
  keyword: string;
  target_word_count?: number;
  writing_style?: string;
  target_audience?: string;
  custom_instructions?: string;
}

export interface ArticleGenerationOptions {
  skip_queue?: boolean;
  priority?: 'low' | 'normal' | 'high';
  max_retries?: number;
  timeout_ms?: number;
}

export class ArticleService {
  private supabase: ReturnType<typeof createClient<Database>>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  async createArticle(
    organizationId: string,
    userId: string,
    request: ArticleGenerationRequest,
    options: ArticleGenerationOptions = {}
  ): Promise<Article> {
    const {
      keyword,
      target_word_count = 2000,
      writing_style = 'professional',
      target_audience = 'general',
      custom_instructions
    } = request;

    const {
      skip_queue = false,
      priority = 'normal',
      max_retries = 3,
      timeout_ms = 300000 // 5 minutes
    } = options;

    // Create article record
    const { data: article, error: articleError } = await this.supabase
      .from('articles')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        keyword,
        target_word_count,
        writing_style,
        target_audience,
        custom_instructions,
        status: skip_queue ? 'generating' : 'queued',
        progress: 0,
        retry_count: 0,
        max_retries,
        metadata: {
          priority,
          timeout_ms,
          created_via: 'article_service'
        },
        estimated_completion_time: this.calculateEstimatedCompletionTime(target_word_count)
      })
      .select()
      .single();

    if (articleError) {
      throw new Error(`Failed to create article: ${articleError.message}`);
    }

    // Add to generation queue if not skipping
    if (!skip_queue) {
      await this.addToQueue(article.id, priority);
    }

    return article;
  }

  async getArticle(articleId: string): Promise<Article | null> {
    const { data, error } = await this.supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get article: ${error.message}`);
    }

    return data;
  }

  async getArticles(
    organizationId: string,
    userId: string,
    filters: {
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Article[]> {
    let query = this.supabase
      .from('articles')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get articles: ${error.message}`);
    }

    return data || [];
  }

  async updateArticle(
    articleId: string,
    updates: Partial<Omit<Article, 'id' | 'organization_id' | 'user_id' | 'created_at'>>
  ): Promise<Article> {
    const { data, error } = await this.supabase
      .from('articles')
      .update(updates)
      .eq('id', articleId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update article: ${error.message}`);
    }

    return data;
  }

  async updateArticleStatus(
    articleId: string,
    status: Article['status'],
    errorMessage?: string
  ): Promise<Article> {
    const updates: Partial<Article> = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updates.actual_completion_time = new Date().toISOString();
      updates.progress = 100;
    }

    if (status === 'failed' && errorMessage) {
      updates.error_message = errorMessage;
    }

    return await this.updateArticle(articleId, updates);
  }

  async updateArticleProgress(
    articleId: string,
    progress: number,
    currentSection?: string
  ): Promise<Article> {
    return await this.updateArticle(articleId, {
      progress,
      current_section: currentSection,
      updated_at: new Date().toISOString()
    });
  }

  async incrementRetryCount(articleId: string): Promise<Article> {
    const article = await this.getArticle(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    return await this.updateArticle(articleId, {
      retry_count: article.retry_count + 1,
      updated_at: new Date().toISOString()
    });
  }

  async cancelArticle(articleId: string): Promise<Article> {
    // Update article status
    const article = await this.updateArticleStatus(articleId, 'cancelled');
    
    // Remove from queue if present
    await this.removeFromQueue(articleId);
    
    return article;
  }

  async deleteArticle(articleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('articles')
      .delete()
      .eq('id', articleId);

    if (error) {
      throw new Error(`Failed to delete article: ${error.message}`);
    }
  }

  async getArticleSections(articleId: string): Promise<ArticleSection[]> {
    const { data, error } = await this.supabase
      .from('article_sections')
      .select('*')
      .eq('article_id', articleId)
      .order('section_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to get article sections: ${error.message}`);
    }

    return data || [];
  }

  async createArticleSection(
    articleId: string,
    sectionType: ArticleSection['section_type'],
    sectionTitle: string,
    sectionOrder: number
  ): Promise<ArticleSection> {
    const { data, error } = await this.supabase
      .from('article_sections')
      .insert({
        article_id: articleId,
        section_type: sectionType,
        section_title: sectionTitle,
        section_order: sectionOrder,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create article section: ${error.message}`);
    }

    return data;
  }

  async updateArticleSection(
    sectionId: string,
    updates: Partial<Omit<ArticleSection, 'id' | 'article_id' | 'created_at'>>
  ): Promise<ArticleSection> {
    const { data, error } = await this.supabase
      .from('article_sections')
      .update(updates)
      .eq('id', sectionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update article section: ${error.message}`);
    }

    return data;
  }

  async getArticleUsage(
    organizationId: string,
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalArticles: number;
    totalCredits: number;
    averageGenerationTime: number;
    totalCost: number;
  }> {
    let query = this.supabase
      .from('article_usage')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('usage_date', startDate);
    }

    if (endDate) {
      query = query.lte('usage_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get article usage: ${error.message}`);
    }

    const usage = data || [];
    
    const totalArticles = usage.length;
    const totalCredits = usage.reduce((sum, record) => sum + record.credits_used, 0);
    const totalGenerationTime = usage.reduce((sum, record) => sum + (record.generation_time_ms || 0), 0);
    const totalCost = usage.reduce((sum, record) => sum + parseFloat(record.api_costs?.toString() || '0'), 0);

    return {
      totalArticles,
      totalCredits,
      averageGenerationTime: totalArticles > 0 ? totalGenerationTime / totalArticles : 0,
      totalCost
    };
  }

  async trackUsage(
    organizationId: string,
    userId: string,
    articleId: string,
    creditsUsed: number,
    generationTimeMs: number,
    apiCosts: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from('article_usage')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        article_id: articleId,
        credits_used: creditsUsed,
        generation_time_ms: generationTimeMs,
        api_costs: apiCosts,
        usage_date: new Date().toISOString().split('T')[0]
      });

    if (error) {
      throw new Error(`Failed to track usage: ${error.message}`);
    }
  }

  private async addToQueue(articleId: string, priority: string): Promise<void> {
    const { error } = await this.supabase
      .from('article_generation_queue')
      .insert({
        article_id: articleId,
        status: 'queued'
      });

    if (error) {
      throw new Error(`Failed to add to queue: ${error.message}`);
    }
  }

  private async removeFromQueue(articleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('article_generation_queue')
      .delete()
      .eq('article_id', articleId);

    if (error) {
      // Don't throw error if not in queue
      console.warn(`Failed to remove from queue: ${error.message}`);
    }
  }

  private calculateEstimatedCompletionTime(targetWordCount: number): string {
    // Estimate based on 100 words per minute
    const minutesPer100Words = 1;
    const totalMinutes = (targetWordCount / 100) * minutesPer100Words;
    const estimatedDate = new Date(Date.now() + totalMinutes * 60 * 1000);
    return estimatedDate.toISOString();
  }

  async getQueueStatus(organizationId: string): Promise<{
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    averageWaitTime: number;
  }> {
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

    return {
      queued: stats.queued_count,
      processing: stats.processing_count,
      completed: stats.completed_count,
      failed: stats.failed_count,
      averageWaitTime: stats.average_wait_time ? 
        new Date(stats.average_wait_time).getTime() : 0
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

  async retryFailedArticle(articleId: string): Promise<Article> {
    const article = await this.getArticle(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    if (article.status !== 'failed') {
      throw new Error('Article is not in failed status');
    }

    // Reset article status
    const updatedArticle = await this.updateArticle(articleId, {
      status: 'queued',
      progress: 0,
      current_section: undefined,
      error_message: undefined,
      retry_count: article.retry_count + 1
    });

    // Add back to queue
    await this.addToQueue(articleId, 'normal');

    return updatedArticle;
  }
}

// Singleton instance
export const articleService = new ArticleService(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);