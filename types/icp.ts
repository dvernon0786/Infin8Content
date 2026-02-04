// ICP (Ideal Customer Profile) types for Story 33.2
// Multi-tenant ICP configuration with organization isolation and encryption

export interface ICPSettings {
  id: string
  organization_id: string
  target_industries: string[]
  buyer_roles: string[]
  pain_points: string[]
  value_proposition: string
  created_at: string
  created_by: string
  updated_at: string
  // Encrypted fields stored as JSONB
  encrypted_data: Record<string, any>
}

export interface CreateICPSettingsRequest {
  target_industries: string[]
  buyer_roles: string[]
  pain_points: string[]
  value_proposition: string
  organization_id?: string // Optional, will use user's org if not provided
}

export interface CreateICPSettingsResponse {
  id: string
  organization_id: string
  target_industries: string[]
  buyer_roles: string[]
  pain_points: string[]
  value_proposition: string
  created_at: string
}

export interface UpdateICPSettingsRequest {
  target_industries?: string[]
  buyer_roles?: string[]
  pain_points?: string[]
  value_proposition?: string
}

export interface ICPSettingsError {
  error: string
  message: string
  details?: Record<string, any>
}

// Database types for Supabase
export interface ICPSettingsInsert {
  id?: string
  organization_id: string
  target_industries: string[]
  buyer_roles: string[]
  pain_points: string[]
  value_proposition: string
  created_by: string
  encrypted_data?: Record<string, any>
}

export interface ICPSettingsUpdate {
  target_industries?: string[]
  buyer_roles?: string[]
  pain_points?: string[]
  value_proposition?: string
  encrypted_data?: Record<string, any>
}

// Validation constants
export const MAX_INDUSTRIES = 10
export const MAX_BUYER_ROLES = 10
export const MAX_PAIN_POINTS = 20
export const MAX_VALUE_PROPOSITION_LENGTH = 500

export const icpValidationRules = {
  target_industries: {
    min: 1,
    max: MAX_INDUSTRIES,
    maxLength: 50
  },
  buyer_roles: {
    min: 1,
    max: MAX_BUYER_ROLES,
    maxLength: 50
  },
  pain_points: {
    min: 1,
    max: MAX_PAIN_POINTS,
    maxLength: 200
  },
  value_proposition: {
    min: 10,
    max: MAX_VALUE_PROPOSITION_LENGTH
  }
} as const
