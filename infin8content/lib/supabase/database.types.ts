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
      [key: string]: any;
      activities: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          article_id: string | null
          activity_type: string
          activity_data: Json | null
          created_at: string | null
          [key: string]: any;
        }
        Insert: {
          id?: string
          organization_id?: string
          user_id?: string
          article_id?: string | null
          activity_type?: string
          activity_data?: Json | null
          created_at?: string | null
          [key: string]: any;
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          article_id?: string | null
          activity_type?: string
          activity_data?: Json | null
          created_at?: string | null
          [key: string]: any;
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
          [key: string]: any;
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
          [key: string]: any;
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
          [key: string]: any;
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
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
          article_usage?: number | null
          onboarding_completed?: boolean
          website_url?: string | null
          blog_config?: Json | null
          has_used_trial?: boolean | null
          plan_type?: string | null
          trial_ends_at?: string | null
          [key: string]: any;
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
          article_usage?: number | null
          onboarding_completed?: boolean
          website_url?: string | null
          blog_config?: Json | null
          has_used_trial?: boolean | null
          plan_type?: string | null
          trial_ends_at?: string | null
          [key: string]: any;
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
          article_usage?: number | null
          onboarding_completed?: boolean
          website_url?: string | null
          blog_config?: Json | null
          has_used_trial?: boolean | null
          plan_type?: string | null
          trial_ends_at?: string | null
          [key: string]: any;
        }
        Relationships: []
      }
      publish_references: {
        Row: {
          id: string
          article_id: string
          platform: string
          platform_post_id: string
          platform_url: string
          published_at: string
          created_at: string
          [key: string]: any;
        }
        Insert: {
          id?: string
          article_id: string
          platform: string
          platform_post_id: string
          platform_url: string
          published_at: string
          created_at?: string
          [key: string]: any;
        }
        Update: {
          id?: string
          article_id?: string
          platform?: string
          platform_post_id?: string
          platform_url?: string
          published_at?: string
          [key: string]: any;
        }
        Relationships: []
      }
      intent_workflows: {
        Row: {
          id: string
          organization_id: string
          name: string
          status: string
          [key: string]: any;
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          status?: string
          [key: string]: any;
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          status?: string
          [key: string]: any;
        }
        Relationships: []
      }
      organization_competitors: {
        Row: {
          id: string
          organization_id: string
          name: string
          url: string | null
          domain: string | null
          is_active: boolean
          created_at: string | null
          created_by: string | null
          [key: string]: any;
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          url?: string | null
          domain?: string | null
          is_active?: boolean
          created_at?: string | null
          created_by?: string | null
          [key: string]: any;
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          url?: string | null
          domain?: string | null
          is_active?: boolean
          created_at?: string | null
          created_by?: string | null
          [key: string]: any;
        }
        Relationships: []
      }
    }
    Views: {
      [key: string]: any;
    }
    Functions: {
      [key: string]: any;
      get_invitation_by_token: {
        Args: { token_input?: string }
        Returns: any[]
      }
    }
    Enums: {
      [key: string]: any;
    }
    CompositeTypes: {
      [key: string]: any;
    }
  }
}
