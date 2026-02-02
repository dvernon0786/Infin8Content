/**
 * Article Progress Tracker Service
 * Story 38.2: Track Article Generation Progress
 * 
 * Provides read-only access to article generation progress for intent workflows.
 * Tracks progress of articles through queued → generating → completed/failed states.
 * Supports filtering, pagination, and estimated completion time calculations.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'

export interface ProgressFilters {
  status?: 'queued' | 'generating' | 'completed' | 'failed'
  date_from?: string // ISO 8601
  date_to?: string // ISO 8601
  limit?: number
  offset?: number
}

export interface ArticleProgress {
  article_id: string
  subtopic_id?: string
  status: 'queued' | 'generating' | 'completed' | 'failed'
  progress_percent: number
  sections_completed: number
  sections_total: number
  current_section?: string
  estimated_completion_time?: string | null
  created_at: string
  started_at?: string | null
  completed_at?: string | null
  error?: {
    code: string
    message: string
    details: object
  } | null
  word_count?: number | null
  quality_score?: number | null
}

export interface ProgressResponse {
  workflow_id: string
  total_articles: number
  articles: ArticleProgress[]
  summary: {
    queued_count: number
    generating_count: number
    completed_count: number
    failed_count: number
    average_generation_time_seconds: number
    estimated_total_completion_time: string | null
  }
}

export interface WorkflowArticleData {
  id: string
  intent_workflow_id: string
  subtopic_id?: string
  status: string
  created_at: string
  updated_at: string
}

/**
 * Validates that the user has access to the specified workflow
 */
export async function validateWorkflowAccess(
  userId: string,
  workflowId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient()
  
  try {
    const { data: workflow, error: workflowError } = await supabase
      .from('intent_workflows')
      .select('organization_id')
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      return false
    }

    // Get user's organization
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('auth_user_id', userId)
      .single()

    if (userError || !user || user.org_id !== workflow.organization_id) {
      return false
    }

    return true
  } catch (error) {
    console.error('Error validating workflow access:', error)
    return false
  }
}

/**
 * Fetches progress data for a single article
 */
export async function getArticleProgress(articleId: string) {
  const supabase = createServiceRoleClient()
  
  try {
    const { data, error } = await supabase
      .from('article_progress')
      .select('*')
      .eq('article_id', articleId)
      .single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching article progress:', error)
    return null
  }
}

/**
 * Calculates estimated completion time for an in-progress article
 */
export function calculateEstimatedCompletion(article: {
  status: string
  progress_percentage: number
  current_section: number
  total_sections: number
  actual_time_spent: number
  updated_at: string
}): Date | null {
  // Only calculate for in-progress articles
  if (article.status !== 'generating' && article.status !== 'writing') {
    return null
  }

  const progress = article.progress_percentage || 0
  
  // If no progress yet, estimate based on average time per section
  if (progress === 0) {
    const avgTimePerSection = 60 // 60 seconds per section (adjustable)
    const remainingSections = article.total_sections - article.current_section + 1
    const estimatedRemainingTime = remainingSections * avgTimePerSection * 1000 // Convert to milliseconds
    
    return new Date(Date.now() + estimatedRemainingTime)
  }

  // Calculate based on current progress rate using updated_at as base time
  const timeSpent = article.actual_time_spent * 1000 // Convert to milliseconds
  const progressRate = timeSpent / progress // milliseconds per percent
  const remainingProgress = 100 - progress
  const estimatedRemainingTime = remainingProgress * progressRate

  return new Date(Date.now() + estimatedRemainingTime)
}

/**
 * Formats the progress response with summary statistics
 */
