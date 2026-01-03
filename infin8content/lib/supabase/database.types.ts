// Generated TypeScript types from Supabase database schema
// Generated from migrations: 20260101124156_initial_schema.sql, 20260104095303_link_auth_users.sql, 20260104100500_add_otp_verification.sql
// Tables: organizations, users, otp_codes

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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          plan: 'starter' | 'pro' | 'agency'
          white_label_settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          plan?: 'starter' | 'pro' | 'agency'
          white_label_settings?: Json
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
