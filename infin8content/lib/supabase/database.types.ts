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
            audit_logs: {
                Row: {
                    action: string
                    created_at: string
                    details: Json
                    id: string
                    ip_address: string | null
                    org_id: string
                    user_agent: string | null
                    user_id: string | null
                }
                Insert: {
                    action: string
                    created_at?: string
                    details?: Json
                    id?: string
                    ip_address?: string | null
                    org_id: string
                    user_agent?: string | null
                    user_id?: string | null
                }
                Update: {
                    action?: string
                    created_at?: string
                    details?: Json
                    id?: string
                    ip_address?: string | null
                    org_id?: string
                    user_agent?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "audit_logs_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "audit_logs_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            organizations: {
                Row: {
                    created_at: string
                    grace_period_started_at: string | null
                    id: string
                    name: string
                    payment_confirmed_at: string | null
                    payment_status: "pending_payment" | "active" | "past_due" | "suspended" | "canceled"
                    plan: "starter" | "pro" | "agency"
                    stripe_customer_id: string | null
                    stripe_subscription_id: string | null
                    suspended_at: string | null
                    updated_at: string
                    white_label_settings: Json | null
                }
                Insert: {
                    created_at?: string
                    grace_period_started_at?: string | null
                    id?: string
                    name: string
                    payment_confirmed_at?: string | null
                    payment_status?: "pending_payment" | "active" | "past_due" | "suspended" | "canceled"
                    plan: "starter" | "pro" | "agency"
                    stripe_customer_id?: string | null
                    stripe_subscription_id?: string | null
                    suspended_at?: string | null
                    updated_at?: string
                    white_label_settings?: Json | null
                }
                Update: {
                    created_at?: string
                    grace_period_started_at?: string | null
                    id?: string
                    name?: string
                    payment_confirmed_at?: string | null
                    payment_status?: "pending_payment" | "active" | "past_due" | "suspended" | "canceled"
                    plan?: "starter" | "pro" | "agency"
                    stripe_customer_id?: string | null
                    stripe_subscription_id?: string | null
                    suspended_at?: string | null
                    updated_at?: string
                    white_label_settings?: Json | null
                }
                Relationships: []
            }
            otp_codes: {
                Row: {
                    code: string
                    created_at: string
                    email: string
                    expires_at: string
                    id: string
                    user_id: string
                    verified_at: string | null
                }
                Insert: {
                    code: string
                    created_at?: string
                    email: string
                    expires_at: string
                    id?: string
                    user_id: string
                    verified_at?: string | null
                }
                Update: {
                    code?: string
                    created_at?: string
                    email?: string
                    expires_at?: string
                    id?: string
                    user_id?: string
                    verified_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "otp_codes_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            stripe_webhook_events: {
                Row: {
                    created_at: string
                    event_type: string
                    id: string
                    organization_id: string | null
                    processed_at: string
                    stripe_event_id: string
                }
                Insert: {
                    created_at?: string
                    event_type: string
                    id?: string
                    organization_id?: string | null
                    processed_at?: string
                    stripe_event_id: string
                }
                Update: {
                    created_at?: string
                    event_type?: string
                    id?: string
                    organization_id?: string | null
                    processed_at?: string
                    stripe_event_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "stripe_webhook_events_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            team_invitations: {
                Row: {
                    accepted_at: string | null
                    created_at: string
                    created_by: string
                    email: string
                    expires_at: string
                    id: string
                    org_id: string
                    role: "editor" | "viewer"
                    status: "pending" | "accepted" | "expired"
                    token: string
                    updated_at: string
                }
                Insert: {
                    accepted_at?: string | null
                    created_at?: string
                    created_by: string
                    email: string
                    expires_at: string
                    id?: string
                    org_id: string
                    role: "editor" | "viewer"
                    status?: "pending" | "accepted" | "expired"
                    token: string
                    updated_at?: string
                }
                Update: {
                    accepted_at?: string | null
                    created_at?: string
                    created_by?: string
                    email?: string
                    expires_at?: string
                    id?: string
                    org_id?: string
                    role?: "editor" | "viewer"
                    status?: "pending" | "accepted" | "expired"
                    token?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "team_invitations_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "team_invitations_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            users: {
                Row: {
                    auth_user_id: string | null
                    created_at: string
                    email: string
                    id: string
                    org_id: string | null
                    otp_verified: boolean
                    role: "owner" | "editor" | "viewer"
                }
                Insert: {
                    auth_user_id?: string | null
                    created_at?: string
                    email: string
                    id?: string
                    org_id?: string | null
                    otp_verified?: boolean
                    role: "owner" | "editor" | "viewer"
                }
                Update: {
                    auth_user_id?: string | null
                    created_at?: string
                    email?: string
                    id?: string
                    org_id?: string | null
                    otp_verified?: boolean
                    role?: "owner" | "editor" | "viewer"
                }
                Relationships: [
                    {
                        foreignKeyName: "users_auth_user_id_fkey"
                        columns: ["auth_user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "users_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
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
            get_invitation_by_token: {
                Args: {
                    token_input: string
                }
                Returns: {
                    accepted_at: string | null
                    created_at: string
                    created_by: string
                    email: string
                    expires_at: string
                    id: string
                    org_id: string
                    role: "editor" | "viewer"
                    status: "pending" | "accepted" | "expired"
                    token: string
                    updated_at: string
                }[]
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
