// Feature Flag Types
// Story 33-4: Enable Intent Engine Feature Flag

export interface FeatureFlag {
  id: string;
  organization_id: string;
  flag_key: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface CreateFeatureFlagRequest {
  organization_id: string;
  flag_key: string;
  enabled: boolean;
}

export interface FeatureFlagResponse {
  id: string;
  organization_id: string;
  flag_key: string;
  enabled: boolean;
  updated_at: string;
}

export interface FeatureFlagError {
  error: string;
  details?: string[];
}

export interface FeatureFlagValidationError extends FeatureFlagError {
  details: string[];
}

// Feature flag keys constants
export const FEATURE_FLAG_KEYS = {
  ENABLE_INTENT_ENGINE: 'ENABLE_INTENT_ENGINE',
} as const;

export type FeatureFlagKey = typeof FEATURE_FLAG_KEYS[keyof typeof FEATURE_FLAG_KEYS];
