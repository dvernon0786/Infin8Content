/**
 * Database types generated for Supabase
 * Includes Story 22.1: Generation Progress Visualization enhancements
 * 
 * This file contains TypeScript definitions for all database tables and their relationships
 * Updated with new fields from migration: 20260113_enhance_progress_tracking_for_story_22_1.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      [_ in never]: never
    } & {
      article_progress: {
        Row: {
          id: string
          article_id: string
          org_id: string
          status: 'queued' | 'researching' | 'generating' | 'completed' | 'failed'
          progress_percentage: number
          current_section: number
          total_sections: number
          current_stage: string
          estimated_time_remaining: number | null
          word_count: number
          citations_count: number
          api_cost: number
          error_message: string | null
          // Story 22.1 enhanced fields
          parallel_sections: Json | null
          research_api_calls: number
          cache_hit_rate: number
          retry_attempts: number
          estimated_completion: string | null
          performance_metrics: Json | null
          research_phase: Json | null
          context_management: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          article_id: string
          org_id: string
          status?: 'queued' | 'researching' | 'generating' | 'completed' | 'failed'
          progress_percentage?: number
          current_section?: number
          total_sections?: number
          current_stage?: string
          estimated_time_remaining?: number | null
          word_count?: number
          citations_count?: number
          api_cost?: number
          error_message?: string | null
          // Story 22.1 enhanced fields
          parallel_sections?: Json | null
          research_api_calls?: number
          cache_hit_rate?: number
          retry_attempts?: number
          estimated_completion?: string | null
          performance_metrics?: Json | null
          research_phase?: Json | null
          context_management?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          article_id?: string
          org_id?: string
          status?: 'queued' | 'researching' | 'generating' | 'completed' | 'failed'
          progress_percentage?: number
          current_section?: number
          total_sections?: number
          current_stage?: string
          estimated_time_remaining?: number | null
          word_count?: number
          citations_count?: number
          api_cost?: number
          error_message?: string | null
          // Story 22.1 enhanced fields
          parallel_sections?: Json | null
          research_api_calls?: number
          cache_hit_rate?: number
          retry_attempts?: number
          estimated_completion?: string | null
          performance_metrics?: Json | null
          research_phase?: Json | null
          context_management?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'article_progress_article_id_fkey'
            columns: ['article_id']
            isOneToOne: true
            referencedRelation: 'articles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'article_progress_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }
      articles: {
        Row: {
          id: string
          keyword: string
          title: string | null
          status: 'queued' | 'generating' | 'completed' | 'failed' | 'cancelled'
          org_id: string
          user_id: string
          created_at: string
          updated_at: string
          content: string | null
          outline: Json | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          keyword: string
          title?: string | null
          status?: 'queued' | 'generating' | 'completed' | 'failed' | 'cancelled'
          org_id: string
          user_id: string
          created_at?: string
          updated_at?: string
          content?: string | null
          outline?: Json | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          keyword?: string
          title?: string | null
          status?: 'queued' | 'generating' | 'completed' | 'failed' | 'cancelled'
          org_id?: string
          user_id?: string
          updated_at?: string
          content?: string | null
          outline?: Json | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'articles_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'articles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      organizations: {
        Row: {
          id: string
          name: string
          plan: 'starter' | 'pro' | 'enterprise'
          payment_status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
          stripe_customer_id: string | null
        }
        Insert: {
          id?: string
          name: string
          plan?: 'starter' | 'pro' | 'enterprise'
          payment_status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          plan?: 'starter' | 'pro' | 'enterprise'
          payment_status?: 'active' | 'inactive' | 'suspended'
          updated_at?: string
          stripe_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'organizations_pkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: ''
            referencedColumns: []
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          org_id: string | null
          role: 'owner' | 'admin' | 'member'
          created_at: string
          updated_at: string
          auth_user_id: string
        }
        Insert: {
          id?: string
          email: string
          org_id?: string | null
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
          auth_user_id: string
        }
        Update: {
          id?: string
          email?: string
          org_id?: string | null
          role?: 'owner' | 'admin' | 'member'
          updated_at?: string
          auth_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'users_auth_user_id_fkey'
            columns: ['auth_user_id']
            isOneToOne: true
            referencedRelation: 'auth.users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'users_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    } & {
      enhanced_article_progress: {
        Row: {
          // All article_progress columns plus calculated fields
          id: string
          article_id: string
          org_id: string
          status: 'queued' | 'researching' | 'generating' | 'completed' | 'failed'
          progress_percentage: number
          current_section: number
          total_sections: number
          current_stage: string
          estimated_time_remaining: number | null
          word_count: number
          citations_count: number
          api_cost: number
          error_message: string | null
          parallel_sections: Json | null
          research_api_calls: number
          cache_hit_rate: number
          retry_attempts: number
          estimated_completion: string | null
          performance_metrics: Json | null
          research_phase: Json | null
          context_management: Json | null
          created_at: string
          updated_at: string
          // Calculated fields from view
          sections_completed_estimate: number
          active_parallel_sections: number
          performance_rating: 'excellent' | 'good' | 'fair' | 'needs_improvement'
          epic20_optimized: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'article_progress_article_id_fkey'
            columns: ['article_id']
            isOneToOne: true
            referencedRelation: 'articles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'article_progress_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Functions: {
      [_ in never]: never
    } & {
      get_parallel_section_progress: {
        Args: {
          article_uuid: string
        }
        Returns: {
          section_id: string
          section_type: string
          status: string
          progress: number
          start_time: string
          estimated_completion: string | null
          retry_count: number
          word_count: number
        }[]
      }
      update_parallel_section_status: {
        Args: {
          article_uuid: string
          section_id: string
          new_status: string
          new_progress?: number
          new_word_count?: number
        }
        Returns: boolean
      }
      update_performance_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Record<PropertyKey, never>
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

/**
 * Story 22.1: Generation Progress Visualization Types
 * Enhanced types for progress visualization components
 */

export interface ParallelSection {
  sectionId: string
  sectionType: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying'
  progress: number // 0-100
  startTime: string
  estimatedCompletion?: string
  retryCount?: number
  wordCount?: number
}

export interface PerformanceMetrics {
  researchApiCalls: number
  cacheHitRate: number
  retryAttempts: number
  totalApiCalls: number
  estimatedTimeRemaining: number // seconds
  costSavings: number // percentage
  timeSavings: number // percentage
}

export interface ResearchPhase {
  status: 'pending' | 'researching' | 'completed' | 'cached'
  apiCallsMade: number
  estimatedTotalCalls: number
  cacheHitRate: number
  keywords: string[]
  sourcesFound: number
}

export interface ContextManagement {
  tokensUsed: number
  tokenLimit: number
  cacheHits: number
  sectionsSummarized: number
  optimizationRate: number // percentage
}

/**
 * Enhanced article progress with Story 22.1 fields
 */
export interface EnhancedArticleProgress extends Omit<Database['public']['Tables']['article_progress']['Row'], 'parallel_sections' | 'performance_metrics' | 'research_phase' | 'context_management'> {
  parallelSections: ParallelSection[]
  performanceMetrics: PerformanceMetrics
  researchPhase: ResearchPhase
  contextManagement: ContextManagement
}