// Generated TypeScript types from Supabase database schema
// Generated from migration: 20260101124156_initial_schema.sql
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
          org_id: string
          role: 'owner' | 'editor' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          org_id: string
          role: 'owner' | 'editor' | 'viewer'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          org_id?: string
          role?: 'owner' | 'editor' | 'viewer'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            referencedRelation: "organizations"
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
