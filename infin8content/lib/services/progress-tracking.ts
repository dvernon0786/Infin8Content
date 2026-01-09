/**
 * Progress tracking service for article generation
 * Story 4a.6: Real-Time Progress Tracking and Updates
 */

import { articleProgressService } from './progress';
import { calculateProgressPercentage, calculateEstimatedTimeRemaining } from '@/lib/config/progress-config';
import type { 
  ArticleProgress, 
  CreateArticleProgressParams, 
  UpdateArticleProgressParams,
  ProgressUpdate 
} from '@/types/article';

export class ProgressTrackingService {
  private articleId: string;
  private orgId: string;
  private totalSections: number;
  private startTime: number;

  constructor(articleId: string, orgId: string, totalSections: number) {
    this.articleId = articleId;
    this.orgId = orgId;
    this.totalSections = totalSections;
    this.startTime = Date.now();
  }

  /**
   * Initialize progress tracking for a new article generation
   */
  async initialize(initialStage: string = 'Queued for generation'): Promise<ArticleProgress> {
    const params: CreateArticleProgressParams = {
      article_id: this.articleId,
      org_id: this.orgId,
      status: 'queued',
      total_sections: this.totalSections,
      current_stage: initialStage,
    };

    return await articleProgressService.createProgress(params);
  }

  /**
   * Update progress to researching phase
   */
  async updateResearching(stage: string = 'Researching...'): Promise<void> {
    await this.updateProgress({
      status: 'researching',
      current_stage: stage,
      current_section: 1,
      progress_percentage: 5,
    });
  }

  /**
   * Update progress to writing phase for a specific section
   */
  async updateWritingSection(sectionNumber: number, stage: string): Promise<void> {
    const progressPercentage = calculateProgressPercentage(sectionNumber, this.totalSections, 'writing');
    
    await this.updateProgress({
      status: 'writing',
      current_section: sectionNumber,
      current_stage: stage,
      progress_percentage: progressPercentage,
    });
  }

  /**
   * Update progress to generating phase
   */
  async updateGenerating(stage: string = 'Generating content...'): Promise<void> {
    await this.updateProgress({
      status: 'generating',
      current_stage: stage,
      progress_percentage: 90,
    });
  }

  /**
   * Mark a section as completed with statistics
   */
  async completeSection(
    sectionNumber: number, 
    wordCount: number, 
    citations: number, 
    apiCost: number
  ): Promise<void> {
    const currentProgress = await articleProgressService.getProgress(this.articleId);
    if (!currentProgress) return;

    const progressPercentage = calculateProgressPercentage(sectionNumber, this.totalSections, 'writing');

    await this.updateProgress({
      current_section: sectionNumber + 1,
      word_count: currentProgress.word_count + wordCount,
      citations_count: currentProgress.citations_count + citations,
      api_cost: currentProgress.api_cost + apiCost,
      progress_percentage: Math.min(progressPercentage, 95),
    });
  }

  /**
   * Update progress with real-time metrics
   */
  async updateMetrics(wordCount: number, citations: number, apiCost: number): Promise<void> {
    await this.updateProgress({
      word_count: wordCount,
      citations_count: citations,
      api_cost: apiCost,
    });
  }

  /**
   * Update estimated time remaining
   */
  async updateEstimatedTime(estimatedSeconds: number): Promise<void> {
    await this.updateProgress({
      estimated_time_remaining: estimatedSeconds,
    });
  }

  /**
   * Mark generation as completed with final statistics
   */
  async complete(finalStats: {
    wordCount: number;
    citations: number;
    apiCost: number;
  }): Promise<void> {
    const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
    
    await articleProgressService.markCompleted(this.articleId, {
      word_count: finalStats.wordCount,
      citations_count: finalStats.citations,
      api_cost: finalStats.apiCost,
      total_time_seconds: totalTime,
    });
  }

  /**
   * Mark generation as failed with error message
   */
  async fail(errorMessage: string): Promise<void> {
    await articleProgressService.markFailed(this.articleId, errorMessage);
  }

  /**
   * Generic progress update method
   */
  private async updateProgress(updates: Partial<ProgressUpdate>): Promise<void> {
    const currentProgress = await articleProgressService.getProgress(this.articleId);
    if (!currentProgress) return;

    const progressUpdate: ProgressUpdate = {
      article_id: this.articleId,
      status: updates.status || currentProgress.status,
      current_section: updates.current_section || currentProgress.current_section,
      total_sections: this.totalSections,
      progress_percentage: updates.progress_percentage || currentProgress.progress_percentage,
      current_stage: updates.current_stage || currentProgress.current_stage,
      estimated_time_remaining: updates.estimated_time_remaining ?? currentProgress.estimated_time_remaining,
      word_count: updates.word_count ?? currentProgress.word_count,
      citations_count: updates.citations_count ?? currentProgress.citations_count,
      api_cost: updates.api_cost ?? currentProgress.api_cost,
      error_message: updates.error_message ?? currentProgress.error_message,
    };

    await articleProgressService.updateProgressPartial(this.articleId, progressUpdate);
  }

  /**
   * Get current progress
   */
  async getCurrentProgress(): Promise<ArticleProgress | null> {
    return await articleProgressService.getProgress(this.articleId);
  }

  /**
   * Calculate estimated time remaining based on current progress
   */
  async calculateEstimatedTime(): Promise<number | null> {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const currentProgress = await this.getCurrentProgress();
    
    if (elapsed > 0 && currentProgress) {
      return calculateEstimatedTimeRemaining(elapsed, currentProgress.progress_percentage);
    }
    
    return null;
  }
}

/**
 * Factory function to create a progress tracker for article generation
 */
export function createProgressTracker(
  articleId: string, 
  orgId: string, 
  totalSections: number
): ProgressTrackingService {
  return new ProgressTrackingService(articleId, orgId, totalSections);
}