export function formatProgressResponse(
  articles: ArticleProgress[],
  workflowId: string
): ProgressResponse {
  const summary = {
    queued_count: 0,
    generating_count: 0,
    completed_count: 0,
    failed_count: 0,
    average_generation_time_seconds: 0,
    estimated_total_completion_time: null as string | null
  }

  const completedArticles = articles.filter(a => a.status === 'completed')
  const generatingArticles = articles.filter(a => a.status === 'generating')

  // Count by status
  articles.forEach(article => {
    switch (article.status) {
      case 'queued':
        summary.queued_count++
        break
      case 'generating':
        summary.generating_count++
        break
      case 'completed':
        summary.completed_count++
        break
      case 'failed':
        summary.failed_count++
        break
    }
  })

  // Calculate average generation time
  if (completedArticles.length > 0) {
    const totalTime = completedArticles.reduce((sum, article) => {
      if (article.started_at && article.completed_at) {
        const start = new Date(article.started_at).getTime()
        const end = new Date(article.completed_at).getTime()
        return sum + (end - start) / 1000 // Convert to seconds
      }
      return sum
    }, 0)
    summary.average_generation_time_seconds = totalTime / completedArticles.length
  }

  // Calculate estimated total completion time for generating articles
  if (generatingArticles.length > 0) {
    const completionTimes = generatingArticles
      .map(article => article.estimated_completion_time)
      .filter(time => time !== null)
      .map(time => {
        try {
          return new Date(time!).getTime()
        } catch {
          return null
        }
      })
      .filter((time): time is number => time !== null)

    if (completionTimes.length > 0) {
      const maxCompletionTime = Math.max(...completionTimes)
      summary.estimated_total_completion_time = new Date(maxCompletionTime).toISOString()
    }
  }

  return {
    workflow_id: workflowId,
    total_articles: articles.length,
    articles,
    summary
  }
}

/**
 * Fetches article progress data for a workflow with optional filtering
 */
export async function getWorkflowArticleProgress(
  workflowId: string,
  filters: ProgressFilters = {}
): Promise<ArticleProgress[]> {
  const supabase = createServiceRoleClient()
  
  try {
    // Build query for articles in the workflow
    let query = supabase
      .from('articles')
      .select(`
        id,
        intent_workflow_id,
        subtopic_id,
        status,
        created_at,
        updated_at,
        article_progress!inner(
          id,
          article_id,
          status,
          progress_percentage,
          current_section,
          total_sections,
          current_stage,
          estimated_time_remaining,
          actual_time_spent,
          word_count,
          error_message,
          metadata,
          created_at,
          updated_at
        )
      `)
      .eq('intent_workflow_id', workflowId)

    // Apply status filter
    if (filters.status) {
      query = query.in('article_progress.status', [filters.status])
    }

    // Apply date filters
    if (filters.date_from) {
      query = query.gte('articles.created_at', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('articles.created_at', filters.date_to)
    }

    // Apply ordering and pagination
    const limit = Math.min(filters.limit || 100, 1000) // Cap at 1000
    const offset = filters.offset || 0

    query = query
      .order('articles.created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    if (!data) {
      return []
    }

    // Transform data to match ArticleProgress interface
    const articles: ArticleProgress[] = data.map((item: any) => {
      const progress = item.article_progress
      if (!progress) {
        // Handle missing progress data
        return {
          article_id: item.id,
          subtopic_id: item.subtopic_id,
          status: 'queued',
          progress_percent: 0,
          sections_completed: 0,
          sections_total: 0,
          current_section: undefined,
          estimated_completion_time: null,
          created_at: item.created_at,
          started_at: null,
          completed_at: null,
          error: null,
          word_count: null,
          quality_score: null
        }
      }

      return {
        article_id: item.id,
        subtopic_id: item.subtopic_id,
        status: progress.status,
        progress_percent: progress.progress_percentage || 0,
        sections_completed: progress.current_section ? progress.current_section - 1 : 0,
        sections_total: progress.total_sections || 0,
        current_section: progress.current_stage,
        estimated_completion_time: progress.estimated_time_remaining 
          ? new Date(Date.now() + progress.estimated_time_remaining * 1000).toISOString()
          : null,
        created_at: item.created_at,
        started_at: progress.created_at,
        completed_at: progress.status === 'completed' ? progress.updated_at : null,
        error: progress.error_message ? {
          code: 'GENERATION_ERROR',
          message: progress.error_message,
          details: progress.metadata || {}
        } : null,
        word_count: progress.word_count,
        quality_score: null // Not tracked in current schema
      }
    })

    return articles
  } catch (error) {
    console.error('Error fetching workflow article progress:', error)
    throw error
  }
}
