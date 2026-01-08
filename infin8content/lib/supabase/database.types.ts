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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          org_id?: string | null
          auth_user_id?: string | null
          role: 'owner' | 'editor' | 'viewer'
          otp_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          org_id?: string | null
          auth_user_id?: string | null
          role?: 'owner' | 'editor' | 'viewer'
          otp_verified?: boolean
          created_at?: string
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

