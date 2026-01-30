import { createClient } from '@/lib/supabase/server'
import type { ICPSettings, CreateICPSettingsRequest, UpdateICPSettingsRequest } from '@/types/icp'

/**
 * Service layer for ICP (Ideal Customer Profile) operations
 * Handles database operations with proper error handling and caching
 */

// Cache for ICP settings to reduce database queries
const icpCache = new Map<string, { data: ICPSettings; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Retrieves ICP settings for an organization with caching
 * @param organizationId - The organization ID to fetch ICP settings for
 * @returns Promise<ICPSettings | null> - ICP settings or null if not found
 */
export async function getICPSettings(organizationId: string): Promise<ICPSettings | null> {
  // Check cache first
  const cached = icpCache.get(organizationId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('icp_settings')
      .select(`
        id,
        organization_id,
        target_industries,
        buyer_roles,
        pain_points,
        value_proposition,
        created_at,
        created_by,
        updated_at,
        encrypted_data
      `)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null
      }
      throw new Error(`Failed to fetch ICP settings: ${error.message}`)
    }

    if (!data) {
      return null
    }

    const icpSettings = data as unknown as ICPSettings

    // Update cache
    icpCache.set(organizationId, {
      data: icpSettings,
      timestamp: Date.now()
    })

    return icpSettings
  } catch (error) {
    console.error('Error in getICPSettings:', error)
    throw error
  }
}

/**
 * Creates or updates ICP settings for an organization
 * @param organizationId - The organization ID
 * @param userId - The user ID creating/updating the settings
 * @param icpData - The ICP configuration data
 * @returns Promise<ICPSettings> - The created or updated ICP settings
 */
export async function upsertICPSettings(
  organizationId: string,
  userId: string,
  icpData: CreateICPSettingsRequest
): Promise<ICPSettings> {
  const supabase = await createClient()

  try {
    // Prepare encrypted data (for future use)
    const encryptedData = {
      // Future: Add encryption for sensitive fields
      created_at: new Date().toISOString(),
      version: '1.0'
    }

    const payload = {
      organization_id: organizationId,
      target_industries: icpData.target_industries.map(industry => industry.trim()),
      buyer_roles: icpData.buyer_roles.map(role => role.trim()),
      pain_points: icpData.pain_points.map(point => point.trim()),
      value_proposition: icpData.value_proposition.trim(),
      encrypted_data: encryptedData,
      updated_at: new Date().toISOString()
    }

    // Use upsert to handle both create and update cases
    const { data, error } = await supabase
      .from('icp_settings')
      .upsert({
        ...payload,
        created_by: userId // Include created_by for insert case
      }, {
        onConflict: 'organization_id',
        ignoreDuplicates: false
      })
      .select(`
        id,
        organization_id,
        target_industries,
        buyer_roles,
        pain_points,
        value_proposition,
        created_at,
        created_by,
        updated_at,
        encrypted_data
      `)
      .single()

    if (error) {
      throw new Error(`Failed to upsert ICP settings: ${error.message}`)
    }

    if (!data) {
      throw new Error('No data returned from ICP settings upsert')
    }

    const icpSettings = data as unknown as ICPSettings

    // Update cache
    icpCache.set(organizationId, {
      data: icpSettings,
      timestamp: Date.now()
    })

    return icpSettings
  } catch (error) {
    console.error('Error in upsertICPSettings:', error)
    throw error
  }
}

/**
 * Updates existing ICP settings for an organization
 * @param organizationId - The organization ID
 * @param userId - The user ID updating the settings
 * @param updates - The fields to update
 * @returns Promise<ICPSettings> - The updated ICP settings
 */
export async function updateICPSettings(
  organizationId: string,
  userId: string,
  updates: UpdateICPSettingsRequest
): Promise<ICPSettings> {
  const supabase = await createClient()

  try {
    // Prepare update payload
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    }

    if (updates.target_industries) {
      updatePayload.target_industries = updates.target_industries.map(industry => industry.trim())
    }
    if (updates.buyer_roles) {
      updatePayload.buyer_roles = updates.buyer_roles.map(role => role.trim())
    }
    if (updates.pain_points) {
      updatePayload.pain_points = updates.pain_points.map(point => point.trim())
    }
    if (updates.value_proposition) {
      updatePayload.value_proposition = updates.value_proposition.trim()
    }

    const { data, error } = await supabase
      .from('icp_settings')
      .update(updatePayload)
      .eq('organization_id', organizationId)
      .select(`
        id,
        organization_id,
        target_industries,
        buyer_roles,
        pain_points,
        value_proposition,
        created_at,
        created_by,
        updated_at,
        encrypted_data
      `)
      .single()

    if (error) {
      throw new Error(`Failed to update ICP settings: ${error.message}`)
    }

    if (!data) {
      throw new Error('No data returned from ICP settings update')
    }

    const icpSettings = data as unknown as ICPSettings

    // Update cache
    icpCache.set(organizationId, {
      data: icpSettings,
      timestamp: Date.now()
    })

    return icpSettings
  } catch (error) {
    console.error('Error in updateICPSettings:', error)
    throw error
  }
}

/**
 * Deletes ICP settings for an organization
 * @param organizationId - The organization ID
 * @returns Promise<boolean> - True if deleted successfully
 */
export async function deleteICPSettings(organizationId: string): Promise<boolean> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('icp_settings')
      .delete()
      .eq('organization_id', organizationId)

    if (error) {
      throw new Error(`Failed to delete ICP settings: ${error.message}`)
    }

    // Remove from cache
    icpCache.delete(organizationId)

    return true
  } catch (error) {
    console.error('Error in deleteICPSettings:', error)
    throw error
  }
}

/**
 * Validates if a user has access to ICP settings for an organization
 * @param userId - The user ID
 * @param organizationId - The organization ID
 * @returns Promise<boolean> - True if user has access
 */
export async function validateICPAccess(userId: string, organizationId: string): Promise<boolean> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', userId)
      .eq('org_id', organizationId)
      .single()

    if (error) {
      return false
    }

    if (!data) {
      return false
    }

    // Only owners and admins can manage ICP settings
    const user = data as unknown as { org_id: string; role: string }
    return user.role === 'owner' || user.role === 'admin'
  } catch (error) {
    console.error('Error in validateICPAccess:', error)
    return false
  }
}

/**
 * Clears the ICP cache for a specific organization
 * @param organizationId - The organization ID to clear cache for
 */
export function clearICPCache(organizationId: string): void {
  icpCache.delete(organizationId)
}

/**
 * Clears all ICP cache (useful for testing or admin operations)
 */
export function clearAllICPCache(): void {
  icpCache.clear()
}
