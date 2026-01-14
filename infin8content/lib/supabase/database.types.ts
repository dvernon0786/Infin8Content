export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          article_id: string | null
          activity_type: string
          activity_data: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id?: string
          user_id?: string
          article_id?: string | null
          activity_type?: string
          activity_data?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          article_id?: string | null
          activity_type?: string
          activity_data?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      api_costs: {
        Row: {
          id: string
          organization_id: string
          service: string
          operation: string
          cost: number
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id?: string
          service?: string
          operation?: string
          cost?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          service?: string
          operation?: string
          cost?: number
          created_at?: string | null
        }
        Relationships: []
      }
      article_progress: {
        Row: {
          id: string
          article_id: string | null
          org_id: string | null
          status: string
          current_section: number | null
          total_sections: number
          progress_percentage: number | null
          current_stage: string
          estimated_time_remaining: number | null
          actual_time_spent: number | null
          word_count: number | null
          citations_count: number | null
          api_cost: number | null
          error_message: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
          parallel_sections: Json | null
          research_api_calls: number | null
          cache_hit_rate: number | null
          retry_attempts: number | null
          estimated_completion: string | null
          performance_metrics: Json | null
          research_phase: Json | null
          context_management: Json | null
        }
        Insert: {
          id?: string
          article_id?: string | null
          org_id?: string | null
          status?: string
          current_section?: number | null
          total_sections?: number
          progress_percentage?: number | null
          current_stage?: string
          estimated_time_remaining?: number | null
          actual_time_spent?: number | null
          word_count?: number | null
          citations_count?: number | null
          api_cost?: number | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          parallel_sections?: Json | null
          research_api_calls?: number | null
          cache_hit_rate?: number | null
          retry_attempts?: number | null
          estimated_completion?: string | null
          performance_metrics?: Json | null
          research_phase?: Json | null
          context_management?: Json | null
        }
        Update: {
          id?: string
          article_id?: string | null
          org_id?: string | null
          status?: string
          current_section?: number | null
          total_sections?: number
          progress_percentage?: number | null
          current_stage?: string
          estimated_time_remaining?: number | null
          actual_time_spent?: number | null
          word_count?: number | null
          citations_count?: number | null
          api_cost?: number | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          parallel_sections?: Json | null
          research_api_calls?: number | null
          cache_hit_rate?: number | null
          retry_attempts?: number | null
          estimated_completion?: string | null
          performance_metrics?: Json | null
          research_phase?: Json | null
          context_management?: Json | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          id: string
          org_id: string
          title: string | null
          keyword: string
          status: string
          target_word_count: number
          writing_style: string | null
          target_audience: string | null
          custom_instructions: string | null
          inngest_event_id: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          outline: Json | null
          sections: Json | null
          current_section_index: number | null
          generation_started_at: string | null
          generation_completed_at: string | null
          error_details: Json | null
          outline_generation_duration_ms: number | null
        }
        Insert: {
          id?: string
          org_id?: string
          title?: string | null
          keyword?: string
          status?: string
          target_word_count?: number
          writing_style?: string | null
          target_audience?: string | null
          custom_instructions?: string | null
          inngest_event_id?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          outline?: Json | null
          sections?: Json | null
          current_section_index?: number | null
          generation_started_at?: string | null
          generation_completed_at?: string | null
          error_details?: Json | null
          outline_generation_duration_ms?: number | null
        }
        Update: {
          id?: string
          org_id?: string
          title?: string | null
          keyword?: string
          status?: string
          target_word_count?: number
          writing_style?: string | null
          target_audience?: string | null
          custom_instructions?: string | null
          inngest_event_id?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          outline?: Json | null
          sections?: Json | null
          current_section_index?: number | null
          generation_started_at?: string | null
          generation_completed_at?: string | null
          error_details?: Json | null
          outline_generation_duration_ms?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          created_at: string | null
          org_id: string
          user_id: string | null
          action: string
          details: Json | null
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          org_id?: string
          user_id?: string | null
          action?: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          org_id?: string
          user_id?: string | null
          action?: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      keyword_researches: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          keyword: string
          results: Json
          api_cost: number
          cached_until: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id?: string
          user_id?: string
          keyword?: string
          results?: Json
          api_cost?: number
          cached_until?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          keyword?: string
          results?: Json
          api_cost?: number
          cached_until?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          plan: string
          white_label_settings: Json | null
          created_at: string | null
          updated_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          payment_status: string | null
          payment_confirmed_at: string | null
          grace_period_started_at: string | null
          suspended_at: string | null
        }
        Insert: {
          id?: string
          name?: string
          plan?: string
          white_label_settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          payment_status?: string | null
          payment_confirmed_at?: string | null
          grace_period_started_at?: string | null
          suspended_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          plan?: string
          white_label_settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          payment_status?: string | null
          payment_confirmed_at?: string | null
          grace_period_started_at?: string | null
          suspended_at?: string | null
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          id: string
          user_id: string
          email: string
          code: string
          expires_at: string
          verified_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string
          email?: string
          code?: string
          expires_at?: string
          verified_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          code?: string
          expires_at?: string
          verified_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      serp_analyses: {
        Row: {
          id: string
          organization_id: string
          keyword: string
          analysis_data: Json
          cached_until: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id?: string
          keyword?: string
          analysis_data?: Json
          cached_until?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          keyword?: string
          analysis_data?: Json
          cached_until?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          id: string
          stripe_event_id: string
          event_type: string
          organization_id: string | null
          processed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          stripe_event_id?: string
          event_type?: string
          organization_id?: string | null
          processed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          stripe_event_id?: string
          event_type?: string
          organization_id?: string | null
          processed_at?: string
          created_at?: string
        }
        Relationships: []
      }
      sync_log: {
        Row: {
          id: string
          source_table: string
          source_id: string
          target_table: string
          target_id: string
          old_status: string | null
          new_status: string | null
          sync_type: string
          created_at: string | null
        }
        Insert: {
          id?: string
          source_table?: string
          source_id?: string
          target_table?: string
          target_id?: string
          old_status?: string | null
          new_status?: string | null
          sync_type?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          source_table?: string
          source_id?: string
          target_table?: string
          target_id?: string
          old_status?: string | null
          new_status?: string | null
          sync_type?: string
          created_at?: string | null
        }
        Relationships: []
      }
      tavily_research_cache: {
        Row: {
          id: string
          organization_id: string
          research_query: string
          research_results: Json
          cached_until: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id?: string
          research_query?: string
          research_results?: Json
          cached_until?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          research_query?: string
          research_results?: Json
          cached_until?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          id: string
          email: string
          org_id: string
          role: string
          token: string
          status: string
          expires_at: string
          accepted_at: string | null
          created_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email?: string
          org_id?: string
          role?: string
          token?: string
          status?: string
          expires_at?: string
          accepted_at?: string | null
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          org_id?: string
          role?: string
          token?: string
          status?: string
          expires_at?: string
          accepted_at?: string | null
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          id: string
          organization_id: string
          metric_type: string
          usage_count: number
          billing_period: string
          last_updated: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id?: string
          metric_type?: string
          usage_count?: number
          billing_period?: string
          last_updated?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          metric_type?: string
          usage_count?: number
          billing_period?: string
          last_updated?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          org_id: string | null
          role: string
          created_at: string | null
          auth_user_id: string | null
          otp_verified: boolean | null
          first_name: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email?: string
          org_id?: string | null
          role?: string
          created_at?: string | null
          auth_user_id?: string | null
          otp_verified?: boolean | null
          first_name?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          org_id?: string | null
          role?: string
          created_at?: string | null
          auth_user_id?: string | null
          otp_verified?: boolean | null
          first_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_article_progress_sync: {
        Args: {
          [key: string]: never
        }
        Returns: unknown
      }
      cleanup_expired_invitations: {
        Args: {
          [key: string]: never
        }
        Returns: number
      }
      cleanup_expired_otp_codes: {
        Args: {
          [key: string]: never
        }
        Returns: unknown
      }
      cleanup_old_activities: {
        Args: {
          [key: string]: never
        }
        Returns: unknown
      }
      get_auth_user_org_id: {
        Args: {
          [key: string]: never
        }
        Returns: string
      }
      get_invitation_by_token: {
        Args: {
          token_input?: string
        }
        Returns: Database['public']['Tables']['team_invitations']['Row'][]
      }
      get_parallel_section_progress: {
        Args: {
          article_uuid?: string
        }
        Returns: number
      }
      log_article_activity_trigger: {
        Args: {
          [key: string]: never
        }
        Returns: unknown
      }
      log_user_joined_trigger: {
        Args: {
          [key: string]: never
        }
        Returns: unknown
      }
      sync_article_status_to_progress: {
        Args: {
          [key: string]: never
        }
        Returns: unknown
      }
      sync_article_status_to_progress_logged: {
        Args: {
          [key: string]: never
        }
        Returns: unknown
      }
      sync_progress_status_to_article: {
        Args: {
          [key: string]: never
        }
        Returns: unknown
      }
      sync_progress_status_to_article_logged: {
        Args: {
          [key: string]: never
        }
        Returns: unknown
      }
      update_parallel_section_status: {
        Args: {
          article_uuid?: string
          section_id?: string
          new_status?: string
        }
        Returns: boolean
      }
      update_performance_metrics: {
        Args: {
          [key: string]: never
        }
        Returns: unknown
      }
      update_updated_at_column: {
        Args: {
          [key: string]: never
        }
        Returns: unknown
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
