// Feature Flag Utility Functions
// Story 33-4: Enable Intent Engine Feature Flag

import { createClient } from '@supabase/supabase-js'
import { FeatureFlag, FeatureFlagKey } from '@/lib/types/feature-flag'

// Structured logging helper
function logFeatureFlagEvent(level: 'info' | 'warn' | 'error', message: string, context: Record<string, any> = {}) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    ...context
  }
  
  if (level === 'error') {
    console.error(JSON.stringify(logEntry))
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logEntry))
  } else {
    console.log(JSON.stringify(logEntry))
  }
}

// Check if feature flag is enabled for organization
export async function isFeatureFlagEnabled(
  organizationId: string, 
  flagKey: string
): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('organization_id', organizationId)
      .eq('flag_key', flagKey)
      .single()

    if (error) {
      // If flag doesn't exist, default to disabled (fail-safe)
      if (error.code === 'PGRST116') {
        logFeatureFlagEvent('warn', 'Feature flag not found, defaulting to disabled', {
          flagKey,
          organizationId,
          errorCode: error.code
        })
        return false
      }
      
      // Log error for monitoring but default to disabled
      logFeatureFlagEvent('error', 'Error checking feature flag', {
        flagKey,
        organizationId,
        error: error.message
      })
      return false
    }

    return data?.enabled || false
  } catch (error) {
    logFeatureFlagEvent('error', 'Database error checking feature flag', {
      flagKey,
      organizationId,
      error: error instanceof Error ? error.message : String(error)
    })
    return false // Fail-safe: default to disabled
  }
}

// Get feature flag state with metadata
export async function getFeatureFlag(
  organizationId: string, 
  flagKey: string
): Promise<FeatureFlag | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('flag_key', flagKey)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        logFeatureFlagEvent('info', 'Feature flag not found', {
          flagKey,
          organizationId
        })
        return null // Flag doesn't exist
      }
      throw error
    }

    return data
  } catch (error) {
    logFeatureFlagEvent('error', 'Error getting feature flag', {
      flagKey,
      organizationId,
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

// Toggle feature flag (admin only)
export async function toggleFeatureFlag(
  organizationId: string,
  flagKey: string,
  enabled: boolean,
  userId: string
): Promise<FeatureFlag> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Upsert the feature flag
    const { data, error } = await supabase
      .from('feature_flags')
      .upsert({
        organization_id: organizationId,
        flag_key: flagKey,
        enabled: enabled,
        updated_by: userId
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      const errorMsg = 'Failed to create/update feature flag'
      logFeatureFlagEvent('error', errorMsg, {
        flagKey,
        organizationId,
        userId
      })
      throw new Error(errorMsg)
    }

    return data
  } catch (error) {
    logFeatureFlagEvent('error', 'Error toggling feature flag', {
      flagKey,
      organizationId,
      userId,
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}
