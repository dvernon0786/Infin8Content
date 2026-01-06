// Generated TypeScript types from Supabase database schema
// Generated from migrations: 20260101124156_initial_schema.sql, 20260104095303_link_auth_users.sql, 20260104100500_add_otp_verification.sql, 20260105003507_add_stripe_payment_fields.sql, 20260105074811_add_payment_grace_period_fields.sql, 20260105094538_add_team_invitations.sql
// Tables: organizations, users, otp_codes, stripe_webhook_events, team_invitations

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
          payment_status: 'pending_payment' | 'active' | 'past_due' | 'suspended' | 'canceled'
          payment_confirmed_at: string | null
          grace_period_started_at: string | null
          suspended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          plan?: 'starter' | 'pro' | 'agency'
          white_label_settings?: Json
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          payment_status?: 'pending_payment' | 'active' | 'past_due' | 'suspended' | 'canceled'
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
          payment_status?: 'pending_payment' | 'active' | 'past_due' | 'suspended' | 'canceled'
          payment_confirmed_at?: string | null
          grace_period_started_at?: string | null
          suspended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        }
        Insert: {
          id?: string
          email: string
          org_id?: string | null
          auth_user_id?: string | null
          role?: 'owner' | 'editor' | 'viewer'
          otp_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          org_id?: string | null
          auth_user_id?: string | null
          role?: 'owner' | 'editor' | 'viewer'
          otp_verified?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_auth_user_id_fkey"
            columns: ["auth_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      otp_codes: {
        Row: {
          id: string
          user_id: string
          email: string
          code: string
          expires_at: string
          verified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          code: string
          expires_at: string
          verified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          code?: string
          expires_at?: string
          verified_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "otp_codes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "stripe_webhook_events_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "team_invitations_org_id_fkey"
            columns: ["org_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Returns: {
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
        }[]
      }
      get_auth_user_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string | null
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
