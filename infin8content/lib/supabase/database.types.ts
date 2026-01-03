// Generated TypeScript types from Supabase database schema
// Generated from migrations: 20260101124156_initial_schema.sql, 20260104095303_link_auth_users.sql
// Tables: organizations, users

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
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          org_id?: string | null
          auth_user_id?: string | null
          role: 'owner' | 'editor' | 'viewer'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          org_id?: string | null
          auth_user_id?: string | null
          role?: 'owner' | 'editor' | 'viewer'
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
