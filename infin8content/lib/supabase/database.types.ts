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
      organizations: {
        Row: {
          id: string
          name: string
          plan: 'starter' | 'pro' | 'agency'
          white_label_settings: Json
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          payment_status: 'pending_payment' | 'active' | 'suspended' | 'canceled' | 'past_due'
          payment_confirmed_at: string | null
          grace_period_started_at: string | null
          suspended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          plan: 'starter' | 'pro' | 'agency'
          white_label_settings?: Json
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          payment_status?: 'pending_payment' | 'active' | 'suspended' | 'canceled' | 'past_due'
          payment_confirmed_at?: string | null
          grace_period_started_at?: string | null
          suspended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          plan?: 'starter' | 'pro' | 'agency'
          white_label_settings?: Json
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          payment_status?: 'pending_payment' | 'active' | 'suspended' | 'canceled' | 'past_due'
          payment_confirmed_at?: string | null
          grace_period_started_at?: string | null
          suspended_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          org_id: string | null
          auth_user_id: string | null
          role: 'owner' | 'editor' | 'viewer'
          otp_verified: boolean
          first_name: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          org_id?: string | null
          auth_user_id?: string | null
          role: 'owner' | 'editor' | 'viewer'
          otp_verified?: boolean
          first_name?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          org_id?: string | null
          auth_user_id?: string | null
          role?: 'owner' | 'editor' | 'viewer'
          otp_verified?: boolean
          first_name?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      api_costs: {
        Row: {
          id: string
          organization_id: string
          service: string
          operation: string
          cost: number
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          service: string
          operation: string
          cost: number
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          service?: string
          operation?: string
          cost?: number
          created_at?: string
        }
      }
      tavily_research_cache: {
        Row: {
          id: string
          organization_id: string
          research_query: string
          research_results: Json
          cached_until: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          research_query: string
          research_results?: Json
          cached_until: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          research_query?: string
          research_results?: Json
          cached_until?: string
          created_at?: string
          updated_at?: string
        }
      }
      team_invitations: {
        Row: {
          id: string
          email: string
          org_id: string
          role: 'editor' | 'viewer'
          token: string
          status: 'pending' | 'accepted' | 'expired'
          expires_at: string
          accepted_at: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          org_id: string
          role: 'editor' | 'viewer'
          token: string
          status?: 'pending' | 'accepted' | 'expired'
          expires_at: string
          accepted_at?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          org_id?: string
          role?: 'editor' | 'viewer'
          token?: string
          status?: 'pending' | 'accepted' | 'expired'
          expires_at?: string
          accepted_at?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          org_id: string
          title: string | null
          keyword: string
          status: 'queued' | 'generating' | 'completed' | 'failed' | 'cancelled'
          target_word_count: number
          writing_style: string | null
          target_audience: string | null
          custom_instructions: string | null
          inngest_event_id: string | null
          created_by: string | null
          outline: Json | null
          sections: Json | null
          current_section_index: number | null
          generation_started_at: string | null
          generation_completed_at: string | null
          error_details: Json | null
          outline_generation_duration_ms: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          title?: string | null
          keyword: string
          status?: 'queued' | 'generating' | 'completed' | 'failed' | 'cancelled'
          target_word_count: number
          writing_style?: string | null
          target_audience?: string | null
          custom_instructions?: string | null
          inngest_event_id?: string | null
          created_by?: string | null
          outline?: Json | null
          sections?: Json | null
          current_section_index?: number | null
          generation_started_at?: string | null
          generation_completed_at?: string | null
          error_details?: Json | null
          outline_generation_duration_ms?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          title?: string | null
          keyword?: string
          status?: 'queued' | 'generating' | 'completed' | 'failed' | 'cancelled'
          target_word_count?: number
          writing_style?: string | null
          target_audience?: string | null
          custom_instructions?: string | null
          inngest_event_id?: string | null
          created_by?: string | null
          outline?: Json | null
          sections?: Json | null
          current_section_index?: number | null
          generation_started_at?: string | null
          generation_completed_at?: string | null
          error_details?: Json | null
          outline_generation_duration_ms?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
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
          org_id: string
          user_id?: string | null
          action: string
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
          organization_id: string
          user_id: string
          keyword: string
          results: Json
          api_cost: number
          cached_until: string
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
          user_id: string
          email: string
          code: string
          expires_at: string
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
          organization_id: string
          keyword: string
          analysis_data: Json
          cached_until: string
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
          stripe_event_id: string
          event_type: string
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
          organization_id: string
          metric_type: string
          usage_count?: number
          billing_period: string
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
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_invitation_by_token: {
        Args: {
          token_input: string
        }
        Returns: Array<{
          id: string
          email: string
          org_id: string
          role: 'editor' | 'viewer'
          token: string
          status: 'pending' | 'accepted' | 'expired'
          expires_at: string
          accepted_at: string | null
          created_by: string
          created_at: string
          updated_at: string
        }>
      }
      get_auth_user_org_id: {
        Args: Record<string, never>
        Returns: string | null
      }
      is_org_member: {
        Args: {
          org_id: string
        }
        Returns: boolean
      }
      is_org_owner: {
        Args: {
          org_id: string
        }
        Returns: boolean
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

